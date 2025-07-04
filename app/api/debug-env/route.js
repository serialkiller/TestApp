import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  return NextResponse.json({
    supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
    supabaseKey: supabaseKey ? 'Set' : 'Not set',
    supabaseKeyLength: supabaseKey ? supabaseKey.length : 0,
    supabaseKeyPrefix: supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'N/A',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  })
} 