'use client'

import { useState, useRef, useEffect } from 'react'
import { ConversationStorage } from './utils/storage'
import { formatComparisonPrompt, getTableSuggestion } from './utils/comparisonHelper'
import { getImageSuggestion } from './utils/imageHelper'
import { detectFiles, uploadFiles, replaceFilesWithPlaceholders } from './utils/fileProcessor'
import MessageBubble from './components/MessageBubble'
import ConversationSidebar from './components/ConversationSidebar'
import ChatInput from './components/ChatInput'
import Header from './components/Header'

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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
    const savedModel = localStorage.getItem('api-model')
    const isAuth = localStorage.getItem('is-authenticated')
    
    if (isAuth === 'true') {
      setIsAuthenticated(true)
      setShowPasswordInput(false)
      // Initialize storage instance with a placeholder API key (will be fetched from config)
      setStorageInstance(new ConversationStorage('placeholder'))
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

  const authenticatePassword = async () => {
    if (password.trim()) {
      try {
        const response = await fetch('/api/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            password: password.trim()
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            localStorage.setItem('is-authenticated', 'true')
            setIsAuthenticated(true)
            setShowPasswordInput(false)
            // Initialize storage instance
            setStorageInstance(new ConversationStorage('placeholder'))
          } else {
            alert('Invalid password')
          }
        } else {
          alert('Authentication failed')
        }
      } catch (error) {
        console.error('Authentication error:', error)
        alert('Authentication failed')
      }
    }
  }

  const saveModel = (model) => {
    setSelectedModel(model)
    localStorage.setItem('api-model', model)
  }

  const logout = () => {
    localStorage.removeItem('is-authenticated')
    localStorage.removeItem('api-model')
    setPassword('')
    setSelectedModel(defaultModel)
    setShowPasswordInput(true)
    setIsAuthenticated(false)
    setMessages([])
    setStorageInstance(null)
    setConversations([])
  }

  const goToConfig = () => {
    window.location.href = '/config'
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


  if (showPasswordInput) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Husains App</h1>
          <p className="text-gray-600 mb-4 text-sm">
            Enter your password to access the application.
          </p>
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && authenticatePassword()}
            />
            <button
              onClick={authenticatePassword}
              disabled={!password.trim()}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Login
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Contact your administrator for access credentials.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <ConversationSidebar
        showSidebar={showSidebar}
        conversations={conversations}
        currentConversationId={currentConversationId}
        isSyncing={isSyncing}
        onCreateNew={createNewConversation}
        onLoadConversation={loadConversation}
        onUpdateTitle={updateConversationTitle}
        onDeleteConversation={deleteConversation}
        onToggleSidebar={() => setShowSidebar(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
                 <Header
           conversationTitle={conversationTitle}
           isGeneratingTitle={isGeneratingTitle}
           selectedModel={selectedModel}
           availableModels={availableModels}
           showSidebar={showSidebar}
           onToggleSidebar={() => setShowSidebar(!showSidebar)}
           onModelChange={saveModel}
           onNewChat={createNewConversation}
           onLogout={logout}
           onConfig={goToConfig}
         />

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
                <MessageBubble
                  key={index}
                  message={message}
                  index={index}
                  messageFiles={messageFiles}
                />
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

        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={sendMessage}
        />
      </div>
    </div>
  )
}