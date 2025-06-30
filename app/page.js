'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [conversationTitle, setConversationTitle] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Generate conversation title from first message
  const generateTitle = (firstMessage) => {
    if (!firstMessage) return 'New Conversation'
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage
  }

  // Save conversation to localStorage
  const saveConversation = (convId, msgs, title) => {
    const conversation = {
      id: convId,
      title: title,
      messages: msgs,
      timestamp: Date.now()
    }
    
    const existingConversations = JSON.parse(localStorage.getItem('chat-conversations') || '[]')
    const updatedConversations = existingConversations.filter(c => c.id !== convId)
    updatedConversations.unshift(conversation)
    
    // Keep only last 50 conversations
    const limitedConversations = updatedConversations.slice(0, 50)
    localStorage.setItem('chat-conversations', JSON.stringify(limitedConversations))
    setConversations(limitedConversations)
  }

  // Load conversations from localStorage
  const loadConversations = () => {
    const saved = JSON.parse(localStorage.getItem('chat-conversations') || '[]')
    setConversations(saved)
  }

  // Create new conversation
  const createNewConversation = () => {
    const newId = Date.now().toString()
    setCurrentConversationId(newId)
    setMessages([])
    setConversationTitle('New Conversation')
    setShowSidebar(false)
  }

  // Load specific conversation
  const loadConversation = (conversation) => {
    setCurrentConversationId(conversation.id)
    setMessages(conversation.messages)
    setConversationTitle(conversation.title)
    setShowSidebar(false)
  }

  // Delete conversation
  const deleteConversation = (convId) => {
    const updatedConversations = conversations.filter(c => c.id !== convId)
    localStorage.setItem('chat-conversations', JSON.stringify(updatedConversations))
    setConversations(updatedConversations)
    
    if (currentConversationId === convId) {
      createNewConversation()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setShowApiKeyInput(false)
    }
    loadConversations()
  }, [])

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai-api-key', apiKey.trim())
      setShowApiKeyInput(false)
    }
  }

  const clearApiKey = () => {
    localStorage.removeItem('openai-api-key')
    setApiKey('')
    setShowApiKeyInput(true)
    setMessages([])
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    // Create conversation ID if this is the first message
    let convId = currentConversationId
    if (!convId) {
      convId = Date.now().toString()
      setCurrentConversationId(convId)
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          apiKey: apiKey
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const finalMessages = [...newMessages, { role: 'assistant', content: data.message }]
      setMessages(finalMessages)

      // Generate title from first user message and save conversation
      const title = messages.length === 0 ? generateTitle(userMessage.content) : conversationTitle
      setConversationTitle(title)
      saveConversation(convId, finalMessages, title)

    } catch (error) {
      console.error('Error:', error)
      const errorMessage = { 
        role: 'assistant', 
        content: `Error: ${error.message}. Please check your API key and try again.` 
      }
      const finalMessages = [...newMessages, errorMessage]
      setMessages(finalMessages)
      
      // Save even error conversations
      const title = messages.length === 0 ? generateTitle(userMessage.content) : conversationTitle
      saveConversation(convId, finalMessages, title)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
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

  if (showApiKeyInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Husains App</h1>
          <p className="text-gray-600 mb-4 text-sm">
            Enter your OpenAI API key to get started. Your key will be stored locally in your browser.
          </p>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && saveApiKey()}
            />
            <button
              onClick={saveApiKey}
              disabled={!apiKey.trim()}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Save API Key
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Get your API key from{' '}
            <a >
              
            </a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={createNewConversation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Conversations</h3>
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conv.id 
                        ? 'bg-gray-700' 
                        : 'hover:bg-gray-800'
                    }`}
                  >
                    <div 
                      onClick={() => loadConversation(conv)}
                      className="flex-1 min-w-0"
                    >
                      <p className="text-sm truncate">{conv.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(conv.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConversation(conv.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold truncate">
                {conversationTitle || 'Husains App'}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={createNewConversation}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
              >
                New Chat
              </button>
              <button
                onClick={clearApiKey}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Change API Key
              </button>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pb-32">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
                <p>Start a conversation by typing a message below.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-bubble ${
                    message.role === 'user' ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <div className={message.role === 'user' ? 'user-message' : 'assistant-message'}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        message.role === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {message.role === 'user' ? 'U' : 'AI'}
                      </div>
                      <div className="flex-1 min-w-0">
                        {message.role === 'assistant' ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            className="prose prose-sm max-w-none"
                            components={{
                              code({node, inline, className, children, ...props}) {
                                return inline ? (
                                  <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto">
                                    <code {...props}>{children}</code>
                                  </pre>
                                )
                              }
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-bubble bg-gray-50">
                  <div className="assistant-message">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
                        AI
                      </div>
                      <div className="flex-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="send-button"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}