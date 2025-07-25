import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('api_configs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch configurations' }, { status: 500 })
    }

    return NextResponse.json({ configurations: data || [] })
  } catch (error) {
    console.error('Config fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, api_key, provider, is_active } = await request.json()

    if (!name || !api_key || !provider) {
      return NextResponse.json({ error: 'Name, API key, and provider are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('api_configs')
      .insert([
        {
          name,
          api_key,
          provider,
          is_active: is_active ?? true
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create configuration' }, { status: 500 })
    }

    return NextResponse.json({ configuration: data[0] })
  } catch (error) {
    console.error('Config creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 