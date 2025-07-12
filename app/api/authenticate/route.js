import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { password } = await request.json()
    
    // Hardcoded password check
    const correctPassword = 'windows95'
    
    if (password === correctPassword) {
      return NextResponse.json({ 
        success: true, 
        message: 'Authentication successful' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid password' 
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Authentication failed' 
    }, { status: 500 })
  }
} 