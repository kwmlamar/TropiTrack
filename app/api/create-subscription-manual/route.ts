import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id, plan_slug } = await request.json();
    
    console.log('Manual subscription creation for:', { user_id, plan_slug });
    
    const supabase = await createClient();
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found',
        details: profileError 
      });
    }

    // Get plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_slug)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plan not found',
        details: planError 
      });
    }

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', profile.company_id)
      .in('status', ['active', 'trialing'])
      .single();

    if (existingSubscription) {
      return NextResponse.json({ 
        success: false, 
        error: 'Company already has an active subscription',
        existingSubscription 
      });
    }

    // Create subscription manually
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const { data: subscription, error: subscriptionError } = await supabase
      .from('company_subscriptions')
      .insert({
        company_id: profile.company_id,
        plan_id: plan.id,
        status: 'trialing',
        billing_cycle: 'monthly',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
        metadata: {
          created_by: user_id,
          trial_type: 'free_trial',
          plan_slug: plan_slug,
          created_via: 'manual_api'
        }
      })
      .select()
      .single();

    if (subscriptionError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create subscription',
        details: subscriptionError 
      });
    }

    return NextResponse.json({
      success: true,
      subscription,
      profile,
      plan
    });

  } catch (error) {
    console.error('Manual subscription creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}
