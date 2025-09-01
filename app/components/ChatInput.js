'use client'

import { useRef, useEffect, useCallback, useState } from 'react'

export default function ChatInput({ 
  input, 
  setInput, 
  isLoading, 
  onSend,
  onFileUpload 
}) {
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [])

  const handleInputChange = useCallback((e) => {
    setInput(e.target.value)
    // Debounce height adjustment to improve performance
    requestAnimationFrame(() => {
      adjustTextareaHeight()
    })
  }, [setInput, adjustTextareaHeight])

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, or text file')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setUploadedFile(result)
      
      // Call parent component's file upload handler if provided
      if (onFileUpload) {
        onFileUpload(result)
      }
      
    } catch (error) {
      console.error('File upload error:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    if (onFileUpload) {
      onFileUpload(null)
    }
  }

  const handleWebSearch = () => {
    setShowDropdown(false)
    // Trigger web search mode
    if (onFileUpload) {
      onFileUpload({ type: 'web_search' })
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="input-container">
        {/* File upload preview */}
        {uploadedFile && (
          <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded flex items-center justify-center text-xs">
                  📄
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-800">{uploadedFile.filename}</div>
                  <div className="text-xs text-blue-600">
                    {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.text.length} characters extracted
                  </div>
                </div>
              </div>
              <button
                onClick={removeUploadedFile}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        <div className="relative">
          {/* Dropdown menu */}
          {showDropdown && (
            <div 
              ref={dropdownRef}
              className="absolute bottom-full left-0 mb-2 bg-gray-700 rounded-xl shadow-lg py-2 min-w-[280px] z-50"
            >
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                  setShowDropdown(false)
                }}
                disabled={isLoading || isUploading}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-600 flex items-center gap-3 transition-colors"
              >
                <span className="text-lg">📎</span>
                <span>Add photos & files</span>
              </button>
              
              <button
                onClick={handleWebSearch}
                disabled={isLoading}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-600 flex items-center gap-3 transition-colors"
              >
                <span className="text-lg">🔍</span>
                <span>Web search</span>
              </button>
            </div>
          )}

          <div className="flex items-end gap-3 bg-gray-800 rounded-3xl p-3">
            {/* Plus button with dropdown */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isLoading || isUploading}
              className="flex-shrink-0 w-8 h-8 bg-transparent text-gray-400 hover:text-white disabled:opacity-50 flex items-center justify-center text-xl font-light transition-colors"
              title="Add files or search the web"
            >
              {isUploading ? '⏳' : '+'}
            </button>
            
            <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder={uploadedFile ? "Ask me anything about the uploaded document..." : "Ask anything"}
            className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none min-h-[24px] max-h-[200px]"
            rows="1"
            disabled={isLoading || isUploading}
          />
          
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading || isUploading}
            className="flex-shrink-0 w-8 h-8 bg-white text-black rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 flex items-center justify-center text-sm transition-colors"
          >
            {isLoading ? '⋯' : '↑'}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}