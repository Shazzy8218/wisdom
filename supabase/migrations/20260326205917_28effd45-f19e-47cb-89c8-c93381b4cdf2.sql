-- Allow authenticated users to upload to chat-uploads bucket
CREATE POLICY "Authenticated users can upload to chat-uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-uploads');

-- Allow authenticated users to read from chat-uploads bucket
CREATE POLICY "Authenticated users can read chat-uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-uploads');

-- Allow authenticated users to update their uploads in chat-uploads
CREATE POLICY "Authenticated users can update chat-uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-uploads');

-- Allow authenticated users to delete their uploads in chat-uploads
CREATE POLICY "Authenticated users can delete chat-uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-uploads');

-- Same policies for user-assets bucket
CREATE POLICY "Authenticated users can upload to user-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-assets');

CREATE POLICY "Authenticated users can read user-assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'user-assets');

CREATE POLICY "Authenticated users can update user-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-assets');

CREATE POLICY "Authenticated users can delete user-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-assets');