'use client'

import { useState, useEffect } from 'react'
import { FileStorage, getLanguage } from '../utils/fileStorage'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default function FileDisplay({ fileInfo }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [fileStorage] = useState(() => new FileStorage())

  useEffect(() => {
    loadFileContent()
  }, [fileInfo])

  const loadFileContent = async () => {
    if (!fileInfo?.fileUrl) {
      setError('No file URL provided')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const fileContent = await fileStorage.downloadFile(fileInfo.fileUrl)
      
      if (fileContent) {
        setContent(fileContent)
      } else {
        setError('Failed to load file content')
      }
    } catch (err) {
      setError('Error loading file: ' + err.message)
    } finally {
      setLoading(false)
    }
  }



  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadFile = () => {
    const blob = new Blob([content], { type: fileInfo.fileType || 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileInfo.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    const icons = {
      'js': '⚛️',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '📘',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'cs': '🔷',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'swift': '🍎',
      'html': '🌐',
      'css': '🎨',
      'json': '📄',
      'md': '📝',
      'sql': '🗄️',
      'default': '📁'
    }
    
    return icons[extension] || icons.default
  }

  if (loading) {
    return (
      <div className="my-4 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getFileIcon(fileInfo?.fileName)}</span>
            <span className="font-mono text-sm text-gray-700">{fileInfo?.fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="bg-gray-50 p-4 text-center text-gray-500">
          Loading file content...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="my-4 border border-red-200 rounded-lg overflow-hidden">
        <div className="bg-red-50 px-4 py-2 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">❌</span>
            <span className="font-mono text-sm text-red-700">{fileInfo?.fileName}</span>
          </div>
        </div>
        <div className="bg-red-50 p-4 text-center text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="my-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* File Header */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getFileIcon(fileInfo.fileName)}</span>
          <span className="font-mono text-sm text-gray-700">{fileInfo.fileName}</span>
          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            {getLanguage(fileInfo.fileName)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadFile}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
            title="Download file"
          >
            📥 Download
          </button>
          <button
            onClick={copyToClipboard}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Copy to clipboard"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>
      
      {/* File Content */}
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={getLanguage(fileInfo.fileName)}
          style={tomorrow}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          showLineNumbers={false}
          wrapLines={true}
        >
          {content}
        </SyntaxHighlighter>
      </div>
      
      {/* File Info */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Size: {fileInfo.size} bytes</span>
          <span>Uploaded: {new Date(fileInfo.uploadedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
} 