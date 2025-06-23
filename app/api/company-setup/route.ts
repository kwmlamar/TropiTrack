import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const companyName = formData.get("company_name") as string;

    // Validate required fields
    if (!companyName) {
      return NextResponse.json(
        { error: "Company name is required", field: "company_name" },
        { status: 400 }
      );
    }

    // Get the user's profile to find their company
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Update the company name
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        name: companyName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.company_id);

    if (updateError) {
      console.error("Error updating company:", updateError);
      return NextResponse.json(
        { error: "Failed to update company details" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Company setup completed successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Company setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 