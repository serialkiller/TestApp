-- Supabase Storage Setup for AI-Generated Files
-- Run this in your Supabase SQL editor

-- Create a storage bucket for AI-generated files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'text/plain',
    'text/html',
    'text/css',
    'application/javascript',
    'application/typescript',
    'text/x-python',
    'text/x-java-source',
    'text/x-c++src',
    'text/x-csrc',
    'text/x-csharp',
    'application/x-httpd-php',
    'text/x-ruby',
    'text/x-go',
    'text/x-rust',
    'text/x-swift',
    'text/x-kotlin',
    'text/x-scala',
    'text/x-scss',
    'text/x-sass',
    'application/json',
    'application/xml',
    'text/x-yaml',
    'text/markdown',
    'text/csv',
    'text/x-sql',
    'text/x-gitignore',
    'text/x-dockerfile'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create a policy to allow public read access to files
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

-- Create a policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'files' 
  AND auth.role() = 'authenticated'
);

-- Create a policy to allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create a policy to allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Enable Row Level Security
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 