import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection, query, where, orderBy, getDocs, addDoc, updateDoc,
  doc, getDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DbAssignment {
  id: string;
  title: string;
  course_id: string;
  chapter_id: string | null;
  teacher_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  due_date: string | null;
  created_at: string;
}

export interface DbQuestion {
  id: string;
  assignment_id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sort_order: number;
}

export interface DbOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface DbSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  answers: Record<string, string>;
  score: number;
  total_questions: number;
  feedback: string | null;
  insights: string | null;
  submitted_at: string;
}

export interface FullAssignment extends DbAssignment {
  questions: (DbQuestion & { options: DbOption[] })[];
  course_title?: string;
  course_icon?: string;
}

const toDate = (v: any) => v?.toDate?.()?.toISOString() || new Date().toISOString();

async function fetchAssignmentsWithDetails(filter: { teacher_id?: string; course_ids?: string[] }): Promise<FullAssignment[]> {
  if (filter.course_ids && filter.course_ids.length === 0) return [];

  let assignmentSnap;
  if (filter.teacher_id) {
    assignmentSnap = await getDocs(query(collection(db, 'assignments'), where('teacher_id', '==', filter.teacher_id)));
  } else if (filter.course_ids && filter.course_ids.length > 0) {
    assignmentSnap = await getDocs(query(collection(db, 'assignments'), where('course_id', 'in', filter.course_ids.slice(0, 10))));
  } else {
    return [];
  }

  if (assignmentSnap.empty) return [];
  const assignments = assignmentSnap.docs
    .map(d => ({ id: d.id, ...d.data(), created_at: toDate(d.data().created_at) }))
    .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at)) as any[];

  // Fetch course info
  const courseIds = [...new Set(assignments.map((a: any) => a.course_id))];
  const courseMap: Record<string, any> = {};
  await Promise.all(courseIds.map(async (cid) => {
    const snap = await getDoc(doc(db, 'courses', cid as string));
    if (snap.exists()) courseMap[cid as string] = snap.data();
  }));

  // Fetch questions and options
  return Promise.all(assignments.map(async (a: any) => {
    const qSnap = await getDocs(query(collection(db, 'mcq_questions'), where('assignment_id', '==', a.id)));
    const questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.sort_order - b.sort_order) as DbQuestion[];
    const questionsWithOptions = await Promise.all(
      questions.map(async (q) => {
        const oSnap = await getDocs(query(collection(db, 'mcq_options'), where('question_id', '==', q.id)));
        return { ...q, options: oSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.sort_order - b.sort_order) as DbOption[] };
      })
    );
    return {
      ...a,
      course_title: courseMap[a.course_id]?.title,
      course_icon: courseMap[a.course_id]?.icon,
      questions: questionsWithOptions,
    };
  }));
}

export function useTeacherAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assignments', 'teacher', user?.id],
    queryFn: () => fetchAssignmentsWithDetails({ teacher_id: user!.id }),
    enabled: !!user && user.role === 'teacher',
  });
}

export function useStudentAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assignments', 'student', user?.id],
    queryFn: async () => {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const courseIds = coursesSnap.docs.map(d => d.id);
      return fetchAssignmentsWithDetails({ course_ids: courseIds });
    },
    enabled: !!user && user.role === 'student',
  });
}

export interface CreateAssignmentInput {
  title: string;
  course_id: string;
  chapter_id?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  due_date?: string;
  questions: {
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    options: { text: string; is_correct: boolean }[];
  }[];
}

export function useCreateAssignment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      const title = input.title?.trim();
      if (!title) throw new Error('Title is required.');
      if (input.questions.length === 0) throw new Error('Add at least one question.');

      for (const q of input.questions) {
        if (!q.question.trim()) throw new Error('Question text cannot be empty.');
        if (q.options.length < 2) throw new Error('Each question needs at least 2 options.');
        if (!q.options.some(o => o.is_correct)) throw new Error('Each question needs a correct answer.');
      }

      const assignRef = await addDoc(collection(db, 'assignments'), {
        title, course_id: input.course_id, chapter_id: input.chapter_id || null,
        teacher_id: user!.id, difficulty: input.difficulty, due_date: input.due_date || null,
        created_at: serverTimestamp(),
      });

      await Promise.all(input.questions.map(async (q, i) => {
        const qRef = await addDoc(collection(db, 'mcq_questions'), {
          assignment_id: assignRef.id, question: q.question.trim(), difficulty: q.difficulty, sort_order: i,
        });
        await Promise.all(q.options.map((opt, oi) =>
          addDoc(collection(db, 'mcq_options'), { question_id: qRef.id, text: opt.text.trim(), is_correct: opt.is_correct, sort_order: oi })
        ));
      }));

      return assignRef;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['assignments'] }); toast.success('Assignment created!'); },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useSubmitAssignment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { assignment: FullAssignment; answers: Record<string, string> }) => {
      const { assignment, answers } = input;
      let score = 0;
      for (const q of assignment.questions) {
        const correctOption = q.options.find(o => o.is_correct);
        if (correctOption && answers[q.id] === correctOption.id) score++;
      }
      await addDoc(collection(db, 'submissions'), {
        assignment_id: assignment.id, student_id: user!.id, answers, score,
        total_questions: assignment.questions.length, feedback: null, insights: null,
        submitted_at: serverTimestamp(),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['submissions'] }); toast.success('Assignment submitted!'); },
    onError: (err: any) => toast.error(err.message),
  });
}

export function useStudentSubmissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['submissions', 'student', user?.id],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'submissions'), where('student_id', '==', user!.id)));
      return snap.docs.map(d => ({ id: d.id, ...d.data(), submitted_at: toDate(d.data().submitted_at) })) as DbSubmission[];
    },
    enabled: !!user,
  });
}

export function useTeacherSubmissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['submissions', 'teacher', user?.id],
    queryFn: async () => {
      const assignSnap = await getDocs(query(collection(db, 'assignments'), where('teacher_id', '==', user!.id)));
      if (assignSnap.empty) return [];
      const assignmentIds = assignSnap.docs.map(d => d.id);
      const assignmentTitles = Object.fromEntries(assignSnap.docs.map(d => [d.id, d.data().title]));

      const subSnap = await getDocs(query(collection(db, 'submissions'), where('assignment_id', 'in', assignmentIds.slice(0, 10))));
      const submissions = subSnap.docs.map(d => ({ id: d.id, ...d.data(), submitted_at: toDate(d.data().submitted_at) })) as any[];

      const studentIds = [...new Set(submissions.map((s: any) => s.student_id))];
      const nameMap: Record<string, string> = {};
      await Promise.all(studentIds.map(async (sid) => {
        const p = await getDoc(doc(db, 'profiles', sid as string));
        if (p.exists()) nameMap[sid as string] = p.data().name;
      }));

      return submissions.map((s: any) => ({
        ...s,
        student_name: nameMap[s.student_id] || 'Unknown',
        assignment_title: assignmentTitles[s.assignment_id] || 'Unknown',
      }));
    },
    enabled: !!user && user.role === 'teacher',
  });
}

export function useGiveFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { submissionId: string; feedback: string; insights?: string }) => {
      const feedback = input.feedback?.trim();
      if (!feedback) throw new Error('Feedback is required.');
      await updateDoc(doc(db, 'submissions', input.submissionId), { feedback, insights: input.insights?.trim() || null });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['submissions'] }); toast.success('Feedback saved!'); },
    onError: (err: any) => toast.error(err.message),
  });
}
