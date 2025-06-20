-- Create the media storage bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
VALUES (
  'media',
  'media',
  true,
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the media bucket
CREATE POLICY "Give users authenticated access to folder" ON storage.objects
FOR ALL USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Give public read access to media files" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow only admins to upload files
CREATE POLICY "Only admins can upload media files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'media' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow only admins to update files
CREATE POLICY "Only admins can update media files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'media' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow only admins to delete files  
CREATE POLICY "Only admins can delete media files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'media' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
); 