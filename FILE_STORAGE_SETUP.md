# File Storage Setup Guide

This guide explains how to set up file storage for AI-generated files using Supabase.

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

## Supabase Setup

### 1. Create Storage Bucket

Run the SQL script `supabase-storage-setup.sql` in your Supabase SQL editor. This will:

- Create a `files` bucket for AI-generated files
- Set up public read access
- Configure file size limits (50MB)
- Allow common file types (code files, text files, etc.)

### 2. Storage Policies

The script also sets up Row Level Security policies:

- **Public read access**: Anyone can view uploaded files
- **Authenticated uploads**: Only authenticated users can upload
- **User file management**: Users can update/delete their own files

## How It Works

### File Detection

The system automatically detects when the AI generates files using these patterns:

1. **Code blocks with filenames**: ````filename.py\ncode here```\`
2. **Bold filenames**: `**filename.js**` followed by code blocks
3. **File introductions**: "Here's the file: filename.ext" followed by code

### File Processing

1. **Detection**: AI responses are scanned for file patterns
2. **Upload**: Detected files are uploaded to Supabase storage
3. **Display**: Files are shown in a beautiful code editor interface
4. **Actions**: Users can copy content or download files

### Supported File Types

- **Programming Languages**: Python, JavaScript, TypeScript, Java, C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, Scala
- **Web Technologies**: HTML, CSS, SCSS, SASS, JSON, XML, YAML
- **Configuration**: Markdown, Gitignore, Dockerfile, ENV files
- **Data**: CSV, SQL files

## Features

### File Display Component

- **Syntax highlighting** based on file extension
- **Copy to clipboard** functionality
- **Download file** option
- **File information** (size, upload date)
- **Error handling** for failed uploads

### File Actions

- **Copy**: One-click copy of file content
- **Download**: Save file to local machine
- **View**: Syntax-highlighted code display

## Example Usage

Ask the AI to generate files:

```
"Create a Python script for data analysis"
"Generate a React component for a todo list"
"Write a Node.js API endpoint"
"Create a Dockerfile for a Node.js app"
```

The AI will respond with files in the format:

````markdown
Here's the Python script:

```data_analysis.py
import pandas as pd
import numpy as np

def analyze_data(data):
    # Analysis code here
    pass
```
````

The system will automatically:
1. Detect the file
2. Upload it to Supabase storage
3. Display it in a code editor interface
4. Allow copying and downloading

## Troubleshooting

### Files Not Uploading

1. Check Supabase credentials in environment variables
2. Verify storage bucket exists and is public
3. Check browser console for error messages
4. Ensure file size is under 50MB limit

### Files Not Displaying

1. Check if file was uploaded successfully
2. Verify file URL is accessible
3. Check network connectivity
4. Review browser console for errors

### Storage Quota

- Default file size limit: 50MB per file
- Monitor your Supabase storage usage
- Consider implementing file cleanup for old files

## Security Considerations

- Files are publicly readable (for sharing)
- Upload requires authentication
- File names are sanitized
- Content is validated before upload
- Consider implementing file expiration for sensitive content 