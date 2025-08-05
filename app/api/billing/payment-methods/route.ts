import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { getPaymentMethods, createPaymentMethod } from '@/lib/data/subscriptions';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await getPaymentMethods();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ paymentMethods: result.data });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
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

    const { payment_method_id, is_default } = await request.json();

    if (!payment_method_id) {
      return NextResponse.json({ error: 'Payment method ID is required' }, { status: 400 });
    }

    // Get user profile with company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    // Attach payment method to customer
    const { data: subscription } = await supabase
      .from('company_subscriptions')
      .select('stripe_customer_id')
      .eq('company_id', profile.company_id)
      .not('stripe_customer_id', 'is', null)
      .single();

    if (subscription?.stripe_customer_id) {
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: subscription.stripe_customer_id,
      });

      if (is_default) {
        await stripe.customers.update(subscription.stripe_customer_id, {
          invoice_settings: {
            default_payment_method: payment_method_id,
          },
        });
      }
    }

    // Create payment method record in database
    const result = await createPaymentMethod({
      stripe_payment_method_id: payment_method_id,
      is_default: is_default || false,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ paymentMethod: result.data });
  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json({ error: 'Failed to create payment method' }, { status: 500 });
  }
} 