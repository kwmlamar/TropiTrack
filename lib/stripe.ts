import Stripe from 'stripe';

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
};

// Common Stripe functions
export async function createStripeCustomer(email: string, name: string, metadata?: Record<string, string>) {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export async function createStripeSubscription(customerId: string, priceId: string, metadata?: Record<string, string>) {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata,
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
}

export async function createStripePrice(productId: string, amount: number, currency: string = 'usd', interval: 'month' | 'year' = 'month') {
  return await stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency,
    recurring: { interval },
  });
}

export async function createStripeProduct(name: string, description?: string) {
  return await stripe.products.create({
    name,
    description,
  });
} 