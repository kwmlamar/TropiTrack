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
    const { newPlanId } = await request.json();

    if (!newPlanId) {
      return NextResponse.json(
        { error: 'New plan ID is required' },
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

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('company_subscriptions')
      .select('*')
      .eq('company_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get the new price ID
    const newPriceId = PRICE_IDS[newPlanId as keyof typeof PRICE_IDS];
    if (!newPriceId) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Update the subscription in Stripe
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      {
        items: [
          {
            id: subscription.stripe_subscription_item_id, // You'll need to store this
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
        metadata: {
          ...subscription.metadata,
          plan_name: newPlanId,
          updated_at: new Date().toISOString(),
        },
      }
    );

    // Update the subscription in your database
    const { error: updateError } = await supabase
      .from('company_subscriptions')
      .update({
        plan_id: newPlanId,
        metadata: {
          ...subscription.metadata,
          plan_name: newPlanId,
          updated_at: new Date().toISOString(),
        },
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Error updating subscription in database:', updateError);
      // Don't fail the request, but log the error
    }

    return NextResponse.json({ 
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
      newPlanId: newPlanId
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
