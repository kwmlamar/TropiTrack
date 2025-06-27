import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test storage access
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      buckets: buckets || []
    })
  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to test storage' 
    }, { status: 500 })
  }
} 