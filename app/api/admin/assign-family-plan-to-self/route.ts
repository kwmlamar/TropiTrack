import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get the family plan
    const { data: familyPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', 'family')
      .single();

    if (planError || !familyPlan) {
      return NextResponse.json({ error: "Family plan not found" }, { status: 404 });
    }

    // Check if company already has a subscription
    const { data: existingSubscription } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', profile.company_id)
      .single();

    if (existingSubscription) {
      // Update existing subscription to family plan
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('company_subscriptions')
        .update({
          plan_id: familyPlan.id,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
          trial_end: null,
          cancel_at_period_end: false,
          canceled_at: null,
          ended_at: null,
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Subscription updated to family plan successfully",
        subscription: updatedSubscription 
      });
    } else {
      // Create a new family subscription
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
        console.error("Error creating family subscription:", subError);
        return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Family plan assigned successfully",
        subscription 
      });
    }

  } catch (error) {
    console.error("Error assigning family plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 