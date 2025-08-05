import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { supabase } from '@/lib/supabaseClient';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('Processing Stripe webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object);
        break;
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const { company_id } = subscription.metadata;
  if (!company_id) return;

  const { error } = await supabase
    .from('company_subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    })
    .eq('company_id', company_id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { company_id } = subscription.metadata;
  if (!company_id) return;

  const { error } = await supabase
    .from('company_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    })
    .eq('company_id', company_id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { company_id } = subscription.metadata;
  if (!company_id) return;

  const { error } = await supabase
    .from('company_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date(),
    })
    .eq('company_id', company_id);

  if (error) {
    console.error('Error canceling subscription:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const { company_id } = invoice.metadata;
  if (!company_id) return;

  // Create billing invoice record
  const { error } = await supabase
    .from('billing_invoices')
    .insert({
      company_id,
      subscription_id: invoice.subscription,
      invoice_number: invoice.number,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid',
      billing_reason: invoice.billing_reason,
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      paid_at: new Date(),
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent,
    });

  if (error) {
    console.error('Error creating billing invoice:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const { company_id } = invoice.metadata;
  if (!company_id) return;

  // Update subscription status
  const { error } = await supabase
    .from('company_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('company_id', company_id);

  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const { company_id } = paymentMethod.metadata;
  if (!company_id) return;

  const { error } = await supabase
    .from('payment_methods')
    .insert({
      company_id,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
      is_default: false,
      is_active: true,
    });

  if (error) {
    console.error('Error creating payment method:', error);
  }
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  const { error } = await supabase
    .from('payment_methods')
    .update({
      is_active: false,
    })
    .eq('stripe_payment_method_id', paymentMethod.id);

  if (error) {
    console.error('Error deactivating payment method:', error);
  }
} 