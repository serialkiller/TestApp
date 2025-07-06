# Supabase Storage Setup Guide (Corrected)

This guide explains how to properly set up file storage for AI-generated files using Supabase Dashboard.

## Prerequisites

1. Supabase project with storage enabled
2. Environment variables configured

## Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Supabase Dashboard Setup

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Configure the bucket:
   - **Name**: `files`
   - **Public bucket**: ✅ Check this (allows public read access)
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**: Leave empty (allows all types) or add specific types

### 2. Configure Storage Policies

1. In the Storage section, click on your `files` bucket
2. Go to the **Policies** tab
3. Click **New Policy**
4. Create these policies:

#### Policy 1: Public Read Access
- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**: Leave empty (allows all reads)

#### Policy 2: Authenticated Uploads
- **Policy name**: `Authenticated users can upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**: Leave empty (allows authenticated uploads)

#### Policy 3: User File Management
- **Policy name**: `Users can manage their own files`
- **Allowed operation**: `UPDATE, DELETE`
- **Target roles**: `authenticated`
- **Policy definition**: Leave empty (allows users to manage their files)

### 3. Alternative: Use Policy Templates

If the above doesn't work, you can use these SQL commands in the SQL Editor:

```sql
-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies using the storage API
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'files');

CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'files');

CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (bucket_id = 'files');

CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (bucket_id = 'files');
```

## Testing the Setup

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **files** bucket
3. Try uploading a test file manually
4. Check if you can view the file URL

## Troubleshooting

### "must be owner of table objects" Error

This error occurs because storage tables are system-managed. Solutions:

1. **Use Dashboard**: Set up storage through the Supabase Dashboard instead of SQL
2. **Check Permissions**: Ensure you're using the correct API keys
3. **Contact Support**: If issues persist, contact Supabase support

### Files Not Uploading

1. **Check Bucket Exists**: Verify the `files` bucket exists in Storage
2. **Check Policies**: Ensure policies allow the operations you need
3. **Check API Keys**: Verify environment variables are correct
4. **Check Network**: Ensure your app can reach Supabase

### Files Not Accessible

1. **Check Public Access**: Ensure the bucket is marked as public
2. **Check Policies**: Verify read policies are set correctly
3. **Check File URLs**: Test file URLs directly in browser

## Security Considerations

- **Public Read**: Files are publicly readable (for sharing)
- **Authenticated Upload**: Only authenticated users can upload
- **File Validation**: Consider implementing file type validation
- **Size Limits**: Monitor file sizes and storage usage
- **Cleanup**: Consider implementing file expiration

## Environment Variables Check

Make sure these are set in your `.env.local`:

```bash
# Required for client-side operations
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for server-side operations (file uploads)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Next Steps

After setting up storage:

1. Test file uploads manually in Supabase Dashboard
2. Test your application's file generation feature
3. Monitor storage usage and file access
4. Consider implementing file cleanup for old files 