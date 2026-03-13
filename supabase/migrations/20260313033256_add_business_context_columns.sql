-- Add business context columns to profiles table
-- These store the new calibration fields for industry-specific AI responses

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS revenue_stage text DEFAULT '',
  ADD COLUMN IF NOT EXISTS biggest_challenge text DEFAULT '',
  ADD COLUMN IF NOT EXISTS team_size text DEFAULT '',
  ADD COLUMN IF NOT EXISTS role text DEFAULT '';

COMMENT ON COLUMN public.profiles.business_type IS 'Type of business (construction, retail, service, etc.)';
COMMENT ON COLUMN public.profiles.revenue_stage IS 'Revenue stage (idea, early, growing, scaling)';
COMMENT ON COLUMN public.profiles.biggest_challenge IS 'Biggest business challenge (leads, cashflow, team, growth, clarity)';
COMMENT ON COLUMN public.profiles.team_size IS 'Team size (solo, small, medium, large)';
COMMENT ON COLUMN public.profiles.role IS 'User role (owner, learner, pro)';
