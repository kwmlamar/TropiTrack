import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { generateQRCode } from "@/lib/data/qr-clock"
import type { NewQRCode } from "@/lib/types/qr-clock"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { project_location_id, name, description } = body

    // Validate required fields
    if (!name || !project_location_id) {
      return NextResponse.json(
        { success: false, message: "Name and project location are required" },
        { status: 400 }
      )
    }

    const qrCodeData: NewQRCode = {
      project_location_id,
      name,
      description: description || null
    }

    // Generate the QR code
    const result = await generateQRCode(user.id, qrCodeData)

    if (result.success && result.data) {
      // Generate QR code URL for the frontend
      const qrCodeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/qr-scan/${result.data.code_hash}`
      
      return NextResponse.json({
        ...result,
        qr_code_url: qrCodeUrl
      }, { status: 200 })
    } else {
      console.error("QR code generation failed:", result.error)
      return NextResponse.json({
        success: false, 
        message: result.error || "Failed to create QR code",
        details: result.error
      }, { status: 400 })
    }
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
} 