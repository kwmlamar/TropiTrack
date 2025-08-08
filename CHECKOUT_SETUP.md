# TropiTrack Checkout System Setup

This guide explains how to set up and use the checkout system for TropiTrack subscriptions.

## What's Been Created

### 1. API Endpoint: `/api/create-checkout-session`
- Creates Stripe checkout sessions
- Handles subscription creation with 14-day free trial
- Returns checkout URL for redirection

### 2. Checkout Page: `/checkout`
- Next.js page that accepts plan parameter (`?plan=starter|professional|enterprise`)
- Displays plan details and pricing
- Handles form submission to create checkout session
- Redirects to Stripe Checkout

### 3. Updated Landing Page
- All pricing buttons now link to the checkout page
- Includes proper plan parameters in URLs

### 4. Simple HTML Example
- Available at `/simple-checkout.html`
- Shows how to implement checkout with plain HTML forms
- Similar to your original example

## Setup Instructions

### 1. Environment Variables
Make sure you have these environment variables set:

```bash
STRIPE_SECRET_KEY=sk_test_...          # Your Stripe secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key
SUPABASE_SERVICE_ROLE_KEY=...          # For user authentication
```

### 2. Create Stripe Products and Prices
Run the setup script to create your products and prices in Stripe:

```bash
cd scripts
STRIPE_SECRET_KEY=your_secret_key node setup-stripe-products.js
```

This will create:
- **Starter Plan**: $39/month
- **Professional Plan**: $89/month  
- **Enterprise Plan**: $179/month

### 3. Update Price IDs
After running the setup script, update the `PRICE_IDS` object in `/app/checkout/page.tsx` with the actual price IDs returned by the script.

### 4. Test the Flow
1. Go to your landing page (`/`)
2. Scroll to the pricing section
3. Click any "Start Free Trial" button
4. You'll be redirected to the checkout page
5. Click "Start Free Trial" on the checkout page
6. You'll be redirected to Stripe Checkout

## File Structure

```
/app
  /api
    /create-checkout-session
      route.ts                 # Stripe checkout session API
  /checkout
    page.tsx                   # Checkout page component
  page.tsx                     # Landing page (updated)

/scripts
  setup-stripe-products.js     # Script to create Stripe products

/public
  simple-checkout.html         # Simple HTML example
```

## How It Works

1. **User clicks pricing button** → Redirected to `/checkout?plan=starter`
2. **Checkout page loads** → Shows plan details and trial information
3. **User clicks "Start Free Trial"** → POST request to `/api/create-checkout-session`
4. **API creates checkout session** → Returns Stripe Checkout URL
5. **User redirected to Stripe** → Completes payment setup
6. **After success** → Redirected to `/dashboard/settings/subscription?success=true`

## Stripe Webhook Setup (Optional)

To handle subscription events (like successful payments), set up webhooks:

1. Go to your Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `invoice.paid`, `customer.subscription.created`, etc.

## Testing

### Test Cards
Use these test cards in Stripe Checkout:
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000000000003220`

### Test Flow
1. Use test mode Stripe keys
2. Complete checkout with test card
3. Check Stripe Dashboard for created subscription
4. Verify webhook events (if set up)

## Security Notes

- All sensitive operations happen server-side
- User authentication is required for checkout
- Stripe handles all payment processing securely
- Customer data is stored in Supabase

## Next Steps

1. **Set up webhooks** to handle subscription events
2. **Customize success/cancel pages** 
3. **Add subscription management** in dashboard
4. **Implement usage tracking** for different plans
5. **Add billing portal** for customers to manage subscriptions

## Support

For Stripe-specific issues, check:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Test Data](https://stripe.com/docs/testing)
