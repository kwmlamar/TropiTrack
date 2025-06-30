import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const worker_id = searchParams.get('worker_id');

    if (!worker_id) {
      // If no worker_id is provided, return the first available worker
      const { data: worker, error: workerError } = await supabase
        .from('workers')
        .select('id, company_id, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (workerError || !worker) {
        return NextResponse.json({ error: 'No worker found', details: workerError?.message }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        worker: {
          id: worker.id,
          name: worker.name,
          company_id: worker.company_id
        },
        message: 'First available worker returned'
      });
    }

    console.log('Testing worker lookup for ID:', worker_id);

    // Get worker's company_id
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, company_id, name')
      .eq('id', worker_id)
      .single();

    console.log('Worker test result:', { 
      worker_id: worker?.id, 
      worker_name: worker?.name,
      company_id: worker?.company_id,
      error: workerError?.message,
      error_code: workerError?.code 
    });

    if (workerError || !worker) {
      return NextResponse.json({ 
        error: 'Worker not found',
        details: workerError?.message,
        worker_id: worker_id
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      worker: {
        id: worker.id,
        name: worker.name,
        company_id: worker.company_id
      },
      message: 'Worker found successfully'
    });

  } catch (error) {
    console.error('Test worker error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 