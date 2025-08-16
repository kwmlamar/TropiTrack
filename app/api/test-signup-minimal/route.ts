import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Testing signup with MINIMAL metadata:', { email });
    
    const supabase = await createClient();
    
    // Test the signup process with minimal metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
        // NO metadata at all
      },
    });

    console.log('Auth result (minimal):', { authData, authError });

    if (authError) {
      console.error('Signup failed (minimal):', authError);
      return NextResponse.json({ 
        success: false, 
        error: authError.message,
        details: authError 
      });
    }

    if (!authData.user) {
      console.log('No user returned - email confirmation required');
      return NextResponse.json({ 
        success: true, 
        message: 'Email confirmation required (minimal)',
        redirectTo: '/check-email'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Signup successful with minimal metadata',
      user: authData.user
    });

  } catch (error) {
    console.error('Test signup error (minimal):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}


