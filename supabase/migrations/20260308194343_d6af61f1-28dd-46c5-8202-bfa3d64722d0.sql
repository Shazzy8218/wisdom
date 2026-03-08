
-- Add unique constraint on user_id for upsert support
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_progress_user_id_key'
  ) THEN
    ALTER TABLE public.user_progress ADD CONSTRAINT user_progress_user_id_key UNIQUE (user_id);
  END IF;
END $$;
