'use client'

import { useState, useEffect } from 'react'
import { ConversationStorage } from '../utils/storage'
import { getStorageMode, isCloudStorageAvailable } from '../config/storage'

export default function DebugPage() {
  const [storage, setStorage] = useState(null)
  const [conversations, setConversations] = useState([])
  const [logs, setLogs] = useState([])
  const [apiKey, setApiKey] = useState('')
  const [testResults, setTestResults] = useState(null)
  const [loading, setLoading] = useState(false)

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addLog('Debug page loaded')
    addLog(`Storage mode: ${getStorageMode()}`)
    addLog(`Cloud storage available: ${isCloudStorageAvailable()}`)
  }, [])

  const initializeStorage = () => {
    if (!apiKey.trim()) {
      addLog('Error: API key required')
      return
    }
    
    addLog('Initializing storage with API key')
    const storageInstance = new ConversationStorage(apiKey)
    setStorage(storageInstance)
    addLog('Storage initialized')
  }

  const loadConversations = async () => {
    if (!storage) {
      addLog('Error: Storage not initialized')
      return
    }
    
    setLoading(true)
    addLog('Loading conversations...')
    try {
      const convs = await storage.loadConversations()
      setConversations(convs)
      addLog(`Loaded ${convs.length} conversations`)
    } catch (error) {
      addLog(`Error loading conversations: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const saveTestConversation = async () => {
    if (!storage) {
      addLog('Error: Storage not initialized')
      return
    }
    
    const testConversation = {
      id: Date.now().toString(),
      title: 'Test Conversation',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ],
      timestamp: Date.now()
    }
    
    setLoading(true)
    addLog('Saving test conversation...')
    try {
      const result = await storage.saveConversations([testConversation])
      addLog(`Save result: ${result}`)
      
      // Reload conversations
      await loadConversations()
    } catch (error) {
      addLog(`Error saving conversation: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSupabaseConnection = async () => {
    setLoading(true)
    addLog('Testing Supabase connection...')
    try {
      const response = await fetch('/api/test-supabase')
      const data = await response.json()
      setTestResults(data)
      
      if (data.success) {
        addLog('✅ Supabase connection test: PASSED')
        addLog(`Tests: ${JSON.stringify(data.tests)}`)
      } else {
        addLog(`❌ Supabase connection test: FAILED - ${data.error}`)
        if (data.details) {
          addLog(`Details: ${data.details}`)
        }
      }
    } catch (error) {
      addLog(`❌ Supabase connection test: ERROR - ${error.message}`)
      setTestResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testEnvironmentVariables = async () => {
    setLoading(true)
    addLog('Testing environment variables...')
    try {
      const response = await fetch('/api/debug-env')
      const data = await response.json()
      
      addLog(`Environment variables:`)
      addLog(`  Supabase URL: ${data.supabaseUrl}`)
      addLog(`  Supabase Key: ${data.supabaseKey}`)
      addLog(`  Key length: ${data.supabaseKeyLength}`)
      addLog(`  Key prefix: ${data.supabaseKeyPrefix}`)
    } catch (error) {
      addLog(`❌ Environment test: ERROR - ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const clearConversations = async () => {
    if (!storage) {
      addLog('Error: Storage not initialized')
      return
    }
    
    setLoading(true)
    addLog('Clearing conversations...')
    try {
      const result = await storage.clearConversations()
      addLog(`Clear result: ${result}`)
      setConversations([])
    } catch (error) {
      addLog(`Error clearing conversations: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Storage Debug Page</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Controls</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">API Key:</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter your OpenAI API key"
            />
          </div>
          
          <div className="space-y-2">
            <button
              onClick={initializeStorage}
              disabled={loading}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Initialize Storage
            </button>
            
            <button
              onClick={testEnvironmentVariables}
              disabled={loading}
              className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              Test Environment Variables
            </button>
            
            <button
              onClick={testSupabaseConnection}
              disabled={loading}
              className="w-full p-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              Test Supabase Connection
            </button>
            
            <button
              onClick={loadConversations}
              disabled={loading || !storage}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Load Conversations
            </button>
            
            <button
              onClick={saveTestConversation}
              disabled={loading || !storage}
              className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              Save Test Conversation
            </button>
            
            <button
              onClick={clearConversations}
              disabled={loading || !storage}
              className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Clear Conversations
            </button>
            
            <button
              onClick={clearLogs}
              className="w-full p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Conversations ({conversations.length})</h2>
          <div className="border rounded p-4 max-h-64 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-gray-500">No conversations loaded</p>
            ) : (
              conversations.map((conv, index) => (
                <div key={conv.id} className="mb-2 p-2 bg-gray-100 rounded">
                  <div className="font-medium">{conv.title}</div>
                  <div className="text-sm text-gray-600">
                    {conv.messages.length} messages • {new Date(conv.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <div className="border rounded p-4 max-h-64 overflow-y-auto">
            {testResults ? (
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No test results yet</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Debug Logs</h2>
        <div className="border rounded p-4 bg-gray-50 max-h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 