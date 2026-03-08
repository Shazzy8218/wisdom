
-- 1) Create missing triggers for auto-creating profile + progress on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE TRIGGER on_auth_user_created_progress
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_progress();

-- 2) Create chat_threads table for cloud persistence
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id text NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  lesson_id text,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  archived boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat threads" ON public.chat_threads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat threads" ON public.chat_threads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat threads" ON public.chat_threads FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat threads" ON public.chat_threads FOR DELETE USING (auth.uid() = user_id);

-- 3) Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id text NOT NULL,
  thread_id text NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- 4) Create personalized_lessons table
CREATE TABLE IF NOT EXISTS public.personalized_lessons (
  id text NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT '',
  hook text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  try_prompt text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  source_thread_id text,
  generated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
  completed boolean NOT NULL DEFAULT false,
  PRIMARY KEY (id, user_id)
);

ALTER TABLE public.personalized_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own personalized lessons" ON public.personalized_lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personalized lessons" ON public.personalized_lessons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personalized lessons" ON public.personalized_lessons FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own personalized lessons" ON public.personalized_lessons FOR DELETE USING (auth.uid() = user_id);

-- 5) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_user ON public.chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON public.chat_messages(thread_id, user_id);
CREATE INDEX IF NOT EXISTS idx_personalized_lessons_user ON public.personalized_lessons(user_id);
