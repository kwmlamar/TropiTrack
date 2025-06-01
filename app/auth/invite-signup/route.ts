// app/api/auth/invite-signup/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/server-admin";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, first_name, last_name, inviteId } = body;

  if (!email || !password || !first_name || !last_name || !inviteId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Use admin API via service_role
  const adminClient = supabaseAdmin.auth.admin;

  // Step 1: Create user without email confirmation
  const { data: userData, error: createError } = await adminClient.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  const userId = userData.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "User creation failed" }, { status: 500 });
  }

  // Get invite
const { data: inviteData, error: inviteFetchError } = await supabaseAdmin
  .from("invites")
  .select("company_id")
  .eq("id", inviteId)
  .single();

if (inviteFetchError || !inviteData) {
  return NextResponse.json({ error: "Invalid invite" }, { status: 400 });
}

// Upsert profile
const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
  id: userId,
  first_name,
  last_name,
  name: `${first_name} ${last_name}`,
  email,
  company_id: inviteData.company_id,
});

if (profileError) {
  return NextResponse.json({ error: profileError.message }, { status: 500 });
}

// Update user metadata
await adminClient.updateUserById(userId, {
  user_metadata: {
    full_name: `${first_name} ${last_name}`,
    company_id: inviteData.company_id,
  },
});

// Mark invite as accepted
await supabaseAdmin.from("invites").update({
  accepted: true,
  accepted_at: new Date().toISOString(),
}).eq("id", inviteId);

return NextResponse.json({ success: true });
}
