

// Server-side authentication bypass utility
export async function getAuthenticatedUserServer() {
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

// Utility function to get company ID with fallback (server-side)
export async function getCompanyIdServer() {
  return '00000000-0000-0000-0000-000000000002'
} 