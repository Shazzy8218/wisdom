
CREATE TABLE public.user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  completed_lessons jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  mastery_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  quiz_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  saved_notes jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_lesson_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  tokens integer NOT NULL DEFAULT 0,
  xp integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  last_active_date text NOT NULL DEFAULT '',
  lessons_today integer NOT NULL DEFAULT 0,
  feed_seen jsonb NOT NULL DEFAULT '[]'::jsonb,
  favorites jsonb NOT NULL DEFAULT '[]'::jsonb,
  seen_quotes jsonb NOT NULL DEFAULT '[]'::jsonb,
  unlocked_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  token_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.user_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON public.user_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Auto-create progress row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, last_active_date)
  VALUES (NEW.id, to_char(now(), 'YYYY-MM-DD'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_progress
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_progress();
