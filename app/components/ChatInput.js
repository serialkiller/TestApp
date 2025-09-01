'use client'

import { useRef, useEffect, useCallback } from 'react'

export default function ChatInput({ 
  input, 
  setInput, 
  isLoading, 
  onSend 
}) {
  const textareaRef = useRef(null)

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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="input-container">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message here..."
            className="chat-input pr-16"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}