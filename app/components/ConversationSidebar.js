'use client'

import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'

export default function ConversationSidebar({
  showSidebar,
  conversations,
  currentConversationId,
  isSyncing,
  onCreateNew,
  onLoadConversation,
  onUpdateTitle,
  onDeleteConversation,
  onToggleSidebar
}) {
  const [searchQuery, setSearchQuery] = useState('')

  // Initialize Fuse instance for fuzzy search
  const fuse = useMemo(() => new Fuse(conversations, {
    keys: ['title', 'messages.content'],
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2
  }), [conversations])

  // Get filtered conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations
    return fuse.search(searchQuery).map(result => result.item)
  }, [fuse, searchQuery, conversations])
  return (
    <>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-700 space-y-3">
            <button
              onClick={onCreateNew}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + New Chat
            </button>
            
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
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
            ) : searchQuery && filteredConversations.length === 0 ? (
              <p className="text-gray-500 text-sm">No conversations found for "{searchQuery}"</p>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={currentConversationId === conv.id}
                    onLoad={() => onLoadConversation(conv)}
                    onUpdateTitle={() => onUpdateTitle(conv)}
                    onDelete={() => onDeleteConversation(conv.id)}
                  />
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
          onClick={onToggleSidebar}
        />
      )}
    </>
  )
}

function ConversationItem({ conversation, isActive, onLoad, onUpdateTitle, onDelete }) {
  return (
    <div
      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
      }`}
    >
      <div onClick={onLoad} className="flex-1 min-w-0">
        <p className="text-sm truncate">{conversation.title}</p>
        <p className="text-xs text-gray-400">
          {new Date(conversation.timestamp).toLocaleDateString()}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onUpdateTitle()
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-400 p-1 transition-opacity text-xs"
          title="Update title with AI"
        >
          ↻
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  )
}