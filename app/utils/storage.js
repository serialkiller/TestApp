import { getStorageMode } from '../config/storage'

// Storage service for conversations
export class ConversationStorage {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.localKey = 'chat-conversations'
    this.useCloudStorage = getStorageMode() === 'supabase'
  }

  // Save conversations to both local and cloud storage
  async saveConversations(conversations) {
    try {
      // Save to local storage first (fast)
      localStorage.setItem(this.localKey, JSON.stringify(conversations))
      
      // Save to cloud storage if enabled (async, no blocking)
      if (this.useCloudStorage) {
        this.saveToCloud(conversations)
      }
      
      return true
    } catch (error) {
      console.error('Error saving conversations:', error)
      return false
    }
  }

  // Load conversations from local storage first, then sync from cloud
  async loadConversations() {
    try {
      // Load from local storage first (fast)
      const localConversations = JSON.parse(localStorage.getItem(this.localKey) || '[]')
      
      // Try to sync from cloud storage if enabled
      if (this.useCloudStorage) {
        const cloudConversations = await this.loadFromCloud()
        
        if (cloudConversations && cloudConversations.length > 0) {
          // Merge conversations, keeping the most recent version of each
          const merged = this.mergeConversations(localConversations, cloudConversations)
          localStorage.setItem(this.localKey, JSON.stringify(merged))
          return merged
        }
      }
      
      return localConversations
    } catch (error) {
      console.error('Error loading conversations:', error)
      // Fallback to local storage only
      return JSON.parse(localStorage.getItem(this.localKey) || '[]')
    }
  }

  // Save to cloud storage
  async saveToCloud(conversations) {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversations,
          apiKey: this.apiKey
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      return true
    } catch (error) {
      console.error('Error saving to cloud:', error)
      return false
    }
  }

  // Load from cloud storage
  async loadFromCloud() {
    try {
      const response = await fetch(`/api/conversations?apiKey=${encodeURIComponent(this.apiKey)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(data.error)
      }

      return data.conversations || []
    } catch (error) {
      console.error('Error loading from cloud:', error)
      return null
    }
  }

  // Merge conversations from local and cloud storage
  mergeConversations(local, cloud) {
    const merged = [...local]
    
    cloud.forEach(cloudConv => {
      const existingIndex = merged.findIndex(localConv => localConv.id === cloudConv.id)
      
      if (existingIndex === -1) {
        // New conversation from cloud
        merged.push(cloudConv)
      } else {
        // Merge existing conversation (keep the most recent version)
        const localConv = merged[existingIndex]
        if (cloudConv.timestamp > localConv.timestamp) {
          merged[existingIndex] = cloudConv
        }
      }
    })
    
    // Sort by timestamp (most recent first)
    return merged.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Clear all conversations
  async clearConversations() {
    try {
      localStorage.removeItem(this.localKey)
      // Note: Cloud storage will be cleared when user changes API key
      return true
    } catch (error) {
      console.error('Error clearing conversations:', error)
      return false
    }
  }
} 