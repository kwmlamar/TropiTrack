import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, company_name, plan } = await request.json();
    
    console.log('Testing signup with subscription creation:', { email, name, company_name, plan });
    
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
          selected_plan: plan || 'starter',
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

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

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
      .eq('id', profile?.company_id)
      .single();

    console.log('Company check:', { company, companyError });

    // Check if subscription was created
    const { data: subscription, error: subscriptionError } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', profile?.company_id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Subscription check:', { subscription, subscriptionError });

    // Test the function directly
    const { data: functionResult, error: functionError } = await supabase
      .rpc('create_trial_subscription', {
        user_id: authData.user.id,
        plan_slug: plan || 'starter',
        trial_days: 14
      });

    console.log('Function test result:', { functionResult, functionError });

    return NextResponse.json({
      success: true,
      user: authData.user,
      profile,
      company,
      subscription,
      functionTest: {
        result: functionResult,
        error: functionError?.message
      },
      profileError: profileError?.message,
      companyError: companyError?.message,
      subscriptionError: subscriptionError?.message
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
