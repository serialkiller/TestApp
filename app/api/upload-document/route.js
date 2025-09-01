import { NextResponse } from 'next/server'
import path from 'path'

async function extractTextFromBuffer(buffer, filename) {
  const fileExtension = path.extname(filename).toLowerCase()
  
  switch (fileExtension) {
    case '.pdf':
      try {
        const pdfParse = (await import('pdf-parse-new')).default
        const pdfData = await pdfParse(buffer)
        return {
          text: pdfData.text,
          metadata: {
            pages: pdfData.numpages,
            info: pdfData.info
          }
        }
      } catch (error) {
        throw new Error(`Failed to parse PDF: ${error.message}`)
      }
    
    case '.docx':
      try {
        const mammoth = await import('mammoth')
        const docxResult = await mammoth.extractRawText({ buffer })
        return {
          text: docxResult.value,
          metadata: {
            messages: docxResult.messages
          }
        }
      } catch (error) {
        throw new Error(`Failed to parse DOCX: ${error.message}`)
      }
    
    case '.doc':
      // Basic doc support (limited)
      return {
        text: buffer.toString('utf8'),
        metadata: { note: 'Basic .doc parsing - results may vary' }
      }
    
    case '.txt':
      return {
        text: buffer.toString('utf8'),
        metadata: {}
      }
    
    default:
      throw new Error(`Unsupported file type: ${fileExtension}`)
  }
}

export async function POST(request) {
  try {
    // Parse form data with file
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Check file type
    const allowedTypes = ['.pdf', '.docx', '.doc', '.txt']
    const fileExtension = path.extname(file.name).toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      return NextResponse.json({ 
        error: `Unsupported file type. Allowed: ${allowedTypes.join(', ')}` 
      }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Extract text from buffer
    const result = await extractTextFromBuffer(buffer, file.name)
    
    return NextResponse.json({
      filename: file.name,
      size: file.size,
      type: fileExtension,
      text: result.text,
      metadata: result.metadata,
      success: true
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to process document' 
    }, { status: 500 })
  }
}