
-- Re-create triggers that were missing
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER on_auth_user_created_progress
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_progress();

-- Fix profiles RLS: drop restrictive, add permissive
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Fix chat_messages RLS
DROP POLICY IF EXISTS "Users can read own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;

CREATE POLICY "Users can read own chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat messages" ON public.chat_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix chat_threads RLS
DROP POLICY IF EXISTS "Users can read own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can insert own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can update own chat threads" ON public.chat_threads;
DROP POLICY IF EXISTS "Users can delete own chat threads" ON public.chat_threads;

CREATE POLICY "Users can read own chat threads" ON public.chat_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat threads" ON public.chat_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat threads" ON public.chat_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat threads" ON public.chat_threads FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix personalized_lessons RLS
DROP POLICY IF EXISTS "Users can read own personalized lessons" ON public.personalized_lessons;
DROP POLICY IF EXISTS "Users can insert own personalized lessons" ON public.personalized_lessons;
DROP POLICY IF EXISTS "Users can update own personalized lessons" ON public.personalized_lessons;
DROP POLICY IF EXISTS "Users can delete own personalized lessons" ON public.personalized_lessons;

CREATE POLICY "Users can read own personalized lessons" ON public.personalized_lessons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personalized lessons" ON public.personalized_lessons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personalized lessons" ON public.personalized_lessons FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own personalized lessons" ON public.personalized_lessons FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix user_goals RLS
DROP POLICY IF EXISTS "Users can read own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.user_goals;

CREATE POLICY "Users can read own goals" ON public.user_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.user_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.user_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.user_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix user_progress RLS
DROP POLICY IF EXISTS "Users can read own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON public.user_progress;

CREATE POLICY "Users can read own progress" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Backfill: create profiles for existing users who don't have one
INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', '')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Backfill: create user_progress for existing users who don't have one
INSERT INTO public.user_progress (user_id, last_active_date)
SELECT id, to_char(now(), 'YYYY-MM-DD')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_progress)
ON CONFLICT DO NOTHING;
