import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { getSubscriptionPlans, getCompanySubscription } from '@/lib/data/subscriptions';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get available plans
    const plansResult = await getSubscriptionPlans();
    if (!plansResult.success) {
      return NextResponse.json({ error: plansResult.error }, { status: 500 });
    }

    // Get current subscription
    const subscriptionResult = await getCompanySubscription();
    const currentSubscription = subscriptionResult.success ? subscriptionResult.data : null;

    return NextResponse.json({
      plans: plansResult.data,
      currentSubscription,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, billing_cycle, payment_method_id } = await request.json();

    if (!plan_id || !billing_cycle || !payment_method_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user profile with company
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    // Get the plan
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', plan_id)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Create or get Stripe customer
    let customer;
    const { data: existingCustomer } = await supabase
      .from('company_subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', profile.company_id)
      .not('stripe_customer_id', 'is', null)
      .single();

    if (existingCustomer?.stripe_customer_id) {
      customer = await stripe.customers.retrieve(existingCustomer.stripe_customer_id);
    } else {
      customer = await stripe.customers.create({
        email: user.email!,
        name: profile.companies?.name || 'Company',
        metadata: {
          company_id: profile.company_id,
        },
      });
    }

    // Create Stripe price if it doesn't exist
    const priceKey = `${plan.slug}_${billing_cycle}`;
    let price;
    
    try {
      price = await stripe.prices.retrieve(priceKey);
    } catch {
      // Create new price
      const amount = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
      price = await stripe.prices.create({
        product_data: {
          name: plan.name,
          description: plan.description,
        },
        unit_amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: billing_cycle === 'yearly' ? 'year' : 'month',
        },
        metadata: {
          plan_slug: plan.slug,
          billing_cycle,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        company_id: profile.company_id,
        plan_slug: plan.slug,
      },
    });

    // Create subscription record in database
    const { error: dbError } = await supabase
      .from('company_subscriptions')
      .insert({
        company_id: profile.company_id,
        plan_id: plan.id,
        status: subscription.status,
        billing_cycle,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customer.id,
      });

    if (dbError) {
      console.error('Error creating subscription record:', dbError);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({
      subscription_id: subscription.id,
      client_secret: (subscription.latest_invoice as Stripe.Invoice)?.payment_intent?.client_secret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan_id, billing_cycle } = await request.json();

    // Get current subscription
    const subscriptionResult = await getCompanySubscription();
    if (!subscriptionResult.success || !subscriptionResult.data) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const currentSubscription = subscriptionResult.data;

    // Update subscription in Stripe
    if (currentSubscription.stripe_subscription_id) {
      await stripe.subscriptions.update(currentSubscription.stripe_subscription_id, {
        items: [{ id: currentSubscription.stripe_subscription_id, price: plan_id }],
        metadata: {
          plan_slug: plan_id,
          billing_cycle,
        },
      });
    }

    // Update database record
    const { error } = await supabase
      .from('company_subscriptions')
      .update({
        billing_cycle,
      })
      .eq('id', currentSubscription.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current subscription
    const subscriptionResult = await getCompanySubscription();
    if (!subscriptionResult.success || !subscriptionResult.data) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const currentSubscription = subscriptionResult.data;

    // Cancel subscription in Stripe
    if (currentSubscription.stripe_subscription_id) {
      await stripe.subscriptions.cancel(currentSubscription.stripe_subscription_id);
    }

    // Update database record
    const { error } = await supabase
      .from('company_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date(),
        cancel_at_period_end: true,
      })
      .eq('id', currentSubscription.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
} 