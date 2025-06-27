import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Log the request details for debugging
  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    error,
    error_description,
    origin,
    next
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', { error, error_description })
    return NextResponse.redirect(`${origin}/error?message=OAuth error: ${error_description || error}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Code exchange result:', {
        success: !exchangeError,
        hasUser: !!data?.user,
        error: exchangeError?.message
      })
      
      if (exchangeError) {
        console.error('Code exchange failed:', exchangeError)
        return NextResponse.redirect(`${origin}/error?message=Code exchange failed: ${exchangeError.message}`)
      }
      
      if (!data?.user) {
        console.error('No user data returned from code exchange')
        return NextResponse.redirect(`${origin}/error?message=No user data returned`)
      }

      // The database trigger (handle_new_user) will automatically create
      // the company and profile for new OAuth users
      // No need to manually create them here
      
      console.log('Authentication successful, redirecting to:', next)
      return NextResponse.redirect(`${origin}${next}`)
    } catch (err) {
      console.error('Unexpected error in auth callback:', err)
      return NextResponse.redirect(`${origin}/error?message=Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  // No code provided
  console.error('No authorization code provided')
  return NextResponse.redirect(`${origin}/error?message=No authorization code provided`)
} 