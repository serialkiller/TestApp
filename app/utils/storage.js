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
      console.log('=== SAVING CONVERSATIONS ===')
      console.log('useCloudStorage:', this.useCloudStorage)
      console.log('Conversations to save:', conversations.length)
      
      // Save to local storage first (fast)
      localStorage.setItem(this.localKey, JSON.stringify(conversations))
      console.log('Saved to local storage')
      
      // Save to cloud storage if enabled (async, no blocking)
      if (this.useCloudStorage) {
        console.log('Saving to cloud storage...')
        const cloudResult = await this.saveToCloud(conversations)
        console.log('Cloud save result:', cloudResult)
      } else {
        console.log('Cloud storage disabled, skipping cloud save')
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
      console.log('=== LOADING CONVERSATIONS ===')
      console.log('useCloudStorage:', this.useCloudStorage)
      
      // Load from local storage first (fast)
      const localConversations = JSON.parse(localStorage.getItem(this.localKey) || '[]')
      console.log('Local conversations:', localConversations.length)
      
      // Try to sync from cloud storage if enabled
      if (this.useCloudStorage) {
        console.log('Attempting cloud sync...')
        const cloudConversations = await this.loadFromCloud()
        
        if (cloudConversations && cloudConversations.length > 0) {
          console.log('Cloud conversations found:', cloudConversations.length)
          // Merge conversations, keeping the most recent version of each
          const merged = this.mergeConversations(localConversations, cloudConversations)
          localStorage.setItem(this.localKey, JSON.stringify(merged))
          console.log('Merged conversations:', merged.length)
          return merged
        } else {
          console.log('No cloud conversations found')
        }
      } else {
        console.log('Cloud storage disabled, using local only')
      }
      
      console.log('Returning local conversations:', localConversations.length)
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
      console.log('Attempting to save to cloud storage...')
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

      console.log('Cloud storage response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Cloud storage error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        console.error('Cloud storage API error:', data.error)
        throw new Error(data.error)
      }

      console.log('Successfully saved to cloud storage')
      return true
    } catch (error) {
      console.error('Error saving to cloud:', error)
      return false
    }
  }

  // Load from cloud storage
  async loadFromCloud() {
    try {
      console.log('Attempting to load from cloud storage...')
      const response = await fetch(`/api/conversations?apiKey=${encodeURIComponent(this.apiKey)}`)
      
      console.log('Cloud load response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Cloud load error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.error) {
        console.error('Cloud load API error:', data.error)
        throw new Error(data.error)
      }

      console.log('Successfully loaded from cloud storage:', data.conversations?.length || 0, 'conversations')
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