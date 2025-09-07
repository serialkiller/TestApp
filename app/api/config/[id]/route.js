import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only create Supabase client if both URL and key are available
let supabase = null
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey)
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 })
    }

    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase not configured. Cannot delete configurations.' 
      }, { status: 503 })
    }

    const { error } = await supabase
      .from('api_configs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Config deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 