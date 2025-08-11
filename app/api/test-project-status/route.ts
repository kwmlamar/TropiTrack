import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test basic operations that should work
    const tests = {
      // Test 1: Basic database read
      database_read: await supabase
        .from('profiles')
        .select('count')
        .limit(1),
      
      // Test 2: Auth service status
      auth_status: await supabase.auth.getUser(),
      
      // Test 3: Check if we can access project settings
      project_info: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        project_id: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0],
        region: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ? 'Cloud' : 'Self-hosted'
      }
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        database_read: {
          success: !tests.database_read.error,
          error: tests.database_read.error?.message
        },
        auth_status: {
          success: !tests.auth_status.error || tests.auth_status.error.message === 'Auth session missing!',
          error: tests.auth_status.error?.message
        },
        project_info: tests.project_info
      },
      summary: {
        database_accessible: !tests.database_read.error,
        auth_service_available: !tests.auth_status.error || tests.auth_status.error.message === 'Auth session missing!',
        project_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    });

  } catch (error) {
    console.error('Project status test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Project status test failed',
      details: error 
    }, { status: 500 });
  }
}
