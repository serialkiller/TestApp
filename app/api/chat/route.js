import OpenAI from 'openai'
import { NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'
import { prepareForChunkedSend } from '../../utils/serverTokenizer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create Supabase client if both URL and key are available
let supabase = null
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request) {
  try {
    const { messages, model = 'gpt-4.1' } = await request.json()

    // Get API key from Supabase configuration or environment variable
    let apiKey = process.env.API_KEY // Fallback to environment variable
    
    if (supabase) {
      const { data: configs, error } = await supabase
        .from('api_configs')
        .select('api_key')
        .eq('provider', 'openai')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: 'Failed to fetch API configuration' }, { status: 500 })
      }

      if (configs && configs.length > 0) {
        apiKey = configs[0].api_key
      }
    }

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No API key found. Please configure either Supabase with API configs or set API_KEY environment variable.' 
      }, { status: 500 })
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const openai = new OpenAI({ apiKey })

    // Prepare chunks with improved tokenizer (overlap + dynamic budget)
    // Reserve ~1200 tokens for output+safety inside helper.
    const { contextMessages, userChunks, totalChunks } = prepareForChunkedSend(messages, model)

    let aggregatedAssistant = ''

    // Small helper to trim previous assistant for continuity context
    const trimForContext = (text, maxChars = 4000) => {
      if (!text) return ''
      return text.length > maxChars ? text.slice(-maxChars) : text
    }

    // Send each chunk sequentially, keeping continuity
    for (let i = 0; i < userChunks.length; i++) {
      const chunk = userChunks[i]

      const msgs = []

      // Guidance system message to keep continuity and avoid repetition
      msgs.push({
        role: 'system',
        content: `You will receive the user's input in multiple parts. This is part ${i + 1} of ${totalChunks}. Produce one continuous, coherent answer. Do not repeat content you've already produced; continue seamlessly from where you left off.`
      })

      // include prior preserved context only once (first chunk)
      if (i === 0 && contextMessages && contextMessages.length > 0) {
        msgs.push(...contextMessages)
      } else if (i > 0 && aggregatedAssistant) {
        // On subsequent chunks, give the model its previous output to maintain continuity
        msgs.push({ role: 'assistant', content: trimForContext(aggregatedAssistant) })
      }

      // append the current user chunk (tagged to indicate part)
      msgs.push({ role: 'user', content: chunk })

      const completionParams = {
        model,
        messages: msgs,
        max_tokens: 1000,
        temperature: 0.7,
      }

      const completion = await openai.chat.completions.create(completionParams)
      const assistantPart = completion.choices[0]?.message?.content

      if (!assistantPart) {
        return NextResponse.json({ error: 'No response from OpenAI for a chunk' }, { status: 500 })
      }

      aggregatedAssistant += (aggregatedAssistant ? '\n' : '') + assistantPart
    }

    return NextResponse.json({ message: aggregatedAssistant })

  } catch (error) {
    console.error('OpenAI API error:', error)
    
    if (error.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }
    
    if (error.status === 429) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Something went wrong' 
    }, { status: 500 })
  }
}
