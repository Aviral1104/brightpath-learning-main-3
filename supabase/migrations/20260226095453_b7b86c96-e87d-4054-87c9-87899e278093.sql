
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- COURSES
DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can create courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can delete own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update own courses" ON public.courses;

CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Teachers can create courses" ON public.courses FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);
CREATE POLICY "Teachers can update own courses" ON public.courses FOR UPDATE USING (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete own courses" ON public.courses FOR DELETE USING (has_role(auth.uid(), 'teacher'::app_role) AND auth.uid() = teacher_id);

-- CHAPTERS
DROP POLICY IF EXISTS "Anyone can view chapters" ON public.chapters;
DROP POLICY IF EXISTS "Teachers can manage chapters" ON public.chapters;
DROP POLICY IF EXISTS "Teachers can update chapters" ON public.chapters;
DROP POLICY IF EXISTS "Teachers can delete chapters" ON public.chapters;

CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Teachers can manage chapters" ON public.chapters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM courses WHERE courses.id = chapters.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "Teachers can update chapters" ON public.chapters FOR UPDATE USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = chapters.course_id AND courses.teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete chapters" ON public.chapters FOR DELETE USING (EXISTS (SELECT 1 FROM courses WHERE courses.id = chapters.course_id AND courses.teacher_id = auth.uid()));

-- SUBCHAPTERS
DROP POLICY IF EXISTS "Anyone can view subchapters" ON public.subchapters;
DROP POLICY IF EXISTS "Teachers can manage subchapters" ON public.subchapters;
DROP POLICY IF EXISTS "Teachers can update subchapters" ON public.subchapters;
DROP POLICY IF EXISTS "Teachers can delete subchapters" ON public.subchapters;

CREATE POLICY "Anyone can view subchapters" ON public.subchapters FOR SELECT USING (true);
CREATE POLICY "Teachers can manage subchapters" ON public.subchapters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chapters ch JOIN courses c ON c.id = ch.course_id WHERE ch.id = subchapters.chapter_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Teachers can update subchapters" ON public.subchapters FOR UPDATE USING (EXISTS (SELECT 1 FROM chapters ch JOIN courses c ON c.id = ch.course_id WHERE ch.id = subchapters.chapter_id AND c.teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete subchapters" ON public.subchapters FOR DELETE USING (EXISTS (SELECT 1 FROM chapters ch JOIN courses c ON c.id = ch.course_id WHERE ch.id = subchapters.chapter_id AND c.teacher_id = auth.uid()));

-- PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role on signup" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role on signup" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- COURSE_ENROLLMENTS
DROP POLICY IF EXISTS "View enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can enroll" ON public.course_enrollments;

CREATE POLICY "View enrollments" ON public.course_enrollments FOR SELECT USING (true);
CREATE POLICY "Students can enroll" ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
