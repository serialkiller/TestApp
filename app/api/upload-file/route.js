import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getFileType } from '../../utils/fileStorage'

export async function POST(request) {
  try {
    const { fileName, content, fileType } = await request.json()

    if (!fileName || !content) {
      return NextResponse.json({ 
        error: 'File name and content are required' 
      }, { status: 400 })
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Supabase configuration not found' 
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Determine file type if not provided
    const finalFileType = fileType || getFileType(fileName)

    // Create a blob from the content
    const blob = new Blob([content], { type: finalFileType })
    
    // Generate a unique file path
    const timestamp = Date.now()
    const filePath = `ai-generated-files/${timestamp}-${fileName}`
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      return NextResponse.json({ 
        error: 'Failed to upload file: ' + error.message 
      }, { status: 500 })
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath)

    const fileInfo = {
      id: data.path,
      fileName: fileName,
      fileUrl: urlData.publicUrl,
      fileType: finalFileType,
      size: blob.size,
      uploadedAt: new Date().toISOString()
    }

    return NextResponse.json({ fileInfo })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ 
      error: error.message || 'Something went wrong' 
    }, { status: 500 })
  }
} 