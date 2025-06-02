"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendInviteEmailParams {
  to: string
  inviteToken: string
  companyName: string
  inviterName: string
  role: string
}

export async function sendInviteEmail({
  to,
  inviteToken,
  companyName,
  inviterName,
  role,
}: SendInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://tropitrack.org"}/invite/accept?token=${inviteToken}`

    const { error } = await resend.emails.send({
      from: "noreply@tropitrack.org", // Must be a verified sender or domain
      to,
      subject: `You've been invited to join ${companyName}`,
      html: `
        <p>Hey there,</p>
        <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> as a <strong>${role}</strong>.</p>
        <p><a href="${inviteUrl}">Click here to accept the invitation</a></p>
        <p>This invitation will expire in 7 days.</p>
        <p>Welcome to TropiTrack – where construction meets clarity.</p>
      `,
    })

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error("Error sending invite email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

