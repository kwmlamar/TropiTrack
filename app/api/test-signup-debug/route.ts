import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, company_name, plan } = await request.json();
    
    console.log('Testing signup with:', { email, name, company_name, plan });
    
    const supabase = await createClient();
    
    // Test the signup process
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
        data: {
          full_name: name,
          company_name: company_name || "My Company",
          selected_plan: plan,
        },
      },
    });

    console.log('Auth result:', { authData, authError });

    if (authError) {
      console.error('Signup failed:', authError);
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
        message: 'Email confirmation required',
        redirectTo: '/check-email'
      });
    }

    // Check if profile was created
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    console.log('Profile check:', { profile, profileError });

    // Check if company was created
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('email', email)
      .single();

    console.log('Company check:', { company, companyError });

    return NextResponse.json({
      success: true,
      user: authData.user,
      profile,
      company,
      profileError: profileError?.message,
      companyError: companyError?.message
    });

  } catch (error) {
    console.error('Test signup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}
