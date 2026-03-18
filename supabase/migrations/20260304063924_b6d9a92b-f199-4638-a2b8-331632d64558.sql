
-- Fix: Recreate public_profiles view without security_invoker so all authenticated users can read public display fields
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
  SELECT user_id, name, avatar_url
  FROM public.profiles;

-- Add column length constraints via CHECK-like triggers for input validation
-- Add length limits to profiles table
ALTER TABLE public.profiles
  ADD CONSTRAINT chk_profiles_name_length CHECK (char_length(name) <= 200),
  ADD CONSTRAINT chk_profiles_school_length CHECK (school IS NULL OR char_length(school) <= 300),
  ADD CONSTRAINT chk_profiles_phone_length CHECK (phone IS NULL OR char_length(phone) <= 50),
  ADD CONSTRAINT chk_profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 2000);

-- Add length limits to courses table
ALTER TABLE public.courses
  ADD CONSTRAINT chk_courses_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT chk_courses_description_length CHECK (description IS NULL OR char_length(description) <= 2000),
  ADD CONSTRAINT chk_courses_icon_length CHECK (icon IS NULL OR char_length(icon) <= 20);

-- Add length limits to chapters table
ALTER TABLE public.chapters
  ADD CONSTRAINT chk_chapters_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT chk_chapters_description_length CHECK (description IS NULL OR char_length(description) <= 2000);

-- Add length limits to subchapters table
ALTER TABLE public.subchapters
  ADD CONSTRAINT chk_subchapters_title_length CHECK (char_length(title) <= 200),
  ADD CONSTRAINT chk_subchapters_content_length CHECK (content IS NULL OR char_length(content) <= 50000);
