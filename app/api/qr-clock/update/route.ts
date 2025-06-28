import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { updateQRCode } from "@/lib/data/qr-clock"

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { qrCodeId, updates } = body

    if (!qrCodeId) {
      return NextResponse.json(
        { success: false, message: "QR code ID is required" },
        { status: 400 }
      )
    }

    const result = await updateQRCode(user.id, qrCodeId, updates)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "QR code updated successfully",
        data: result.data
      })
    } else {
      return NextResponse.json(
        { success: false, message: result.error },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error updating QR code:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
} 