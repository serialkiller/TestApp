import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase client (only if environment variables are available)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Helper function to generate user ID from API key (simple hash)
const generateUserId = (apiKey) => {
  let hash = 0
  for (let i = 0; i < apiKey.length; i++) {
    const char = apiKey.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString()
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get('apiKey')

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    // Check if Supabase is available
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Storage service not configured' 
      }, { status: 503 })
    }

    const userId = generateUserId(apiKey)
    
    // Fetch conversations from Supabase
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch conversations' 
      }, { status: 500 })
    }

    // Parse conversations from JSON string
    const conversations = data.map(row => JSON.parse(row.conversation_data))
    
    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch conversations' 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { conversations, apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 })
    }

    if (!conversations || !Array.isArray(conversations)) {
      return NextResponse.json({ error: 'Conversations array is required' }, { status: 400 })
    }

    // Check if Supabase is available
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Storage service not configured' 
      }, { status: 503 })
    }

    const userId = generateUserId(apiKey)
    
    // Delete existing conversations for this user
    await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId)

    // Insert new conversations
    const conversationRows = conversations.map(conv => ({
      user_id: userId,
      conversation_id: conv.id,
      conversation_data: JSON.stringify(conv),
      updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
      .from('conversations')
      .insert(conversationRows)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Failed to save conversations' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving conversations:', error)
    return NextResponse.json({ 
      error: 'Failed to save conversations' 
    }, { status: 500 })
  }
} 