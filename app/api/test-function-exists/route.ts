import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test if the function exists by calling it with dummy data
    const { data, error } = await supabase
      .rpc('create_trial_subscription', {
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        plan_slug: 'starter',
        trial_days: 14
      });

    console.log('Function test result:', { data, error });

    return NextResponse.json({
      success: true,
      functionExists: !error || error.message.includes('Company not found'), // Function exists if we get a business logic error
      error: error?.message,
      data
    });

  } catch (error) {
    console.error('Function test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}
