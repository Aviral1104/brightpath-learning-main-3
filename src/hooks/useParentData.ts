import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient, isBackendConfigured } from '@/integrations/backend/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LinkedStudent {
  id: string;
  name: string;
  email: string;
  school?: string;
}

/**
 * Returns the child student profile linked to the authenticated parent.
 * Returns null if not configured or no link exists.
 */
export function useLinkedStudent() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['linked-student', user?.id],
    queryFn: async (): Promise<LinkedStudent | null> => {
      if (!user?.id || !isBackendConfigured) return null;
      const supabase = getSupabaseClient();

      const { data: link } = await supabase
        .from('parent_student_links' as any)
        .select('student_id')
        .eq('parent_id', user.id)
        .single();

      if (!link?.student_id) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, name, email, school')
        .eq('user_id', link.student_id)
        .single();

      if (!profile) return null;

      return {
        id: profile.user_id,
        name: profile.name,
        email: profile.email,
        school: profile.school ?? undefined,
      };
    },
    enabled: !!user && user.role === 'parent',
  });
}

/**
 * Returns all submissions for the parent's linked child, with assignment names.
 */
export function useChildSubmissions(childId: string | undefined) {
  return useQuery({
    queryKey: ['child-submissions', childId],
    queryFn: async () => {
      if (!childId || !isBackendConfigured) return [];
      const supabase = getSupabaseClient();

      const { data: submissions } = await supabase
        .from('submissions' as any)
        .select('*, assignments(title, course_icon, course_title, due_date)')
        .eq('student_id', childId)
        .order('created_at', { ascending: false });

      return (submissions || []) as any[];
    },
    enabled: !!childId,
  });
}
