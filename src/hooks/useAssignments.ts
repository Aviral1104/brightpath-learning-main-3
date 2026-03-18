import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/integrations/backend/client';
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

// Fetch assignments with questions/options
async function fetchAssignmentsWithDetails(filter?: { teacher_id?: string; course_ids?: string[] }): Promise<FullAssignment[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('assignments').select('*').order('created_at', { ascending: false });

  if (filter?.teacher_id) query = query.eq('teacher_id', filter.teacher_id);
  if (filter?.course_ids && filter.course_ids.length > 0) query = query.in('course_id', filter.course_ids);

  const { data: assignments, error } = await query;
  if (error) throw error;
  if (!assignments || assignments.length === 0) return [];

  const assignmentIds = assignments.map(a => a.id);

  const [questionsRes, coursesRes] = await Promise.all([
    supabase.from('mcq_questions').select('*').in('assignment_id', assignmentIds).order('sort_order'),
    supabase.from('courses').select('id, title, icon').in('id', assignments.map(a => a.course_id)),
  ]);

  const questions = questionsRes.data || [];
  const courses = coursesRes.data || [];
  const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

  let options: DbOption[] = [];
  if (questions.length > 0) {
    const { data } = await supabase.from('mcq_options').select('*').in('question_id', questions.map(q => q.id)).order('sort_order');
    options = (data || []) as DbOption[];
  }

  return assignments.map(a => ({
    ...a,
    course_title: courseMap[a.course_id]?.title,
    course_icon: courseMap[a.course_id]?.icon,
    questions: questions
      .filter(q => q.assignment_id === a.id)
      .map(q => ({
        ...q,
        options: options.filter(o => o.question_id === q.id),
      })),
  })) as FullAssignment[];
}

// Teacher: list own assignments
export function useTeacherAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assignments', 'teacher', user?.id],
    queryFn: () => fetchAssignmentsWithDetails({ teacher_id: user!.id }),
    enabled: !!user,
  });
}

// Student: list assignments for enrolled courses
export function useStudentAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assignments', 'student', user?.id],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user!.id);

      // Also show assignments for all courses (public)
      const { data: allCourses } = await supabase.from('courses').select('id');
      const courseIds = (allCourses || []).map(c => c.id);
      if (courseIds.length === 0) return [];
      return fetchAssignmentsWithDetails({ course_ids: courseIds });
    },
    enabled: !!user,
  });
}

// Teacher: create assignment with questions
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
      const supabase = getSupabaseClient();
      const title = input.title?.trim();
      if (!title || title.length > 200) throw new Error('Title is required (max 200 chars).');
      if (input.questions.length === 0) throw new Error('Add at least one question.');

      for (const q of input.questions) {
        if (!q.question.trim()) throw new Error('Question text cannot be empty.');
        if (q.options.length < 2) throw new Error('Each question needs at least 2 options.');
        if (!q.options.some(o => o.is_correct)) throw new Error('Each question needs at least one correct answer.');
      }

      // Insert assignment
      const { data: assignment, error: aErr } = await supabase
        .from('assignments')
        .insert({
          title,
          course_id: input.course_id,
          chapter_id: input.chapter_id || null,
          teacher_id: user!.id,
          difficulty: input.difficulty,
          due_date: input.due_date || null,
        })
        .select()
        .single();
      if (aErr) throw aErr;

      // Insert questions
      const questionInserts = input.questions.map((q, i) => ({
        assignment_id: assignment.id,
        question: q.question.trim(),
        difficulty: q.difficulty,
        sort_order: i,
      }));

      const { data: dbQuestions, error: qErr } = await supabase
        .from('mcq_questions')
        .insert(questionInserts)
        .select();
      if (qErr) throw qErr;

      // Insert options
      const optionInserts = dbQuestions!.flatMap((dbQ, qi) =>
        input.questions[qi].options.map((opt, oi) => ({
          question_id: dbQ.id,
          text: opt.text.trim(),
          is_correct: opt.is_correct,
          sort_order: oi,
        }))
      );

      const { error: oErr } = await supabase.from('mcq_options').insert(optionInserts);
      if (oErr) throw oErr;

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment created!');
    },
    onError: (err: any) => toast.error(err.message),
  });
}

// Student: submit assignment
export function useSubmitAssignment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { assignment: FullAssignment; answers: Record<string, string> }) => {
      const supabase = getSupabaseClient();
      const { assignment, answers } = input;

      // Calculate score
      let score = 0;
      for (const q of assignment.questions) {
        const selectedOptionId = answers[q.id];
        const correctOption = q.options.find(o => o.is_correct);
        if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
          score++;
        }
      }

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignment.id,
          student_id: user!.id,
          answers,
          score,
          total_questions: assignment.questions.length,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast.success('Assignment submitted!');
    },
    onError: (err: any) => toast.error(err.message),
  });
}

// Fetch submissions
export function useStudentSubmissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['submissions', 'student', user?.id],
    queryFn: async () => {
      const { data, error } = await getSupabaseClient()
        .from('submissions')
        .select('*')
        .eq('student_id', user!.id);
      if (error) throw error;
      return (data || []) as DbSubmission[];
    },
    enabled: !!user,
  });
}

// Teacher: fetch submissions for their assignments
export function useTeacherSubmissions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['submissions', 'teacher', user?.id],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      // Get teacher's assignments first
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id, title')
        .eq('teacher_id', user!.id);

      if (!assignments || assignments.length === 0) return [];

      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('*')
        .in('assignment_id', assignments.map(a => a.id))
        .order('submitted_at', { ascending: false });
      if (error) throw error;

      // Get student names
      const studentIds = [...new Set((submissions || []).map(s => s.student_id))];
      let studentMap: Record<string, string> = {};
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('public_profiles' as any)
          .select('user_id, name')
          .in('user_id', studentIds);
        studentMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.name]));
      }

      const assignmentMap = Object.fromEntries(assignments.map(a => [a.id, a.title]));

      return (submissions || []).map(s => ({
        ...s,
        student_name: studentMap[s.student_id] || 'Unknown',
        assignment_title: assignmentMap[s.assignment_id] || 'Unknown',
      }));
    },
    enabled: !!user,
  });
}

// Teacher: give feedback
export function useGiveFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { submissionId: string; feedback: string; insights?: string }) => {
      const feedback = input.feedback?.trim();
      if (!feedback || feedback.length > 2000) throw new Error('Feedback is required (max 2000 chars).');
      const insights = input.insights?.trim() || null;
      if (insights && insights.length > 2000) throw new Error('Insights must be under 2000 chars.');

      const { error } = await getSupabaseClient()
        .from('submissions')
        .update({ feedback, insights })
        .eq('id', input.submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('Feedback saved!');
    },
    onError: (err: any) => toast.error(err.message),
  });
}
