# Environment Setup Guide

This guide will help you set up the required environment variables for TropiTrack.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Stripe Configuration
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Application Configuration
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## How to Get These Values

### Supabase
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. For the service role key, use the `service_role` key (keep this secret!)

### Stripe
1. Go to your Stripe Dashboard
2. Navigate to Developers > API keys
3. Copy the Secret key (starts with `sk_test_` for test mode)
4. Copy the Publishable key (starts with `pk_test_` for test mode)

## Testing the Configuration

After setting up your environment variables, you can test them by running:

```bash
pnpm run build
```

If you see any errors about missing environment variables, double-check that:
1. Your `.env.local` file is in the root directory
2. All required variables are set
3. The values are correct (no extra spaces or quotes)

## Security Notes

- Never commit your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore`
- Use test keys for development and production keys for production
- Keep your service role keys and secret keys secure
