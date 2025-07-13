'use client'

import { useState } from 'react'

export default function MultiFileDownload({ files, messageContent }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState(null)

  const downloadAsZip = async () => {
    if (!files || files.length === 0) return

    setIsDownloading(true)
    setDownloadError(null)

    console.log('Preparing files for ZIP:', files)
    console.log('Files details:', files.map(f => ({
      fileName: f.fileName,
      hasContent: !!f.content,
      contentLength: f.content?.length || 0,
      hasUrl: !!f.fileUrl,
      fileUrl: f.fileUrl
    })))

    try {
      // If files don't have content, we need to get it from the message or download it
      const filesToZip = []
      
      for (const file of files) {
        let content = file.content
        
        // If no content but we have a URL, try to download it
        if (!content && file.fileUrl) {
          try {
            const downloadResponse = await fetch(file.fileUrl)
            if (downloadResponse.ok) {
              content = await downloadResponse.text()
            }
          } catch (downloadError) {
            console.error(`Failed to download ${file.fileName}:`, downloadError)
          }
        }
        
        // If still no content, try to extract it from the message content
        if (!content && messageContent) {
          const filePattern = new RegExp(`\`\`\`${file.fileName.replace('.', '\\.')}\\n([\\s\\S]*?)\`\`\``, 'g')
          const match = filePattern.exec(messageContent)
          if (match) {
            content = match[1].trim()
          }
        }
        
        filesToZip.push({
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          content: content
        })
      }

      console.log('Files prepared for ZIP:', filesToZip.map(f => ({
        fileName: f.fileName,
        hasContent: !!f.content,
        contentLength: f.content?.length || 0
      })))

      const response = await fetch('/api/create-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: filesToZip
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create zip: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.downloadUrl) {
        // Create download link
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName || 'files.zip'
        
        // For data URLs, we need to handle them differently
        if (data.downloadUrl.startsWith('data:')) {
          link.target = '_self'
        }
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        if (data.fallback) {
          console.log('Used fallback download method (data URL)')
        }
      } else {
        throw new Error('No download URL received')
      }
    } catch (error) {
      console.error('Error downloading zip:', error)
      setDownloadError(error.message)
    } finally {
      setIsDownloading(false)
    }
  }

  const isMultiFileResponse = messageContent?.includes('📁 MULTIPLE FILES GENERATED') || 
                             messageContent?.includes('files that can be downloaded as a ZIP package')

  if (!files || files.length <= 1 || !isMultiFileResponse) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-2xl">📁</div>
        <div className="flex-1">
          <h4 className="font-medium text-blue-900">Multiple Files Generated</h4>
          <p className="text-sm text-blue-700">
            {files.length} files are available for download
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadAsZip}
            disabled={isDownloading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDownloading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isDownloading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating ZIP...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                📦 Download as ZIP
              </div>
            )}
          </button>
        </div>
      </div>
      
      {downloadError && (
        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-red-700 text-sm">
          <strong>Download Error:</strong> {downloadError}
        </div>
      )}
      
      <div className="mt-3 text-xs text-blue-600">
        Individual files can be downloaded separately using the download button on each file.
      </div>
    </div>
  )
}