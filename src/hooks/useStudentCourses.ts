import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, where, orderBy, getDocs, addDoc, deleteDoc,
  doc, getDoc
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { CourseWithContent, DbSubchapter } from './useCourses';

const toDate = (v: any) => v?.toDate?.()?.toISOString() || new Date().toISOString();

export function useAllCourses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['all-courses', user?.id],
    queryFn: async (): Promise<(CourseWithContent & { teacherName: string; isEnrolled: boolean })[]> => {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      if (coursesSnap.empty) return [];
      const courses = coursesSnap.docs
        .map(d => ({ id: d.id, ...d.data(), created_at: toDate(d.data().created_at), updated_at: toDate(d.data().updated_at) }))
        .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at)) as any[];

      // Teacher names
      const teacherIds = [...new Set(courses.map((c: any) => c.teacher_id))];
      const nameMap: Record<string, string> = {};
      await Promise.all(teacherIds.map(async (tid) => {
        const snap = await getDoc(doc(db, 'profiles', tid as string));
        if (snap.exists()) nameMap[tid as string] = snap.data().name;
      }));

      // Enrollments
      let enrolledIds = new Set<string>();
      if (user?.id) {
        const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('student_id', '==', user.id)));
        enrolledIds = new Set(enrollSnap.docs.map(d => d.data().course_id));
      }

      // Chapters & Subchapters
      return Promise.all(courses.map(async (course: any) => {
        const chapSnap = await getDocs(query(collection(db, 'chapters'), where('course_id', '==', course.id)));
        const chapters = chapSnap.docs.map(d => ({ id: d.id, ...d.data(), created_at: toDate(d.data().created_at) })).sort((a: any, b: any) => a.sort_order - b.sort_order) as any[];
        const subchapters: DbSubchapter[] = [];
        for (const ch of chapters) {
          const subSnap = await getDocs(query(collection(db, 'subchapters'), where('chapter_id', '==', ch.id)));
          subchapters.push(...subSnap.docs.map(d => ({ id: d.id, ...d.data(), created_at: toDate(d.data().created_at) })).sort((a: any, b: any) => a.sort_order - b.sort_order) as DbSubchapter[]);
        }
        return {
          ...course,
          teacherName: nameMap[course.teacher_id] || 'Teacher',
          isEnrolled: enrolledIds.has(course.id),
          chapters: chapters.map(ch => ({ ...ch, subchapters: subchapters.filter(s => s.chapter_id === ch.id) })),
        };
      }));
    },
    enabled: !!user,
  });
}

export function useEnrollCourse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) return;
      // Check no duplicate
      const existing = await getDocs(query(collection(db, 'enrollments'), where('course_id', '==', courseId), where('student_id', '==', user.id)));
      if (existing.empty) {
        await addDoc(collection(db, 'enrollments'), { course_id: courseId, student_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-courses'] }),
  });
}

export function useUnenrollCourse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user?.id) return;
      const snap = await getDocs(query(collection(db, 'enrollments'), where('course_id', '==', courseId), where('student_id', '==', user.id)));
      await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-courses'] }),
  });
}
