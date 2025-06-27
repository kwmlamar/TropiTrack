import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check if storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return NextResponse.json({ 
        exists: false, 
        error: bucketsError.message 
      }, { status: 500 })
    }

    const projectFilesBucket = buckets?.find((bucket: { name: string; id: string }) => bucket.name === 'project-files')
    
    return NextResponse.json({ 
      exists: !!projectFilesBucket,
      bucket: projectFilesBucket || null
    })
  } catch (error) {
    console.error('Storage check error:', error)
    return NextResponse.json({ 
      exists: false, 
      error: 'Failed to check storage' 
    }, { status: 500 })
  }
} 