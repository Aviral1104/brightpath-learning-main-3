
-- Assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  teacher_id uuid NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Teachers can create assignments" ON public.assignments FOR INSERT WITH CHECK (auth.uid() = teacher_id AND has_role(auth.uid(), 'teacher'));
CREATE POLICY "Teachers can update own assignments" ON public.assignments FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete own assignments" ON public.assignments FOR DELETE USING (auth.uid() = teacher_id);

-- MCQ Questions table
CREATE TABLE public.mcq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions" ON public.mcq_questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage questions" ON public.mcq_questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = mcq_questions.assignment_id AND a.teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update questions" ON public.mcq_questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = mcq_questions.assignment_id AND a.teacher_id = auth.uid())
);
CREATE POLICY "Teachers can delete questions" ON public.mcq_questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = mcq_questions.assignment_id AND a.teacher_id = auth.uid())
);

-- MCQ Options table
CREATE TABLE public.mcq_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.mcq_questions(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.mcq_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view options" ON public.mcq_options FOR SELECT USING (true);
CREATE POLICY "Teachers can manage options" ON public.mcq_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.mcq_questions q JOIN public.assignments a ON a.id = q.assignment_id WHERE q.id = mcq_options.question_id AND a.teacher_id = auth.uid())
);
CREATE POLICY "Teachers can update options" ON public.mcq_options FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.mcq_questions q JOIN public.assignments a ON a.id = q.assignment_id WHERE q.id = mcq_options.question_id AND a.teacher_id = auth.uid())
);
CREATE POLICY "Teachers can delete options" ON public.mcq_options FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.mcq_questions q JOIN public.assignments a ON a.id = q.assignment_id WHERE q.id = mcq_options.question_id AND a.teacher_id = auth.uid())
);

-- Submissions table
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  score int NOT NULL DEFAULT 0,
  total_questions int NOT NULL DEFAULT 0,
  feedback text,
  insights text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own submissions" ON public.submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view submissions for their assignments" ON public.submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = submissions.assignment_id AND a.teacher_id = auth.uid())
);
CREATE POLICY "Students can submit" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Teachers can update submissions (feedback)" ON public.submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = submissions.assignment_id AND a.teacher_id = auth.uid())
);

-- Add length constraints
ALTER TABLE public.assignments ADD CONSTRAINT chk_assignments_title_length CHECK (char_length(title) <= 200);
ALTER TABLE public.mcq_questions ADD CONSTRAINT chk_mcq_question_length CHECK (char_length(question) <= 1000);
ALTER TABLE public.mcq_options ADD CONSTRAINT chk_mcq_option_length CHECK (char_length(text) <= 500);
ALTER TABLE public.submissions ADD CONSTRAINT chk_feedback_length CHECK (feedback IS NULL OR char_length(feedback) <= 2000);
ALTER TABLE public.submissions ADD CONSTRAINT chk_insights_length CHECK (insights IS NULL OR char_length(insights) <= 2000);
