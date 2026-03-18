import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient, isBackendConfigured } from '@/integrations/backend/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CourseWithContent, DbCourse, DbSubchapter } from './useCourses';

export function useAllCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-courses', user?.id],
    queryFn: async (): Promise<CourseWithContent[]> => {
      const supabase = getSupabaseClient();

      const { data: courses, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!courses?.length) return [];

      const courseIds = courses.map((c) => c.id);

      const { data: chapters } = await supabase
        .from('chapters')
        .select('*')
        .in('course_id', courseIds)
        .order('sort_order');

      const chapterIds = (chapters || []).map((ch) => ch.id);
      let subchapters: DbSubchapter[] = [];
      if (chapterIds.length > 0) {
        const { data } = await supabase
          .from('subchapters')
          .select('*')
          .in('chapter_id', chapterIds)
          .order('sort_order');
        subchapters = (data || []) as DbSubchapter[];
      }

      // Get teacher profiles for display
      const teacherIds = [...new Set(courses.map((c) => c.teacher_id))];
      const { data: profiles } = await supabase
        .from('public_profiles' as any)
        .select('user_id, name')
        .in('user_id', teacherIds);
      const teacherNameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name]));

      // Get enrollments for the current user
      let enrolledIds = new Set<string>();
      if (user?.id && isBackendConfigured) {
        const { data: enrollments } = await supabase
          .from('course_enrollments' as any)
          .select('course_id')
          .eq('student_id', user.id);
        enrolledIds = new Set((enrollments || []).map((e: any) => e.course_id));
      }

      return courses.map((course) => {
        const courseChapters = (chapters || []).filter((ch) => ch.course_id === course.id);
        return {
          ...course,
          teacherName: teacherNameMap.get(course.teacher_id) || 'Teacher',
          isEnrolled: enrolledIds.has(course.id),
          chapters: courseChapters.map((ch) => ({
            ...ch,
            subchapters: subchapters.filter((s) => s.chapter_id === ch.id),
          })),
        };
      }) as (CourseWithContent & { teacherName: string; isEnrolled: boolean })[];
    },
    enabled: !!user,
  });
}

export function useEnrollCourse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!isBackendConfigured || !user?.id) return;
      const supabase = getSupabaseClient();
      await supabase
        .from('course_enrollments' as any)
        .upsert({ course_id: courseId, student_id: user.id }, { onConflict: 'course_id,student_id' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-courses'] }),
  });
}

export function useUnenrollCourse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!isBackendConfigured || !user?.id) return;
      const supabase = getSupabaseClient();
      await supabase
        .from('course_enrollments' as any)
        .delete()
        .eq('course_id', courseId)
        .eq('student_id', user.id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-courses'] }),
  });
}
