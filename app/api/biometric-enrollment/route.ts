import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Biometric enrollment API called');
    
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check result:', { user: user?.id, error: authError?.message });
    
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { worker_id, enrollment_type, device_id, template_hash, webauthn_data } = body;
    console.log('Request body:', { 
      worker_id, 
      enrollment_type, 
      device_id, 
      template_hash: template_hash?.substring(0, 8) + '...',
      has_webauthn_data: !!webauthn_data
    });

    // Validate required fields
    if (!worker_id || !enrollment_type || !device_id || !template_hash) {
      console.log('Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: worker_id, enrollment_type, device_id, template_hash' 
      }, { status: 400 });
    }

    // Get user's company_id from profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.company_id) {
      console.log('User profile error:', profileError?.message);
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
    }

    // Verify worker belongs to the same company
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name, company_id')
      .eq('id', worker_id)
      .eq('company_id', userProfile.company_id)
      .single();

    if (workerError || !worker) {
      console.log('Worker not found or access denied:', workerError?.message);
      return NextResponse.json({ error: 'Worker not found or access denied' }, { status: 404 });
    }

    // Deactivate any existing enrollments for this worker and type
    const { error: deactivateError } = await supabase
      .from('biometric_enrollments')
      .update({ is_active: false })
      .eq('worker_id', worker_id)
      .eq('company_id', userProfile.company_id)
      .eq('enrollment_type', enrollment_type);

    if (deactivateError) {
      console.error('Error deactivating existing enrollments:', deactivateError);
    }

    // Prepare enrollment data
    const enrollmentData: Record<string, unknown> = {
      worker_id: worker_id,
      company_id: userProfile.company_id,
      enrollment_type: enrollment_type,
      device_id: device_id,
      template_hash: template_hash,
      is_active: true
    };

    // Add WebAuthn data if available
    if (webauthn_data) {
      enrollmentData.webauthn_data = webauthn_data;
      console.log('Including WebAuthn data in enrollment');
    }

    // Create the enrollment
    const { data, error } = await supabase
      .from('biometric_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (error) {
      console.error('Create enrollment error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Biometric enrollment created successfully:', { 
      enrollment_id: data.id, 
      worker_name: worker.name,
      enrollment_type: enrollment_type,
      has_webauthn: !!webauthn_data
    });

    return NextResponse.json({ 
      success: true, 
      enrollment: data,
      message: 'Biometric enrollment created successfully'
    });

  } catch (error) {
    console.error('Biometric enrollment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Biometric enrollment status API called');
    
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth check result:', { user: user?.id, error: authError?.message });
    
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const worker_id = searchParams.get('worker_id');

    if (!worker_id) {
      return NextResponse.json({ error: 'worker_id parameter is required' }, { status: 400 });
    }

    // Get user's company
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.company_id) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
    }

    // Verify worker belongs to user's company
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, company_id')
      .eq('id', worker_id)
      .eq('company_id', userProfile.company_id)
      .single();

    if (workerError || !worker) {
      return NextResponse.json({ error: 'Worker not found or access denied' }, { status: 404 });
    }

    // Get enrollment status using the function
    const { data: enrollmentStatus, error: statusError } = await supabase
      .rpc('get_biometric_enrollment_status', { p_worker_id: worker_id });

    if (statusError) {
      console.error('Enrollment status error:', statusError);
      return NextResponse.json({ error: 'Failed to get enrollment status' }, { status: 500 });
    }

    // Get active enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('biometric_enrollments')
      .select('*')
      .eq('worker_id', worker_id)
      .eq('company_id', userProfile.company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (enrollmentsError) {
      console.error('Enrollments fetch error:', enrollmentsError);
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
    }

    return NextResponse.json({
      status: enrollmentStatus[0] || null,
      enrollments: enrollments || []
    });

  } catch (error) {
    console.error('Biometric enrollment status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrollment_id = searchParams.get('enrollment_id');

    if (!enrollment_id) {
      return NextResponse.json({ error: 'enrollment_id parameter is required' }, { status: 400 });
    }

    // Get user's company
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.company_id) {
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
    }

    // Verify enrollment belongs to user's company and deactivate it
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('biometric_enrollments')
      .update({ is_active: false })
      .eq('id', enrollment_id)
      .eq('company_id', userProfile.company_id)
      .select()
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Biometric enrollment deactivated successfully' 
    });

  } catch (error) {
    console.error('Biometric enrollment deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 