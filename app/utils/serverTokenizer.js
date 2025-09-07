// Server-side tokenizer helpers (enhanced, still estimation-based)

// Model context window estimates (tokens)
const MODEL_CONTEXT = {
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4.1': 128000,
  'gpt-4.1-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gpt-3.5-turbo-16k': 16384,
  'gpt-3.5-turbo': 4096,
}

// Rough estimation: ~4 characters per token
export function estimateTokenCount(text) {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

function getModelContextSize(model) {
  if (!model) return 8192
  // direct hit
  if (MODEL_CONTEXT[model]) return MODEL_CONTEXT[model]
  // fuzzy match by prefix
  const key = Object.keys(MODEL_CONTEXT).find(k => model.startsWith(k))
  return key ? MODEL_CONTEXT[key] : 8192
}

function countMessagesTokens(msgs) {
  // Add small overhead per message for role/format
  let sum = 0
  for (const m of msgs) {
    sum += 4 + estimateTokenCount(m.content || '')
  }
  return sum
}

function splitIntoParagraphs(text) {
  return text.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean)
}

function splitIntoSentences(text) {
  // Naive sentence splitter: split on ., !, ? followed by space/newline
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z0-9\-\(\[])|\n+/)
  return parts.map(s => s.trim()).filter(Boolean)
}

function chunkTextSmart(text, maxTokens = 2048, overlapTokens = 100) {
  if (!text) return []
  const chunks = []
  const paragraphs = splitIntoParagraphs(text)

  let current = ''
  let currentTokens = 0
  const flush = () => {
    if (!current) return
    chunks.push(current)
  }

  for (const para of paragraphs) {
    const paraTokens = estimateTokenCount(para)
    if (paraTokens > maxTokens) {
      // split further into sentences
      const sentences = splitIntoSentences(para)
      // If we still have one massive sentence (no punctuation), fallback to fixed-size slices
      if (sentences.length === 1 && estimateTokenCount(sentences[0]) > maxTokens) {
        const pieces = sliceByTokens(sentences[0], maxTokens, overlapTokens)
        for (const piece of pieces) {
          const t = estimateTokenCount(piece)
          if (currentTokens + t > maxTokens && current) {
            flush()
            if (overlapTokens > 0 && chunks.length > 0) {
              const tail = tailByTokens(chunks[chunks.length - 1], overlapTokens)
              current = tail ? tail + '\n' : ''
              currentTokens = estimateTokenCount(current)
            } else {
              current = ''
              currentTokens = 0
            }
          }
          current += (current ? ' ' : '') + piece
          currentTokens += t
        }
      } else {
        for (const s of sentences) {
          const t = estimateTokenCount(s)
          if (currentTokens + t > maxTokens && current) {
            flush()
            // create overlap by taking tail from previous chunk
            if (overlapTokens > 0 && chunks.length > 0) {
              const tail = tailByTokens(chunks[chunks.length - 1], overlapTokens)
              current = tail ? tail + '\n' : ''
              currentTokens = estimateTokenCount(current)
            } else {
              current = ''
              currentTokens = 0
            }
          }
          current += (current ? ' ' : '') + s
          currentTokens += t
        }
      }
      continue
    }

    // paragraph fits or continues current
    if (currentTokens + paraTokens > maxTokens && current) {
      flush()
      if (overlapTokens > 0 && chunks.length > 0) {
        const tail = tailByTokens(chunks[chunks.length - 1], overlapTokens)
        current = tail ? tail + '\n' : ''
        currentTokens = estimateTokenCount(current)
      } else {
        current = ''
        currentTokens = 0
      }
    }
    current += (current ? '\n\n' : '') + para
    currentTokens += paraTokens
  }

  flush()
  return chunks
}

function tailByTokens(text, tokenBudget) {
  if (!text || tokenBudget <= 0) return ''
  // take from the end by characters approximating tokens*4, then trim to sentence boundary if possible
  const approxChars = tokenBudget * 4
  const start = Math.max(0, text.length - approxChars)
  let tail = text.slice(start)
  // try to start at a sentence boundary to avoid mid-word overlap
  const idx = tail.search(/[A-Z0-9\-\(\[]/)
  if (idx > 0 && idx < 40) tail = tail.slice(idx)
  return tail.trim()
}

function sliceByTokens(text, maxTokens, overlapTokens) {
  const res = []
  if (!text) return res
  const charLimit = Math.max(1, maxTokens * 4)
  const overlapChars = Math.max(0, Math.min(charLimit - 1, overlapTokens * 4))
  let i = 0
  while (i < text.length) {
    const end = Math.min(text.length, i + charLimit)
    res.push(text.slice(i, end))
    if (end >= text.length) break
    i = end - overlapChars
  }
  return res
}

// Prepare trimmed context + smart chunks for the last user message.
// reservedTokens ~= desired max output tokens + safety margin.
export function prepareForChunkedSend(messages, model = 'gpt-4.1', reservedTokens = 1200) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { contextMessages: [], userChunks: [], totalChunks: 0 }
  }

  const maxContextTokens = getModelContextSize(model)
  const maxInputTokens = Math.max(1024, maxContextTokens - reservedTokens)

  // Separate last message (likely the large user payload)
  const lastMessage = messages[messages.length - 1]
  const priorMessagesAll = messages.slice(0, -1)

  // Always try to keep system messages; then most recent turns until a budget
  const systemMsgs = priorMessagesAll.filter(m => m.role === 'system')
  const nonSystem = priorMessagesAll.filter(m => m.role !== 'system')

  const historyBudget = Math.floor(maxInputTokens * 0.3) // up to 30% for history
  const kept = [...systemMsgs]
  let tokens = countMessagesTokens(kept)
  for (let i = nonSystem.length - 1; i >= 0; i--) {
    const m = nonSystem[i]
    const t = 4 + estimateTokenCount(m.content || '')
    if (tokens + t > historyBudget) break
    kept.unshift(m) // keep chronological order
    tokens += t
  }

  const lastTokens = estimateTokenCount(lastMessage.content)
  const remainingForUser = Math.max(256, maxInputTokens - tokens)

  // If everything fits, return original as single chunk
  if (tokens + lastTokens <= maxInputTokens) {
    return { contextMessages: kept, userChunks: [lastMessage.content], totalChunks: 1 }
  }

  // Chunk the last message according to remaining budget with overlap
  // Use small overlap for continuity
  const overlap = Math.min(200, Math.floor(remainingForUser * 0.1))
  const chunks = chunkTextSmart(lastMessage.content, remainingForUser, overlap)

  return {
    contextMessages: kept,
    userChunks: chunks,
    totalChunks: chunks.length,
  }
}
