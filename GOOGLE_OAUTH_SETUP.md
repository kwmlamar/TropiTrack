# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your TropiTrack application.

## Prerequisites

1. A Supabase project
2. A Google Cloud Console project
3. Your application running locally or deployed

## Step 1: Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - For local development: `http://localhost:3000/auth/callback`
     - For production: `https://your-domain.com/auth/callback`
     - For Supabase: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Note down your Client ID and Client Secret

## Step 2: Supabase Configuration

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list and click "Edit"
4. Enable the Google provider
5. Enter your Google OAuth credentials:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
6. Save the configuration

## Step 3: Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 4: Testing

1. Start your development server: `npm run dev`
2. Go to your login or signup page
3. Click the "Continue with Google" button
4. You should be redirected to Google's OAuth consent screen
5. After authentication, you'll be redirected back to your application

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**:
   - Make sure the redirect URI in Google Cloud Console matches exactly
   - Check that your `NEXT_PUBLIC_SITE_URL` is correct

2. **"Client ID not found" error**:
   - Verify your Google OAuth Client ID is correct in Supabase
   - Make sure the Google provider is enabled in Supabase

3. **"Authentication failed" error**:
   - Check the browser console for detailed error messages
   - Verify your Supabase configuration is correct

### Debug Steps

1. Check the browser's Network tab for failed requests
2. Look at the Supabase logs in your project dashboard
3. Verify all environment variables are set correctly
4. Test with a different browser or incognito mode

## Security Considerations

1. Never commit your `.env.local` file to version control
2. Use environment variables for all sensitive configuration
3. Regularly rotate your OAuth client secrets
4. Monitor your OAuth usage in Google Cloud Console

## Production Deployment

When deploying to production:

1. Update the authorized redirect URIs in Google Cloud Console
2. Set the correct `NEXT_PUBLIC_SITE_URL` environment variable
3. Update the redirect URI in Supabase to match your production domain
4. Test the OAuth flow in production environment

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables) 