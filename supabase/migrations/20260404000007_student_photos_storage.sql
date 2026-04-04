-- Create student-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-photos',
  'student-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated users can upload student photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-photos');

-- Allow authenticated users to update photos
CREATE POLICY "Authenticated users can update student photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-photos');

-- Allow public read access to student photos
CREATE POLICY "Public can view student photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'student-photos');

-- Allow authenticated users to delete photos
CREATE POLICY "Authenticated users can delete student photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-photos');
