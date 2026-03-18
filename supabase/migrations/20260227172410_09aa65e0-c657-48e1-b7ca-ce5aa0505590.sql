
-- Fix profiles policies: drop RESTRICTIVE, recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Fix courses policies
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can create courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can delete own courses" ON public.courses;

CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND (auth.uid() = teacher_id));
CREATE POLICY "Teachers can update own courses" ON public.courses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role) AND (auth.uid() = teacher_id));
CREATE POLICY "Teachers can delete own courses" ON public.courses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role) AND (auth.uid() = teacher_id));

-- Fix chapters policies
DROP POLICY IF EXISTS "Anyone can view chapters" ON public.chapters;
DROP POLICY IF EXISTS "Teachers can manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Teachers can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Teachers can delete chapters" ON public.chapters;

CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage chapters" ON public.chapters FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = chapters.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "Teachers can update chapters" ON public.chapters FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = chapters.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete chapters" ON public.chapters FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = chapters.course_id AND courses.teacher_id = auth.uid()));

-- Fix subchapters policies
DROP POLICY IF EXISTS "Anyone can view subchapters" ON public.subchapters;
DROP POLICY IF EXISTS "Teachers can manage subchapters" ON public.subchapters;
DROP POLICY IF EXISTS "Teachers can update subchapters" ON public.subchapters;
DROP POLICY IF EXISTS "Teachers can delete subchapters" ON public.subchapters;

CREATE POLICY "Anyone can view subchapters" ON public.subchapters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage subchapters" ON public.subchapters FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM chapters ch JOIN courses c ON c.id = ch.course_id WHERE ch.id = subchapters.chapter_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Teachers can update subchapters" ON public.subchapters FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM chapters ch JOIN courses c ON c.id = ch.course_id WHERE ch.id = subchapters.chapter_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete subchapters" ON public.subchapters FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM chapters ch JOIN courses c ON c.id = ch.course_id WHERE ch.id = subchapters.chapter_id AND c.teacher_id = auth.uid()));

-- Fix course_enrollments policies
DROP POLICY IF EXISTS "View enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can enroll" ON public.course_enrollments;

CREATE POLICY "View enrollments" ON public.course_enrollments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Students can enroll" ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
