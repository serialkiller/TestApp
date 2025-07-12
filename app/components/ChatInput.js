'use client'

import { useRef, useEffect } from 'react'

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

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="input-container">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
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