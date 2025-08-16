import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, company_name } = await request.json();
    
    console.log('Testing signup WITHOUT plan:', { email, name, company_name });
    
    const supabase = await createClient();
    
    // Test the signup process WITHOUT plan data
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
        data: {
          full_name: name,
          company_name: company_name || "My Company",
          // NO plan data here
        },
      },
    });

    console.log('Auth result (no plan):', { authData, authError });

    if (authError) {
      console.error('Signup failed (no plan):', authError);
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
        message: 'Email confirmation required (no plan)',
        redirectTo: '/check-email'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Signup successful without plan data',
      user: authData.user
    });

  } catch (error) {
    console.error('Test signup error (no plan):', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}


