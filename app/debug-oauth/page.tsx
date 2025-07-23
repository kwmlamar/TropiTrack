'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithGoogle, signUpWithGoogle } from '@/app/actions/auth'

export default function DebugOAuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const testGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Testing Google Sign In...')
      const result = await signInWithGoogle()
      
      if ('error' in result) {
        setError(`Sign In Error: ${result.error}`)
        console.error('Sign In Error:', result.error)
      } else {
        setSuccess('Google Sign In URL generated successfully!')
        console.log('Sign In URL:', result.url)
        // Don't redirect automatically for debugging
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const testGoogleSignUp = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log('Testing Google Sign Up...')
      const result = await signUpWithGoogle()
      
      if ('error' in result) {
        setError(`Sign Up Error: ${result.error}`)
        console.error('Sign Up Error:', result.error)
      } else {
        setSuccess('Google Sign Up URL generated successfully!')
        console.log('Sign Up URL:', result.url)
        // Don't redirect automatically for debugging
      }
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OAuth Debug Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Environment Variables:
            </p>
            <div className="text-xs bg-muted p-2 rounded">
              <div>NEXT_PUBLIC_SITE_URL: {process.env.NEXT_PUBLIC_SITE_URL}</div>
              <div>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={testGoogleSignIn} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Google Sign In'}
            </Button>
            
            <Button 
              onClick={testGoogleSignUp} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Google Sign Up'}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-600">
              {success}
            </div>
          )}

          <div className="text-xs text-gray-500">
            Check the browser console for detailed logs.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 