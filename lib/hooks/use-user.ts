import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserProfileWithCompany } from '@/lib/types/userProfile'

// Client-side version of getUserProfileWithCompany
async function getUserProfileWithCompany(): Promise<UserProfileWithCompany | null> {
  const supabase = createClient()
  
  try {
    // Get the authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser) {
      console.error('Error getting auth user:', authError)
      return null
    }

    // Get the user profile from the profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, companies(id, name)')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.error('Error getting user profile:', error)
      return null
    }

    return {
      ...profile,
      company: profile.companies
    }
  } catch (error) {
    console.error('Error in getUserProfileWithCompany:', error)
    return null
  }
}

export function useUser() {
  const [user, setUser] = useState<UserProfileWithCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    
    // Get initial user profile
    const getUserProfile = async () => {
      try {
        setLoading(true)
        console.log('Getting user profile...')
        
        const profile = await getUserProfileWithCompany()
        setUser(profile)
      } catch (error) {
        console.error('Error in getUserProfile:', error)
        setUser(null)
      } finally {
        console.log('Setting loading to false and initialized to true')
        setLoading(false)
        setInitialized(true)
      }
    }

    getUserProfile()
  }, [])

  return { 
    user, 
    loading: loading || !initialized,
    initialized 
  }
} 