import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check required environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'Not set',
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    };

    // Check if all required vars are present
    const missingVars = Object.entries(envCheck)
      .filter(([key, value]) => !value && key !== 'NEXT_PUBLIC_SITE_URL')
      .map(([key]) => key);

    return NextResponse.json({
      success: missingVars.length === 0,
      environment: envCheck,
      missing: missingVars,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    );
  }
}
