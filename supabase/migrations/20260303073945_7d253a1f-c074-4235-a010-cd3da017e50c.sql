
-- 1. Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 2. Owner-only SELECT on profiles (users can read their own full profile)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. Create a public view with only non-sensitive display fields
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
  SELECT user_id, name, avatar_url
  FROM public.profiles;
