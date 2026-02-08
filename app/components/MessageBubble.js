'use client'

import React, { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { processTextContent } from '../utils/textProcessor'
import { isMultiFileResponse } from '../utils/fileProcessor'
import FileDisplay from './FileDisplay'
import MultiFileDownload from './MultiFileDownload'

function MessageBubble({ message, index, messageFiles = {} }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`message-bubble ${isUser ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900'}`}>
      <div className={isUser ? 'user-message' : 'assistant-message'}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isUser ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {isUser ? 'U' : 'AI'}
          </div>
          <div className="flex-1 min-w-0">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <AssistantMessage message={message} messageFiles={messageFiles} index={index} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(MessageBubble)

function AssistantMessage({ message, messageFiles, index }) {
  const files = messageFiles[index] || []
  const isMultiFile = isMultiFileResponse(message.content)
  
  if (files.length > 0) {
    return (
      <div className="space-y-4">
        {/* Show multi-file download option at the top if applicable */}
        {isMultiFile && (
          <MultiFileDownload 
            files={files} 
            messageContent={message.content}
          />
        )}
        
        {(() => {
          const textContent = message.content.replace(/```[\s\S]*?```/g, '').trim()
          if (textContent) {
            return (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                className="prose prose-sm max-w-none dark:prose-invert"
                components={getMarkdownComponents()}
              >
                {processTextContent(textContent)}
              </ReactMarkdown>
            )
          }
          return null
        })()}
        
        {files.map((fileInfo, fileIndex) => (
          <FileDisplay key={`file-${fileIndex}`} fileInfo={fileInfo} />
        ))}
      </div>
    )
  }

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      className="prose prose-sm max-w-none dark:prose-invert"
      components={getMarkdownComponents()}
    >
      {processTextContent(message.content)}
    </ReactMarkdown>
  )
}

function getMarkdownComponents() {
  return {
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
          <table className="min-w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden" {...props}>
            {children}
          </table>
        </div>
      )
    },
    th({node, children, ...props}) {
      return (
        <th className="bg-gray-100 dark:bg-gray-800 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600" {...props}>
          {children}
        </th>
      )
    },
    td({node, children, ...props}) {
      return (
        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700" {...props}>
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
            className="max-w-full h-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
            loading="lazy"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={(e) => {
              // If not already using the proxy, retry via server-side image proxy
              const currentSrc = e.currentTarget.getAttribute('src') || ''
              if (!currentSrc.startsWith('/api/image-proxy?')) {
                const proxied = `/api/image-proxy?url=${encodeURIComponent(currentSrc)}`
                e.currentTarget.setAttribute('src', proxied)
                // Don't show error UI yet; let the proxy attempt
                return
              }
              // Proxy also failed – show error UI
              e.currentTarget.style.display = 'none'
              const errorDiv = e.currentTarget.nextSibling
              if (errorDiv) errorDiv.style.display = 'block'
            }}
            {...props}
          />
          <div 
            className="hidden p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-300 text-sm"
            style={{display: 'none'}}
          >
            <p>Image could not be loaded</p>
            <p className="text-xs mt-1 break-all">{src}</p>
            <button 
              onClick={() => window.open(src, '_blank')}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              Open in new tab
            </button>
          </div>
          {alt && (
            <p className="text-xs text-gray-500 mt-2 text-center italic">{alt}</p>
          )}
        </div>
      )
    }
  }
}
