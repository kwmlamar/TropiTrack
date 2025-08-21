import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's profile to find their company
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Mark company setup as completed (skipped)
    const updateData: {
      updated_at: string;
      setup_completed?: boolean;
      name?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    // Try to use setup_completed field if it exists
    try {
      // Check if setup_completed column exists
      const { data: columnCheck } = await supabase
        .from("companies")
        .select("setup_completed")
        .limit(1);
      
      if (columnCheck !== null) {
        updateData.setup_completed = true;
      } else {
        // Fallback: change company name to indicate setup has been addressed
        updateData.name = "Company Setup Skipped";
      }
    } catch {
      // Column doesn't exist, use fallback approach
      console.log("setup_completed column not available, using fallback");
      updateData.name = "Company Setup Skipped";
    }

    const { error: updateError } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", profile.company_id);

    if (updateError) {
      console.error("Error updating company setup status:", updateError);
      return NextResponse.json(
        { error: "Failed to update company setup status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Company setup skipped successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Company setup skip error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
