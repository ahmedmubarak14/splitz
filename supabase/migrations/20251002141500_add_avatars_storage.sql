-- Create public avatars bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    PERFORM storage.create_bucket(
      id => 'avatars',
      name => 'avatars',
      public => true
    );
  END IF;
END$$;

-- RLS Policies on storage.objects for avatars bucket
-- Allow public read
CREATE POLICY IF NOT EXISTS "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- Allow owners to update/delete their own files
CREATE POLICY IF NOT EXISTS "Owners update avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND owner = auth.uid());

CREATE POLICY IF NOT EXISTS "Owners delete avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND owner = auth.uid());

