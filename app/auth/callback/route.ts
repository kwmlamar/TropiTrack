import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/server-admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user profile exists
      const { error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        
        // Extract name from user metadata or email
        const fullName = data.user.user_metadata?.full_name || 
                        data.user.user_metadata?.name ||
                        data.user.email?.split('@')[0] || 
                        'User'
        
        // Create default company for new Google OAuth users
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert([
            {
              name: 'My Company',
              email: data.user.email,
            },
          ])
          .select()
          .single()

        if (companyError) {
          console.error('Failed to create company for Google OAuth user:', companyError)
          return NextResponse.redirect(`${origin}/error?message=Failed to create company`)
        }

        // Create user profile without company_id first (in case the field doesn't exist)
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              name: fullName,
              email: data.user.email,
            },
          ])

        if (createProfileError) {
          console.error('Failed to create profile for Google OAuth user:', createProfileError)
          return NextResponse.redirect(`${origin}/error?message=Failed to create profile`)
        }

        // Try to update the profile with company_id if the field exists
        try {
          await supabase
            .from('profiles')
            .update({ company_id: companyData.id })
            .eq('id', data.user.id)
        } catch (updateError) {
          console.log('company_id field might not exist in profiles table, continuing...', updateError)
        }

        // Update user metadata with company_id
        await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
          user_metadata: {
            full_name: fullName,
            company_id: companyData.id,
          },
        })

        // For new users, redirect to dashboard with a special parameter to force company setup
        return NextResponse.redirect(`${origin}/dashboard?setup=company`)
      }

      // Existing user, redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/error?message=Authentication failed`)
} 