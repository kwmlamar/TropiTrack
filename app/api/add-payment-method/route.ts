import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, planName } = await request.json();

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
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

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the user's existing subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 400 }
      );
    }

    // Get existing subscription
    const { data: existingSubscription } = await supabase
      .from('company_subscriptions')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('company_id', profile.company_id)
      .single();

    if (!existingSubscription?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }

    // Get the price ID for the selected plan
    const priceIds = {
      starter: 'price_1S0T1NRf0QFiqVxccdLOQ4x5',
      professional: 'price_1S0T1NRf0QFiqVxc7E4QHcGw',
      enterprise: 'price_1S0T1ORf0QFiqVxcMTJlWYHf',
    };

    const priceId = priceIds[planId as keyof typeof priceIds];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Create a checkout session for adding payment method
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/dashboard/settings/subscription?success=true`,
      cancel_url: `${request.nextUrl.origin}/dashboard?canceled=true`,
      customer: existingSubscription.stripe_customer_id,
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_name: planName || '',
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}













