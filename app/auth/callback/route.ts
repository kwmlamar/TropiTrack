import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Log the request details for debugging
  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    state: state ? 'present' : 'missing',
    error,
    error_description,
    origin,
    next,
    url: request.url
  })

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', { error, error_description })
    return NextResponse.redirect(`${origin}/error?message=OAuth error: ${error_description || error}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Code exchange result:', {
        success: !exchangeError,
        hasUser: !!data?.user,
        error: exchangeError?.message,
        errorCode: exchangeError?.status
      })
      
      if (exchangeError) {
        console.error('Code exchange failed:', exchangeError)
        
        // Handle specific error cases
        if (exchangeError.message?.includes('invalid flow state')) {
          console.error('Invalid flow state - this usually means the OAuth flow was interrupted or expired')
          return NextResponse.redirect(`${origin}/error?message=OAuth session expired. Please try signing in again.`)
        }
        
        return NextResponse.redirect(`${origin}/error?message=Code exchange failed: ${exchangeError.message}`)
      }
      
      if (!data?.user) {
        console.error('No user data returned from code exchange')
        return NextResponse.redirect(`${origin}/error?message=No user data returned`)
      }

      console.log('User authenticated successfully:', {
        userId: data.user.id,
        email: data.user.email,
        isNewUser: data.user.created_at === data.user.updated_at
      })

      // Check if user profile exists, if not create it manually
      const { error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it manually
        console.log('Profile not found, creating manually for user:', data.user.id)
        
        try {
          // Extract user info
          const userEmail = data.user.email || ''
          const userName = data.user.user_metadata?.full_name || 
                          data.user.user_metadata?.name || 
                          userEmail.split('@')[0] || 
                          'User'
          const companyName = data.user.user_metadata?.company_name || 'My Company'

          // Create company first
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: companyName,
              email: userEmail
            })
            .select()
            .single()

          if (companyError) {
            console.error('Error creating company:', companyError)
            return NextResponse.redirect(`${origin}/error?message=Failed to create company: ${companyError.message}`)
          }

          // Create profile
          const { error: profileCreateError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              role: 'admin',
              name: userName,
              email: userEmail,
              company_id: company.id
            })

          if (profileCreateError) {
            console.error('Error creating profile:', profileCreateError)
            return NextResponse.redirect(`${origin}/error?message=Failed to create profile: ${profileCreateError.message}`)
          }

          console.log('Successfully created profile and company manually')
        } catch (manualCreateError) {
          console.error('Error in manual profile creation:', manualCreateError)
          return NextResponse.redirect(`${origin}/error?message=Failed to create user profile: ${manualCreateError instanceof Error ? manualCreateError.message : 'Unknown error'}`)
        }
      } else if (profileError) {
        console.error('Error checking profile:', profileError)
        return NextResponse.redirect(`${origin}/error?message=Error checking user profile: ${profileError.message}`)
      } else {
        console.log('Profile already exists for user:', data.user.id)
      }

      // Update last_login_at timestamp
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('user_id', data.user.id)

        if (updateError) {
          console.error('Error updating last_login_at:', updateError)
          // Don't fail the login for this error
        } else {
          console.log('Updated last_login_at for user:', data.user.id)
        }
      } catch (err) {
        console.error('Unexpected error updating last_login_at:', err)
        // Don't fail the login for this error
      }

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