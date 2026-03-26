import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StudentStats {
  enrolledCourses: number;
  pendingAssignments: number;
  completedAssignments: number;
}

export function useStudentStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-stats', user?.id],
    queryFn: async (): Promise<StudentStats> => {
      if (!user?.id) return { enrolledCourses: 0, pendingAssignments: 0, completedAssignments: 0 };

      const [enrollSnap, submissionSnap] = await Promise.all([
        getDocs(query(collection(db, 'enrollments'), where('student_id', '==', user.id))),
        getDocs(query(collection(db, 'submissions'), where('student_id', '==', user.id))),
      ]);

      return {
        enrolledCourses: enrollSnap.size,
        completedAssignments: submissionSnap.size,
        pendingAssignments: 0,
      };
    },
    enabled: !!user && user.role === 'student',
  });
}
