import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { files } = await request.json()

    console.log('Received files for ZIP creation:', files?.length || 0)
    console.log('Files data:', files?.map(f => ({ fileName: f.fileName, hasContent: !!f.content, hasUrl: !!f.fileUrl })))

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'Files array is required' }, { status: 400 })
    }

    // Create a unique zip filename
    const timestamp = Date.now()
    const zipFileName = `files_${timestamp}.zip`

    // Create a zip file using JSZip library
    const zip = new JSZip()
    let addedFiles = 0

    // Add each file to the zip
    for (const file of files) {
      let fileContent = file.content

      console.log(`Processing file: ${file.fileName}`)
      console.log(`  - Has content: ${!!fileContent}`)
      console.log(`  - Content length: ${fileContent?.length || 0}`)
      console.log(`  - Has URL: ${!!file.fileUrl}`)

      // If the file has a URL but no content, try to download it
      if (file.fileUrl && !fileContent) {
        try {
          const pathParts = file.fileUrl.split('/')
          const filePath = pathParts.slice(-2).join('/') // Get last two parts (folder/filename)
          
          console.log(`  - Attempting to download from: ${filePath}`)
          
          const { data, error } = await supabase.storage
            .from('generated-files')
            .download(filePath)

          if (!error && data) {
            fileContent = await data.text()
            console.log(`  - Downloaded content length: ${fileContent.length}`)
          } else {
            console.log(`  - Download error:`, error)
          }
        } catch (downloadError) {
          console.error(`Error downloading file ${file.fileName}:`, downloadError)
        }
      }

      if (fileContent && fileContent.trim().length > 0) {
        zip.file(file.fileName, fileContent)
        addedFiles++
        console.log(`  - Added to ZIP: ${file.fileName} (${fileContent.length} chars)`)
      } else {
        console.log(`  - Skipped (no content): ${file.fileName}`)
      }
    }

    console.log(`Total files added to ZIP: ${addedFiles}`)

    if (addedFiles === 0) {
      return NextResponse.json({ error: 'No valid files to zip' }, { status: 400 })
    }

    // Generate the zip file as a buffer
    const zipBuffer = await zip.generateAsync({ type: 'uint8array' })

    // Try to create the bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (!buckets?.find(bucket => bucket.name === 'generated-files')) {
      const { error: createBucketError } = await supabase.storage.createBucket('generated-files', {
        public: true,
        allowedMimeTypes: ['application/zip', 'text/plain', 'application/json'],
        fileSizeLimit: 52428800 // 50MB
      })
      
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError)
      }
    }

    // Upload the zip file to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-files')
      .upload(`zips/${zipFileName}`, zipBuffer, {
        contentType: 'application/zip',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading zip to Supabase:', uploadError)
      
      // Fallback: return the zip file as a data URL for direct download
      const base64Zip = Buffer.from(zipBuffer).toString('base64')
      const dataUrl = `data:application/zip;base64,${base64Zip}`
      
      return NextResponse.json({
        success: true,
        downloadUrl: dataUrl,
        fileName: zipFileName,
        fileCount: files.length,
        fallback: true
      })
    }

    // Get the public URL for the zip file
    const { data: urlData } = supabase.storage
      .from('generated-files')
      .getPublicUrl(`zips/${zipFileName}`)

    return NextResponse.json({
      success: true,
      downloadUrl: urlData.publicUrl,
      fileName: zipFileName,
      fileCount: files.length
    })

  } catch (error) {
    console.error('Error creating zip:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

