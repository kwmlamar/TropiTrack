import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    console.log("Checking subscription plans...");

    // Check if subscription_plans table exists and has data
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');
    
    if (plansError) {
      console.error("Error fetching plans:", plansError);
      return NextResponse.json({ 
        success: false, 
        error: plansError.message,
        tableExists: false
      }, { status: 500 });
    }

    console.log("Available plans:", plans);

    // Check if company_subscriptions table exists
    const { data: subscriptions, error: subError } = await supabase
      .from('company_subscriptions')
      .select('*')
      .limit(5);
    
    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return NextResponse.json({ 
        success: false, 
        error: subError.message,
        plans: plans,
        subscriptionsTableExists: false
      }, { status: 500 });
    }

    console.log("Recent subscriptions:", subscriptions);

    return NextResponse.json({ 
      success: true, 
      plans: plans,
      plansCount: plans?.length || 0,
      subscriptions: subscriptions,
      subscriptionsCount: subscriptions?.length || 0,
      tableExists: true,
      subscriptionsTableExists: true
    });

  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
