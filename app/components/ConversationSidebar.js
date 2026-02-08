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
  onBulkDeleteConversations,
  onArchiveConversation,
  onBulkArchiveConversations,
  onUnarchiveConversation,
  onBulkUnarchiveConversations,
  onToggleSidebar
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [showArchived, setShowArchived] = useState(false)

  const scopedConversations = useMemo(
    () => conversations.filter((c) => (showArchived ? !!c.archived : !c.archived)),
    [conversations, showArchived]
  )

  const fuse = useMemo(() => new Fuse(scopedConversations, {
    keys: ['title', 'messages.content'],
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 2
  }), [scopedConversations])

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return scopedConversations
    return fuse.search(searchQuery).map(result => result.item)
  }, [fuse, searchQuery, scopedConversations])

  const toggleSelectionMode = () => {
    setSelectionMode((v) => !v)
    setSelectedIds([])
  }

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const selectAllVisible = () => setSelectedIds(filteredConversations.map((c) => c.id))
  const clearSelected = () => setSelectedIds([])

  const runBulk = async (fn) => {
    if (selectedIds.length === 0) return
    await fn(selectedIds)
    setSelectedIds([])
    setSelectionMode(false)
  }

  return (
    <>
      <div className={`sidebar fixed inset-y-0 left-0 z-50 w-72 h-screen overflow-hidden bg-gray-900 text-white transform transition-transform duration-300 ease-in-out ${
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

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-gray-300">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show archived
              </label>
              <button
                onClick={toggleSelectionMode}
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
              >
                {selectionMode ? 'Cancel' : 'Select'}
              </button>
            </div>

            {selectionMode && (
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <button onClick={selectAllVisible} className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">All</button>
                  <button onClick={clearSelected} className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">None</button>
                  <span className="text-gray-400 self-center">{selectedIds.length} selected</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {!showArchived ? (
                    <>
                      <button onClick={() => runBulk(onBulkArchiveConversations)} className="px-2 py-1 rounded bg-blue-700 hover:bg-blue-600">Archive</button>
                      <button onClick={() => runBulk(onBulkDeleteConversations)} className="px-2 py-1 rounded bg-red-700 hover:bg-red-600">Delete</button>
                    </>
                  ) : (
                    <button onClick={() => runBulk(onBulkUnarchiveConversations)} className="px-2 py-1 rounded bg-green-700 hover:bg-green-600">Restore</button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain p-4 pr-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                {showArchived ? 'Archived Conversations' : 'Recent Conversations'}
              </h3>
              {isSyncing && (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            {scopedConversations.length === 0 ? (
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
                    selectionMode={selectionMode}
                    selected={selectedIds.includes(conv.id)}
                    onToggleSelect={() => toggleSelected(conv.id)}
                    onLoad={() => !selectionMode && onLoadConversation(conv)}
                    onUpdateTitle={() => onUpdateTitle(conv)}
                    onDelete={() => onDeleteConversation(conv.id)}
                    onArchive={() => onArchiveConversation(conv.id)}
                    onUnarchive={() => onUnarchiveConversation(conv.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}
    </>
  )
}

function ConversationItem({ conversation, isActive, onLoad, onUpdateTitle, onDelete, onArchive, onUnarchive, selectionMode, selected, onToggleSelect }) {
  return (
    <div
      className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-gray-700' : 'hover:bg-gray-800'
      }`}
      onClick={onLoad}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="min-w-0">
          <p className="text-sm truncate">{conversation.title}</p>
          <p className="text-xs text-gray-400">
            {new Date(conversation.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
      {!selectionMode && (
        <div className="flex gap-1">
          {!conversation.archived ? (
            <>
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
                  onArchive()
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-yellow-300 p-1 transition-opacity text-xs"
                title="Archive"
              >
                ⤴
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 p-1 transition-opacity"
                title="Delete"
              >
                ×
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onUnarchive()
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-green-400 p-1 transition-opacity text-xs"
              title="Restore"
            >
              ↩
            </button>
          )}
        </div>
      )}
    </div>
  )
}
