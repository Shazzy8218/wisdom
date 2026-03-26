-- Create user_assets table for permanent asset persistence
CREATE TABLE public.user_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'image',
  file_size integer NOT NULL DEFAULT 0,
  storage_path text NOT NULL DEFAULT '',
  public_url text NOT NULL DEFAULT '',
  source_module text NOT NULL DEFAULT 'chat',
  original_prompt text DEFAULT '',
  style text DEFAULT '',
  folder text DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own assets" ON public.user_assets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets" ON public.user_assets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets" ON public.user_assets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets" ON public.user_assets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('user-assets', 'user-assets', true);

CREATE POLICY "Users can upload own assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own assets storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own assets storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'user-assets' AND (storage.foldername(name))[1] = auth.uid()::text);