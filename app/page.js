'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ConversationStorage } from './utils/storage'
import { formatComparisonPrompt, getTableSuggestion } from './utils/comparisonHelper'
import { processTextContent } from './utils/textProcessor'
import { getImageSuggestion } from './utils/imageHelper'
import { detectFiles, uploadFiles, replaceFilesWithPlaceholders } from './utils/fileProcessor'
import FileDisplay from './components/FileDisplay'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(true)
  const [selectedModel, setSelectedModel] = useState('gpt-4.1')
  const [conversations, setConversations] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [storageInstance, setStorageInstance] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [conversationTitle, setConversationTitle] = useState('')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [tableSuggestion, setTableSuggestion] = useState(null)
  const [imageSuggestion, setImageSuggestion] = useState(null)
  const [messageFiles, setMessageFiles] = useState({}) // Store files for each message
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Available models for selection
  const availableModels = [
    { id: 'gpt-4.1', name: 'GPT-4.1', description: 'Latest and most capable GPT-4.1 model' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: 'Fast and efficient GPT-4.1' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: 'Lightweight GPT-4.1 model' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Previous generation GPT-4o model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and efficient GPT-4o' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'GPT-4 Turbo model' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Base GPT-4 model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K', description: 'GPT-3.5 Turbo with 16K context' },
    { id: 'gpt-3.5-turbo-instruct', name: 'GPT-3.5 Turbo Instruct', description: 'Instruction-tuned GPT-3.5' },
  ]

  // Default model for API calls
  const defaultModel = 'gpt-4.1'

  // Generate conversation title from first message
  const generateTitle = (firstMessage) => {
    if (!firstMessage) return 'New Conversation'
    return firstMessage.length > 30 ? firstMessage.substring(0, 30) + '...' : firstMessage
  }

  // Generate AI-powered title for conversation
  const generateAITitle = async (messages) => {
    setIsGeneratingTitle(true)
    try {
      const response = await fetch('/api/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages,
          apiKey: apiKey,
          model: selectedModel
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      return data.title
    } catch (error) {
      console.error('Error generating title:', error)
      // Fallback to simple title generation
      return generateTitle(messages[0]?.content)
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  // Save conversation to storage
  const saveConversation = async (convId, msgs, title) => {
    const conversation = {
      id: convId,
      title: title,
      messages: msgs,
      timestamp: Date.now()
    }
    
    const existingConversations = conversations.filter(c => c.id !== convId)
    const updatedConversations = [conversation, ...existingConversations]
    
    // Keep only last 50 conversations
    const limitedConversations = updatedConversations.slice(0, 50)
    
    if (storageInstance) {
      await storageInstance.saveConversations(limitedConversations)
    }
    
    setConversations(limitedConversations)
  }

  // Load conversations from storage
  const loadConversations = async () => {
    if (storageInstance) {
      setIsSyncing(true)
      try {
        const saved = await storageInstance.loadConversations()
        setConversations(saved)
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setIsSyncing(false)
      }
    }
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

  // Update conversation title with AI (for existing conversations)
  const updateConversationTitle = async (conversation) => {
    if (conversation.messages.length > 0) {
      try {
        const newTitle = await generateAITitle(conversation.messages)
        if (newTitle && newTitle !== conversation.title) {
          const updatedConversation = { ...conversation, title: newTitle }
          const updatedConversations = conversations.map(c => 
            c.id === conversation.id ? updatedConversation : c
          )
          
          if (storageInstance) {
            await storageInstance.saveConversations(updatedConversations)
          }
          
          setConversations(updatedConversations)
        }
      } catch (error) {
        console.error('Error updating conversation title:', error)
      }
    }
  }

  // Delete conversation
  const deleteConversation = async (convId) => {
    const updatedConversations = conversations.filter(c => c.id !== convId)
    
    if (storageInstance) {
      await storageInstance.saveConversations(updatedConversations)
    }
    
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
    const savedApiKey = localStorage.getItem('api-key')
    const savedModel = localStorage.getItem('api-model')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setShowApiKeyInput(false)
      // Initialize storage instance
      setStorageInstance(new ConversationStorage(savedApiKey))
    }
    // Set saved model or default
    setSelectedModel(savedModel || defaultModel)
  }, [])

  // Load conversations when storage instance is available
  useEffect(() => {
    if (storageInstance) {
      loadConversations()
    }
  }, [storageInstance])

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('api-key', apiKey.trim())
      setShowApiKeyInput(false)
      // Initialize storage instance
      setStorageInstance(new ConversationStorage(apiKey.trim()))
    }
  }

  const saveModel = (model) => {
    setSelectedModel(model)
    localStorage.setItem('api-model', model)
  }

  const clearApiKey = () => {
    localStorage.removeItem('api-key')
    localStorage.removeItem('api-model')
    setApiKey('')
    setSelectedModel(defaultModel)
    setShowApiKeyInput(true)
    setMessages([])
    setStorageInstance(null)
    setConversations([])
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
      // Add system message for comparison prompts to encourage table format
      let messagesToSend = newMessages
      if (getTableSuggestion(input.trim())) {
        messagesToSend = [
          { 
            role: 'system', 
            content: 'When comparing multiple items, please format your response in a table for better readability and organization. Use markdown formatting (not HTML tags) for lists, bold text, and other formatting. When explaining concepts that would benefit from visual aids, feel free to include relevant images using markdown image syntax: ![alt text](image_url). When asked to create or generate files, ALWAYS provide the actual file content in this exact format: ```filename.ext\nactual code content here\n```. IMPORTANT: Use the filename as the language identifier, not the programming language. For example, use ```data_analysis.py\ncode here\n``` NOT ```python\ncode here\n```.' 
          },
          ...newMessages
        ]
      } else {
        // Add general system message to encourage markdown formatting
        messagesToSend = [
          { 
            role: 'system', 
            content: 'Please use markdown formatting for your responses. Use **bold** for emphasis, *italic* for subtle emphasis, `code` for inline code, ``` for code blocks, and proper markdown lists (not HTML tags). When explaining concepts that would benefit from visual aids, feel free to include relevant images using markdown image syntax: ![alt text](image_url). When asked to create or generate files, ALWAYS provide the actual file content in this exact format: ```filename.ext\nactual code content here\n```. IMPORTANT: Use the filename as the language identifier, not the programming language. For example, use ```data_analysis.py\ncode here\n``` NOT ```python\ncode here\n```.' 
          },
          ...newMessages
        ]
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          apiKey: apiKey,
          model: selectedModel
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Process files in the response
      const detectedFiles = detectFiles(data.message)
      let processedContent = data.message
      let uploadedFiles = []

      if (detectedFiles.length > 0) {
        // Upload files to storage
        uploadedFiles = await uploadFiles(detectedFiles)
        
        if (uploadedFiles.length > 0) {
          // For files, we'll handle the display separately to avoid DOM nesting issues
          // Just store the original message and files, don't process markdown
          processedContent = data.message
        }
      }

      const finalMessages = [...newMessages, { role: 'assistant', content: processedContent }]
      
      // Store files for this message (after finalMessages is defined)
      if (uploadedFiles.length > 0) {
        setMessageFiles(prev => ({
          ...prev,
          [finalMessages.length - 1]: uploadedFiles // Use the correct index
        }))
      }
      
      setMessages(finalMessages)

      // Generate title from first user message and save conversation
      let title = conversationTitle
      if (messages.length === 0) {
        // This is the first message, generate AI title
        title = await generateAITitle(finalMessages)
        setConversationTitle(title)
      }
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
      let title = conversationTitle
      if (messages.length === 0) {
        // This is the first message, generate AI title
        title = await generateAITitle(finalMessages)
        setConversationTitle(title)
      }
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
            Enter your API key to get started. Your key will be stored locally in your browser.
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
            Get your API key from your AI service provider.
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">Recent Conversations</h3>
              {isSyncing && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
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
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          updateConversationTitle(conv)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-400 p-1 transition-opacity text-xs"
                        title="Update title with AI"
                      >
                        ↻
                      </button>
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
              <h1 className="text-xl font-semibold truncate flex items-center gap-2">
                {conversationTitle || 'Husains App'}
                {isGeneratingTitle && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </h1>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={selectedModel}
                onChange={(e) => saveModel(e.target.value)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Select AI Model"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
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

        {/* Model Info */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-gray-600">
              Using: <span className="font-medium">{availableModels.find(m => m.id === selectedModel)?.name}</span>
              <span className="text-gray-500 ml-2">- {availableModels.find(m => m.id === selectedModel)?.description}</span>
            </p>
          </div>
        </div>

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
                          (() => {
                            const files = messageFiles[index] || [];
                            
                            if (files.length > 0) {
                              // Render files separately to avoid DOM nesting issues
                              return (
                                <div className="space-y-4">
                                  {/* Render any text content before files */}
                                  {(() => {
                                    const textContent = message.content.replace(/```[\s\S]*?```/g, '').trim();
                                    if (textContent) {
                                      return (
                                        <ReactMarkdown
                                          remarkPlugins={[remarkGfm]}
                                          className="prose prose-sm max-w-none"
                                          components={{
                                            code({node, inline, className, children, ...props}) {
                                              return inline ? (
                                                <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props}>
                                                  {children}
                                                </code>
                                              ) : null // Don't render code blocks in text content
                                            },
                                            table({node, children, ...props}) {
                                              return (
                                                <div className="overflow-x-auto my-4">
                                                  <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden" {...props}>
                                                    {children}
                                                  </table>
                                                </div>
                                              )
                                            },
                                            th({node, children, ...props}) {
                                              return (
                                                <th className="bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-300" {...props}>
                                                  {children}
                                                </th>
                                              )
                                            },
                                            td({node, children, ...props}) {
                                              return (
                                                <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200" {...props}>
                                                  {children}
                                                </td>
                                              )
                                            },
                                            img({node, src, alt, ...props}) {
                                              return (
                                                <div className="my-4">
                                                  <img 
                                                    src={src} 
                                                    alt={alt || 'Image'} 
                                                    className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                      e.target.style.display = 'none';
                                                      e.target.nextSibling.style.display = 'block';
                                                    }}
                                                    {...props}
                                                  />
                                                  <div 
                                                    className="hidden p-4 bg-gray-100 rounded-lg text-center text-gray-500 text-sm"
                                                    style={{display: 'none'}}
                                                  >
                                                    <p>Image could not be loaded</p>
                                                    <p className="text-xs mt-1">{src}</p>
                                                  </div>
                                                  {alt && (
                                                    <p className="text-xs text-gray-500 mt-2 text-center italic">{alt}</p>
                                                  )}
                                                </div>
                                              )
                                            }
                                          }}
                                        >
                                          {processTextContent(textContent)}
                                        </ReactMarkdown>
                                      );
                                    }
                                    return null;
                                  })()}
                                  
                                  {/* Render files */}
                                  {files.map((fileInfo, fileIndex) => (
                                    <FileDisplay key={`file-${fileIndex}`} fileInfo={fileInfo} />
                                  ))}
                                </div>
                              );
                            } else {
                              // Regular markdown rendering for messages without files
                              return (
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
                                    },
                                    table({node, children, ...props}) {
                                      return (
                                        <div className="overflow-x-auto my-4">
                                          <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden" {...props}>
                                            {children}
                                          </table>
                                        </div>
                                      )
                                    },
                                    th({node, children, ...props}) {
                                      return (
                                        <th className="bg-gray-100 px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-300" {...props}>
                                          {children}
                                        </th>
                                      )
                                    },
                                    td({node, children, ...props}) {
                                      return (
                                        <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200" {...props}>
                                          {children}
                                        </td>
                                      )
                                    },
                                    img({node, src, alt, ...props}) {
                                      return (
                                        <div className="my-4">
                                          <img 
                                            src={src} 
                                            alt={alt || 'Image'} 
                                            className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                                            loading="lazy"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'block';
                                            }}
                                            {...props}
                                          />
                                          <div 
                                            className="hidden p-4 bg-gray-100 rounded-lg text-center text-gray-500 text-sm"
                                            style={{display: 'none'}}
                                          >
                                            <p>Image could not be loaded</p>
                                            <p className="text-xs mt-1">{src}</p>
                                          </div>
                                          {alt && (
                                            <p className="text-xs text-gray-500 mt-2 text-center italic">{alt}</p>
                                          )}
                                        </div>
                                      )
                                    }
                                  }}
                                >
                                  {processTextContent(message.content)}
                                </ReactMarkdown>
                              );
                            }
                          })()
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