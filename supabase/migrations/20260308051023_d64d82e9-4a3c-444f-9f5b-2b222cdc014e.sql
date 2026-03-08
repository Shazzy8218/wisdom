ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS goal_mode text NOT NULL DEFAULT 'income';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS output_mode text NOT NULL DEFAULT 'blueprints';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calibration_done boolean NOT NULL DEFAULT false;