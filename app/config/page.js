'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfigPage() {
  const [configurations, setConfigurations] = useState([])
  const [loading, setLoading] = useState(true)
  const [newConfig, setNewConfig] = useState({
    name: '',
    api_key: '',
    provider: 'openai',
    is_active: true
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const isAuth = localStorage.getItem('is-authenticated')
    if (isAuth !== 'true') {
      router.push('/')
      return
    }

    loadConfigurations()
  }, [router])

  const loadConfigurations = async () => {
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const data = await response.json()
        setConfigurations(data.configurations || [])
      } else {
        console.error('Failed to load configurations')
      }
    } catch (error) {
      console.error('Error loading configurations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddConfig = async (e) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConfig),
      })

      if (response.ok) {
        setNewConfig({ name: '', api_key: '', provider: 'openai', is_active: true })
        setShowAddForm(false)
        loadConfigurations()
      } else {
        const error = await response.json()
        alert(`Failed to add configuration: ${error.error}`)
      }
    } catch (error) {
      console.error('Error adding configuration:', error)
      alert('Failed to add configuration')
    }
  }

  const handleDeleteConfig = async (id) => {
    if (!confirm('Are you sure you want to delete this configuration?')) {
      return
    }

    try {
      const response = await fetch(`/api/config/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadConfigurations()
      } else {
        alert('Failed to delete configuration')
      }
    } catch (error) {
      console.error('Error deleting configuration:', error)
      alert('Failed to delete configuration')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading configurations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">API Configuration</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Back to Chat
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {showAddForm ? 'Cancel' : 'Add Configuration'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddConfig} className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">Add New Configuration</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., OpenAI Production"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Provider</label>
                  <select
                    value={newConfig.provider}
                    onChange={(e) => setNewConfig({ ...newConfig, provider: e.target.value })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <input
                    type="password"
                    value={newConfig.api_key}
                    onChange={(e) => setNewConfig({ ...newConfig, api_key: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="sk-..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newConfig.is_active}
                      onChange={(e) => setNewConfig({ ...newConfig, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Add Configuration
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {configurations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No configurations found. Add your first API configuration above.</p>
            ) : (
              configurations.map((config) => (
                <div key={config.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{config.name}</h3>
                      <p className="text-sm text-gray-600">Provider: {config.provider}</p>
                      <p className="text-sm text-gray-600">
                        Status: 
                        <span className={`ml-1 ${config.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(config.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 