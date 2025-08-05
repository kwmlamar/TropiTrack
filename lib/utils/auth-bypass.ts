

// Client-side authentication bypass utility
export async function getAuthenticatedUserClient() {
  // Always return demo user without making any network requests
  return {
    user: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo@tropitrack.com'
    },
    profile: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Demo User',
      email: 'demo@tropitrack.com',
      company_id: '00000000-0000-0000-0000-000000000002',
      role: 'admin'
    }
  }
}

// Utility function to get company ID with fallback (client-side)
export async function getCompanyIdClient() {
  return '00000000-0000-0000-0000-000000000002'
}

// Default export for backward compatibility
export const getAuthenticatedUser = getAuthenticatedUserClient
export const getCompanyId = getCompanyIdClient 