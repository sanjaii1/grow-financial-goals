
-- Create a public bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up RLS policies for the avatars bucket
-- Allow public read access to everyone
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Authenticated users can upload their own avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( auth.uid() = owner AND bucket_id = 'avatars' );

-- Allow authenticated users to update their own avatar
CREATE POLICY "Authenticated users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( auth.uid() = owner AND bucket_id = 'avatars' );

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Authenticated users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING ( auth.uid() = owner AND bucket_id = 'avatars' );
