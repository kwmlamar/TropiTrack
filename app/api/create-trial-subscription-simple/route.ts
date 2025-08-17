import { NextRequest, NextResponse } from 'next/server';
import { createTrialSubscription } from '@/lib/data/subscriptions';

export async function POST(request: NextRequest) {
  try {
    const { planSlug } = await request.json();

    if (!planSlug) {
      return NextResponse.json(
        { error: 'Plan slug is required' },
        { status: 400 }
      );
    }

    const result = await createTrialSubscription(planSlug);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      subscription: result.data
    });
  } catch (error) {
    console.error('Error creating trial subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
