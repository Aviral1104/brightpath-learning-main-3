import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, getDoc, doc, limit } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LinkedStudent {
  id: string;
  name: string;
  email: string;
  school?: string;
}

export function useLinkedStudent() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['linked-student', user?.id],
    queryFn: async (): Promise<LinkedStudent | null> => {
      if (!user?.id) return null;
      const snap = await getDocs(
        query(collection(db, 'parent_student_links'), where('parent_id', '==', user.id), limit(1))
      );
      if (snap.empty) return null;
      const studentId = snap.docs[0].data().student_id;
      const profileSnap = await getDoc(doc(db, 'profiles', studentId));
      if (!profileSnap.exists()) return null;
      const p = profileSnap.data();
      return { id: studentId, name: p.name, email: p.email, school: p.school };
    },
    enabled: !!user && user.role === 'parent',
  });
}

export function useChildSubmissions(childId: string | undefined) {
  return useQuery({
    queryKey: ['child-submissions', childId],
    queryFn: async () => {
      if (!childId) return [];
      const snap = await getDocs(query(collection(db, 'submissions'), where('student_id', '==', childId)));
      const submissions = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      // Enrich each submission with the assignment title
      const enriched = await Promise.all(
        submissions.map(async (sub) => {
          const assignmentId = sub.assignment_id;
          if (assignmentId) {
            const assignSnap = await getDoc(doc(db, 'assignments', assignmentId));
            if (assignSnap.exists()) {
              sub.assignmentTitle = assignSnap.data().title || null;
            }
          }
          return sub;
        })
      );

      return enriched;
    },
    enabled: !!childId,
  });
}
