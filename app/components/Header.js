'use client'

export default function Header({
  conversationTitle,
  isGeneratingTitle,
  selectedModel,
  availableModels,
  showSidebar,
  onToggleSidebar,
  onModelChange,
  onNewChat,
  onClearApiKey
}) {
  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
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
            <ModelSelector
              selectedModel={selectedModel}
              availableModels={availableModels}
              onChange={onModelChange}
            />
            <button
              onClick={onNewChat}
              className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            >
              New Chat
            </button>
            <button
              onClick={onClearApiKey}
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
    </>
  )
}

function ModelSelector({ selectedModel, availableModels, onChange }) {
  return (
    <select
      value={selectedModel}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      title="Select AI Model"
    >
      {availableModels.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name}
        </option>
      ))}
    </select>
  )
}