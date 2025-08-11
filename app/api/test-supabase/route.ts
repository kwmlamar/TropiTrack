import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test basic connection
    const { error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    // Test auth service
    const { data: authData, error: authError } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      database: {
        connected: !testError,
        error: testError?.message
      },
      auth: {
        connected: !authError,
        error: authError?.message,
        user: authData?.user ? 'Authenticated' : 'Not authenticated'
      }
    });

  } catch (error) {
    console.error('Supabase test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Connection test failed',
      details: error 
    }, { status: 500 });
  }
}
