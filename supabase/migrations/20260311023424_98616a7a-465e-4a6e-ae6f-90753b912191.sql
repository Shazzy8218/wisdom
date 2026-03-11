
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS primary_desire text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS answer_tone text NOT NULL DEFAULT 'calm',
  ADD COLUMN IF NOT EXISTS intensity text NOT NULL DEFAULT 'normal';
