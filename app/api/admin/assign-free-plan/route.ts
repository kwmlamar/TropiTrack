import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin (you can customize this logic)
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();

    // For now, let's allow any authenticated user to assign free plans
    // You can add admin role checks here if needed
    // if (profile?.role !== 'admin') {
    //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    // }

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Get the family plan
    const { data: familyPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'family')
      .single();

    if (planError || !familyPlan) {
      return NextResponse.json({ error: "Family plan not found" }, { status: 404 });
    }

    // Get user's profile to get company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "User profile or company not found" }, { status: 400 });
    }

    // Check if company already has a subscription
    const { data: existingSubscription } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', profile.company_id)
      .single();

    if (existingSubscription) {
      return NextResponse.json({ error: "Company already has a subscription" }, { status: 400 });
    }

    // Create a free subscription
    const { data: subscription, error: subError } = await supabase
      .from('company_subscriptions')
      .insert({
        company_id: profile.company_id,
        plan_id: familyPlan.id,
        status: 'active',
        billing_cycle: 'monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        trial_end: null,
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
      })
      .select()
      .single();

    if (subError) {
      console.error("Error creating free subscription:", subError);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Free plan assigned successfully",
      subscription 
    });

  } catch (error) {
    console.error("Error assigning free plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 