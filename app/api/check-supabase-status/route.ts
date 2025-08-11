import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test basic database operations
    const { error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    // Test auth service (without signup)
    const { error: authError } = await supabase.auth.getUser();

    // Test if we can access auth schema (read-only)
    const { error: authUsersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        connected: !dbError,
        error: dbError?.message
      },
      auth: {
        service_available: !authError || authError.message === 'Auth session missing!',
        error: authError?.message
      },
      auth_schema: {
        accessible: !authUsersError,
        error: authUsersError?.message
      },
      environment: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
      }
    });

  } catch (error) {
    console.error('Supabase status check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Status check failed',
      details: error 
    }, { status: 500 });
  }
}
