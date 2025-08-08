import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

// Price IDs for each plan - update these with your actual Stripe price IDs
const PRICE_IDS = {
  starter: 'price_test_starter_monthly',
  professional: 'price_test_professional_monthly', 
  enterprise: 'price_test_enterprise_monthly',
};

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, userEmail } = await request.json();

    if (!userId || !planId) {
      return NextResponse.json(
        { error: 'User ID and Plan ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client for server-side operations
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get or create Stripe customer
    let customer;
    const { data: existingCustomers } = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId,
        },
      });
    }

    // Get the price ID for the selected plan
    const priceId = PRICE_IDS[planId as keyof typeof PRICE_IDS];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Create subscription with 14-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: 14,
      metadata: {
        user_id: userId,
        plan_name: planId,
        trial_started_at: new Date().toISOString(),
      },
    });

    // Store subscription info in your database
    const { error: dbError } = await supabase
      .from('company_subscriptions')
      .insert({
        company_id: userId, // Assuming user_id maps to company_id
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
        plan_id: planId,
        status: 'trialing',
        billing_cycle: 'monthly',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        trial_start: new Date(subscription.trial_start! * 1000).toISOString(),
        trial_end: new Date(subscription.trial_end! * 1000).toISOString(),
        metadata: {
          plan_name: planId,
          trial_started_at: new Date().toISOString(),
        },
      });

    if (dbError) {
      console.error('Error storing subscription in database:', dbError);
      // Don't fail the request, but log the error
    }

    return NextResponse.json({ 
      subscriptionId: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end,
      customerId: customer.id,
      planId: planId
    });
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
