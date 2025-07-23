import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getCompanySubscription } from "@/lib/data/subscriptions"

export async function GET() {
  try {
    console.log("[TestSubscription] Starting subscription test")
    const supabase = await createClient()
    
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[TestSubscription] User not found:", userError)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("[TestSubscription] User authenticated:", user.id)

    // Test 1: Check all subscription plans
    console.log("[TestSubscription] Checking all subscription plans...")
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order')
    
    if (plansError) {
      console.error("[TestSubscription] Plans error:", plansError)
      return NextResponse.json({
        success: false,
        message: `Plans error: ${plansError.message}`,
        error: plansError
      }, { status: 500 })
    }

    console.log("[TestSubscription] Available plans:", plans)

    // Test 2: Check user's company subscription
    console.log("[TestSubscription] Checking user's subscription...")
    const subscription = await getCompanySubscription()
    
    console.log("[TestSubscription] Subscription result:", subscription)

    // Test 3: Check user's profile and company
    console.log("[TestSubscription] Checking user profile...")
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, company:companies(*)')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error("[TestSubscription] Profile error:", profileError)
    } else {
      console.log("[TestSubscription] User profile:", profile)
    }

    // Test 4: Check company subscriptions directly
    if (profile?.company_id) {
      console.log("[TestSubscription] Checking company subscriptions...")
      const { data: companySubs, error: companySubsError } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })
      
      if (companySubsError) {
        console.error("[TestSubscription] Company subscriptions error:", companySubsError)
      } else {
        console.log("[TestSubscription] Company subscriptions:", companySubs)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription test completed",
      data: {
        plans,
        subscription,
        profile,
        user: {
          id: user.id,
          email: user.email
        }
      }
    })

  } catch (error) {
    console.error("[TestSubscription] Unexpected error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 