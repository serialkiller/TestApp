// Local file-based storage service (fallback option)
export class LocalFileStorage {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.localKey = 'chat-conversations'
  }

  // Save conversations to localStorage only
  async saveConversations(conversations) {
    try {
      localStorage.setItem(this.localKey, JSON.stringify(conversations))
      return true
    } catch (error) {
      console.error('Error saving conversations:', error)
      return false
    }
  }

  // Load conversations from localStorage only
  async loadConversations() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.localKey) || '[]')
      return saved
    } catch (error) {
      console.error('Error loading conversations:', error)
      return []
    }
  }

  // Clear all conversations
  async clearConversations() {
    try {
      localStorage.removeItem(this.localKey)
      return true
    } catch (error) {
      console.error('Error clearing conversations:', error)
      return false
    }
  }
} 