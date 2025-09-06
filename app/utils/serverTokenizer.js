// Server-side tokenizer helpers (rough estimation)

const GPT_4_MAX_TOKENS = 8192
const GPT_3_MAX_TOKENS = 4096

// Rough estimation: ~4 characters per token
export function estimateTokenCount(text) {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

export function chunkText(text, maxTokens = 2048) {
  const chunks = []
  const words = text.split(/(\s+)/) // keep whitespace so joining retains spacing
  let currentChunk = ''
  let currentTokenCount = 0

  for (const part of words) {
    const partTokens = estimateTokenCount(part)
    if (currentTokenCount + partTokens > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = ''
      currentTokenCount = 0
    }
    currentChunk += part
    currentTokenCount += partTokens
  }

  if (currentChunk.length > 0) chunks.push(currentChunk)

  return chunks
}

// Prepare a trimmed context (all messages except the last one if needed) and
// return chunks for the last message so the caller can send them sequentially.
export function prepareForChunkedSend(messages, model = 'gpt-4', reservedTokens = 1000) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { contextMessages: [], userChunks: [] }
  }

  const maxContextTokens = model && model.startsWith('gpt-4') ? GPT_4_MAX_TOKENS : GPT_3_MAX_TOKENS
  const maxInputTokens = maxContextTokens - reservedTokens

  // Separate last message (likely the large user payload)
  const lastMessage = messages[messages.length - 1]
  const priorMessages = messages.slice(0, -1)

  // Count tokens of prior messages
  let priorTokens = 0
  for (const m of priorMessages) {
    priorTokens += estimateTokenCount(m.content)
  }

  const lastTokens = estimateTokenCount(lastMessage.content)

  // If everything fits, return original as single chunk
  if (priorTokens + lastTokens <= maxInputTokens) {
    return { contextMessages: priorMessages, userChunks: [lastMessage.content] }
  }

  // Determine allowed tokens for the user chunk while preserving prior context if possible
  let allowedPerChunk = maxInputTokens - priorTokens

  // If prior context is too large to keep at all, drop it (we'll rely only on chunked user message)
  let contextMessages = priorMessages
  if (allowedPerChunk <= 0) {
    contextMessages = []
    allowedPerChunk = maxInputTokens
  }

  // Chunk the last message according to allowedPerChunk
  const chunks = chunkText(lastMessage.content, allowedPerChunk)

  return {
    contextMessages,
    userChunks: chunks,
  }
}
