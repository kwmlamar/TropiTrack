import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, plan_slug } = await request.json();
    
    console.log('Testing subscription creation for:', { user_id, plan_slug });
    
    const supabase = await createClient();
    
    // Test the subscription creation function directly
    const { data, error } = await supabase
      .rpc('create_trial_subscription', {
        user_id: user_id,
        plan_slug: plan_slug,
        trial_days: 14
      });

    console.log('Function result:', { data, error });

    if (error) {
      console.error('Function call failed:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      });
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    console.log('Profile check:', { profile, profileError });

    // Check if company exists
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

    return NextResponse.json({
      success: true,
      functionResult: data,
      profile,
      company,
      subscription,
      profileError: profileError?.message,
      companyError: companyError?.message,
      subscriptionError: subscriptionError?.message
    });

  } catch (error) {
    console.error('Test subscription creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}
