import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = {
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseKey: supabaseKey ? 'Set' : 'Not set',
      canConnect: false,
      error: null
    }

    if (!supabaseUrl || !supabaseKey) {
      response.error = 'Missing environment variables'
      return NextResponse.json(response)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test the connection by trying to query the conversations table
    const { data, error } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)

    if (error) {
      response.error = error.message
      return NextResponse.json(response)
    }

    response.canConnect = true
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
      canConnect: false,
      error: error.message
    })
  }
} 