import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing Supabase configuration',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Check if we can connect to Supabase
    const { data: healthData, error: healthError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)

    if (healthError) {
      return NextResponse.json({
        error: 'Failed to connect to Supabase',
        details: healthError.message,
        code: healthError.code
      }, { status: 500 })
    }

    // Test 2: Try to insert a test record
    const testUserId = 'test-user-' + Date.now()
    const testConversation = {
      id: 'test-conv-' + Date.now(),
      title: 'Test Conversation',
      messages: [{ role: 'user', content: 'Hello' }],
      timestamp: Date.now()
    }

    const { data: insertData, error: insertError } = await supabase
      .from('conversations')
      .insert({
        user_id: testUserId,
        conversation_id: testConversation.id,
        conversation_data: testConversation,
        updated_at: new Date().toISOString()
      })
      .select()

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to insert test record',
        details: insertError.message,
        code: insertError.code
      }, { status: 500 })
    }

    // Test 3: Try to read the test record
    const { data: readData, error: readError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', testUserId)

    if (readError) {
      return NextResponse.json({
        error: 'Failed to read test record',
        details: readError.message,
        code: readError.code
      }, { status: 500 })
    }

    // Test 4: Clean up test record
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', testUserId)

    if (deleteError) {
      console.warn('Failed to clean up test record:', deleteError)
    }

    return NextResponse.json({
      success: true,
      message: 'All Supabase tests passed',
      tests: {
        connection: 'PASS',
        insert: 'PASS',
        read: 'PASS',
        cleanup: deleteError ? 'WARN' : 'PASS'
      },
      details: {
        insertedRecord: insertData,
        readRecords: readData.length,
        cleanupError: deleteError?.message
      }
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error during testing',
      details: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 