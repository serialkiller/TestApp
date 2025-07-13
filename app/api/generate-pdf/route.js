import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'

// Text cleaning functions for PDF generation - minimal cleaning to preserve formatting
function cleanTextForPDF(text) {
  if (!text) return ''
  
  return text
    // Fix only the most problematic encoding issues
    .replace(/ï¿½/g, '')      // Replacement character (the main culprit)
    .replace(/ï¿1⁄2/g, '1/2') // Specific fraction issue you mentioned
    .replace(/â€™/g, "'")     // Smart apostrophe
    .replace(/â€œ/g, '"')     // Smart quote open
    .replace(/â€\u009d/g, '"') // Smart quote close
    // Keep the rest as-is to preserve formatting
}

function cleanLineForPDF(line) {
  if (!line) return ''
  
  return line
    // Only fix the most problematic characters while preserving bullets and formatting
    .replace(/ï¿½/g, '')      // Remove replacement characters
    .replace(/ï¿1⁄2/g, '1/2') // Fix specific fraction encoding
    // Keep original bullets and formatting intact
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { fileName, content, title } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    console.log('Generating PDF:', { fileName, title, contentLength: content.length })

    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Set up document properties
    doc.setProperties({
      title: title || fileName || 'Generated Report',
      subject: 'AI Generated Report',
      author: 'Husains App',
      creator: 'Husains App'
    })

    // Clean and parse markdown-like content
    const cleanContent = cleanTextForPDF(content)
    const lines = cleanContent.split('\n')
    let yPosition = 20
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    const lineHeight = 7
    const maxWidth = doc.internal.pageSize.width - (margin * 2)

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim()
      
      // Skip empty lines but add spacing
      if (!line) {
        yPosition += lineHeight / 2
        continue
      }

      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }

      // Handle different markdown elements
      if (line.startsWith('# ')) {
        // Main heading
        doc.setFontSize(20)
        doc.setFont(undefined, 'bold')
        line = line.substring(2)
        yPosition += 5
      } else if (line.startsWith('## ')) {
        // Sub heading
        doc.setFontSize(16)
        doc.setFont(undefined, 'bold')
        line = line.substring(3)
        yPosition += 3
      } else if (line.startsWith('### ')) {
        // Sub-sub heading
        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        line = line.substring(4)
        yPosition += 2
      } else if (line.match(/^\d+\.\s/)) {
        // Numbered lists (1. 2. 3.)
        doc.setFontSize(12)
        doc.setFont(undefined, 'normal')
        // Keep the number formatting
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet points
        doc.setFontSize(12)
        doc.setFont(undefined, 'normal')
        line = '• ' + line.substring(2)
      } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
        // Bold text
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        line = line.substring(2, line.length - 2)
      } else {
        // Regular text
        doc.setFontSize(12)
        doc.setFont(undefined, 'normal')
      }

      // Clean the line of any remaining problematic characters
      line = cleanLineForPDF(line)

      // Split long lines to fit page width
      const splitLines = doc.splitTextToSize(line, maxWidth)
      
      for (const splitLine of splitLines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
        
        doc.text(splitLine, margin, yPosition)
        yPosition += lineHeight
      }

      // Add extra spacing after headings
      if (lines[i].startsWith('#')) {
        yPosition += 3
      }
    }

    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(
        `Page ${i} of ${pageCount}`, 
        doc.internal.pageSize.width / 2, 
        doc.internal.pageSize.height - 10, 
        { align: 'center' }
      )
    }

    // Generate PDF as buffer
    const pdfBuffer = doc.output('arraybuffer')
    const uint8Array = new Uint8Array(pdfBuffer)

    // Create filename
    const timestamp = Date.now()
    const pdfFileName = fileName || `report_${timestamp}.pdf`

    // Try to create the bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets()
    
    if (!buckets?.find(bucket => bucket.name === 'generated-files')) {
      await supabase.storage.createBucket('generated-files', {
        public: true,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 52428800 // 50MB
      })
    }

    // Upload PDF to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-files')
      .upload(`pdfs/${pdfFileName}`, uint8Array, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading PDF to Supabase:', uploadError)
      
      // Fallback: return PDF as base64 data URL
      const base64Pdf = Buffer.from(uint8Array).toString('base64')
      const dataUrl = `data:application/pdf;base64,${base64Pdf}`
      
      return NextResponse.json({
        success: true,
        downloadUrl: dataUrl,
        fileName: pdfFileName,
        fallback: true
      })
    }

    // Get the public URL for the PDF
    const { data: urlData } = supabase.storage
      .from('generated-files')
      .getPublicUrl(`pdfs/${pdfFileName}`)

    return NextResponse.json({
      success: true,
      downloadUrl: urlData.publicUrl,
      fileName: pdfFileName,
      size: uint8Array.length
    })

  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}