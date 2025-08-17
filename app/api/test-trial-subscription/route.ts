import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    console.log("Testing trial subscription for user:", user.id);

    // Test the database function directly
    const { data, error } = await supabase
      .rpc('create_trial_subscription', {
        user_id: user.id,
        plan_slug: 'starter',
        trial_days: 14
      });

    if (error) {
      console.error("Database function error:", error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    console.log("Database function result:", data);

    return NextResponse.json({ 
      success: true, 
      result: data 
    });

  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error" 
    }, { status: 500 });
  }
}
