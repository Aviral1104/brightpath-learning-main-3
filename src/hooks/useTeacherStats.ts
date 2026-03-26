import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TeacherStats {
  enrolledStudents: number;
  totalAssignments: number;
  pendingReviews: number;
}

export function useTeacherStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-stats', user?.id],
    queryFn: async (): Promise<TeacherStats> => {
      if (!user?.id) return { enrolledStudents: 0, totalAssignments: 0, pendingReviews: 0 };

      // Get all courses owned by this teacher
      const coursesSnap = await getDocs(query(collection(db, 'courses'), where('teacher_id', '==', user.id)));
      const courseIds = coursesSnap.docs.map(d => d.id);

      let enrolledStudents = 0;
      let pendingReviews = 0;

      if (courseIds.length > 0) {
        // Count unique students enrolled in teacher's courses
        const enrollSnap = await getDocs(query(collection(db, 'enrollments'), where('course_id', 'in', courseIds.slice(0, 10))));
        const uniqueStudents = new Set(enrollSnap.docs.map(d => d.data().student_id));
        enrolledStudents = uniqueStudents.size;

        // Count pending reviews (submissions without feedback)
        const assignSnap = await getDocs(query(collection(db, 'assignments'), where('teacher_id', '==', user.id)));
        const assignIds = assignSnap.docs.map(d => d.id);
        if (assignIds.length > 0) {
          const subsSnap = await getDocs(query(collection(db, 'submissions'), where('assignment_id', 'in', assignIds.slice(0, 10))));
          pendingReviews = subsSnap.docs.filter(d => !d.data().feedback).length;
        }
      }

      const assignSnap = await getDocs(query(collection(db, 'assignments'), where('teacher_id', '==', user.id)));

      return {
        enrolledStudents,
        totalAssignments: assignSnap.size,
        pendingReviews,
      };
    },
    enabled: !!user && user.role === 'teacher',
  });
}
