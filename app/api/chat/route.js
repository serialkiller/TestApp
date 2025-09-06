import OpenAI from 'openai'
import { NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'
import { prepareForChunkedSend } from '../../utils/serverTokenizer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request) {
  try {
    const { messages, model = 'gpt-5' } = await request.json()

    // Get API key from Supabase configuration
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

    if (!configs || configs.length === 0) {
      return NextResponse.json({ error: 'No active API configuration found' }, { status: 500 })
    }

    const apiKey = configs[0].api_key

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Use tokenizer helper to prepare chunks if last message is large
    const { contextMessages, userChunks } = prepareForChunkedSend(messages, model)

    let aggregatedAssistant = ''

    // Send each chunk sequentially, including the preserved context messages before the first chunk
    for (let i = 0; i < userChunks.length; i++) {
      const chunk = userChunks[i]

      const msgs = []
      // include context only for the first chunk so the model sees prior conversation
      if (i === 0 && contextMessages && contextMessages.length > 0) {
        msgs.push(...contextMessages)
      }
      // append the current user chunk
      msgs.push({ role: 'user', content: chunk })

      const completionParams = {
        model: model,
        messages: msgs,
      }

      // Add model-specific parameters
      if (model.startsWith('gpt-5')) {
        completionParams.max_completion_tokens = 4000
      } else {
        completionParams.max_tokens = 1000
        completionParams.temperature = 0.7
      }

      const completion = await openai.chat.completions.create(completionParams)
      const assistantPart = completion.choices[0]?.message?.content

      if (!assistantPart) {
        // If any chunk fails to produce a reply, respond with an error
        return NextResponse.json({ error: 'No response from OpenAI for a chunk' }, { status: 500 })
      }

      // Aggregate assistant replies. For improved behavior we could stream or summarize.
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