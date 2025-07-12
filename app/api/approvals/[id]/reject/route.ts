import { NextRequest, NextResponse } from "next/server";
import { rejectTimesheet } from "@/lib/data/approvals";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await rejectTimesheet(params.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timesheet rejected successfully",
    });
  } catch (error) {
    console.error("Error in reject timesheet API:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 