import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, company_name, plan } = await request.json();
    
    console.log('Testing simple signup with:', { email, name, company_name, plan });
    
    const supabase = await createClient();
    
    // Test the signup process without relying on the trigger
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

    // Try to manually create the company and profile to see if that works
    try {
      // Create company manually
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: company_name || "My Company",
          email: email
        })
        .select()
        .single();

      console.log('Manual company creation:', { company, companyError });

      if (companyError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create company manually',
          details: companyError
        });
      }

      // Create profile manually
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role: 'admin',
          name: name,
          email: email,
          company_id: company.id
        })
        .select()
        .single();

      console.log('Manual profile creation:', { profile, profileError });

      if (profileError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile manually',
          details: profileError
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Manual creation successful',
        user: authData.user,
        profile,
        company
      });

    } catch (error) {
      console.error('Manual creation error:', error);
      return NextResponse.json({
        success: false,
        error: 'Manual creation failed',
        details: error
      });
    }

  } catch (error) {
    console.error('Test signup error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}
