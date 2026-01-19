import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create Supabase client if both URL and key are available
let supabase = null
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request) {
  try {
    const { messages, model = 'gpt-3.5-turbo' } = await request.json()

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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    })

    // Create a prompt for title generation
    const titlePrompt = `Generate a short, descriptive title (maximum 6 words) for this conversation based on the first few messages. The title should capture the main topic or purpose of the conversation. Return only the title, nothing else.

First user message: "${messages[0].content}"

${messages.length > 1 ? `AI response: "${messages[1].content.substring(0, 200)}..."` : ''}

Title:`

    // Build completion parameters for title generation
    const completionParams = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates concise, descriptive titles for conversations. Keep titles under 6 words and make them relevant to the conversation topic.'
        },
        {
          role: 'user',
          content: titlePrompt
        }
      ],
    }

    // Use appropriate parameters based on model
    if (model.startsWith('gpt-5')) {
      completionParams.max_completion_tokens = 20
      // GPT-5 only supports default temperature (1), so we omit it
    } else {
      completionParams.temperature = 0.3
      completionParams.max_tokens = 20
    }

    const completion = await openai.chat.completions.create(completionParams)

    const title = completion.choices[0]?.message?.content?.trim()

    if (!title) {
      return NextResponse.json({ error: 'No title generated' }, { status: 500 })
    }

    return NextResponse.json({ title })

  } catch (error) {
    console.error('Title generation error:', error)
    
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
