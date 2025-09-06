'use client'

const GPT_4_MAX_TOKENS = 8192 // Maximum tokens for GPT-4
const GPT_3_MAX_TOKENS = 4096 // Maximum tokens for GPT-3.5

// Rough estimation of tokens (about 4 characters per token)
export function estimateTokenCount(text) {
    return Math.ceil(text.length / 4)
}

// Split text into chunks that fit within token limits
export function chunkText(text, maxTokens = 2048) {
    const chunks = []
    const words = text.split(' ')
    let currentChunk = []
    let currentTokenCount = 0

    for (const word of words) {
        const wordTokens = estimateTokenCount(word)
        if (currentTokenCount + wordTokens > maxTokens && currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '))
            currentChunk = []
            currentTokenCount = 0
        }
        currentChunk.push(word)
        currentTokenCount += wordTokens
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '))
    }

    return chunks
}

// Prepare messages array for API request, ensuring it fits within context window
export function prepareMessages(messages, model = 'gpt-4') {
    const maxContextTokens = model.startsWith('gpt-4') ? GPT_4_MAX_TOKENS : GPT_3_MAX_TOKENS
    const reservedTokens = 1000 // Reserve tokens for the response
    const maxInputTokens = maxContextTokens - reservedTokens

    let tokenCount = 0
    const preparedMessages = []

    // Process messages in reverse order (newest first)
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i]
        const messageTokens = estimateTokenCount(message.content)

        // Always include the last user message
        if (i === messages.length - 1) {
            if (messageTokens > maxInputTokens) {
                // If the last message is too large, chunk it
                const chunks = chunkText(message.content, maxInputTokens)
                message.content = chunks[0] // Use first chunk
                preparedMessages.unshift(message)
                break // Don't include any previous messages
            } else {
                preparedMessages.unshift(message)
                tokenCount += messageTokens
                continue
            }
        }

        // For previous messages
        if (tokenCount + messageTokens <= maxInputTokens) {
            preparedMessages.unshift(message)
            tokenCount += messageTokens
        } else {
            // If we can't fit more messages, stop here
            break
        }
    }

    return preparedMessages
}
