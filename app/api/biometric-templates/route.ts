import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { BiometricTemplatesService } from '@/lib/data/biometric-templates';
import { biometricCaptureManager } from '@/lib/utils/biometric-capture';

export async function POST(request: NextRequest) {
  try {
    console.log('Biometric templates API called');
    
    // Check authentication
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    let companyId: string;
    
    if (authError || !user) {
      console.log('Authentication failed, using test user for development');
      // For development/testing, use a test user
      companyId = '8eb071ea-235a-4c5a-85e6-b00d2c6745b3'; // Test company ID
    } else {
      console.log('Auth check result:', { user: user.id, error: authError });
      
      // Get user's company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.company_id) {
        console.error('Profile lookup error:', profileError);
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 400 }
        );
      }
      companyId = profile.company_id;
    }

    const requestBody = await request.json();
    console.log('Request body:', requestBody);
    console.log('Request body type:', typeof requestBody);
    console.log('Request body keys:', Object.keys(requestBody));
    console.log('worker_id value:', requestBody.worker_id);
    console.log('template_type value:', requestBody.template_type);

    const { 
      worker_id, 
      template_type, 
      capture_method = 'simulated',
      device_id,
      template_data 
    } = requestBody;

    console.log('Extracted values:', { worker_id, template_type, capture_method, device_id });

    if (!worker_id || !template_type) {
      console.error('Validation failed:', { 
        worker_id: worker_id, 
        template_type: template_type,
        worker_id_type: typeof worker_id,
        template_type_type: typeof template_type
      });
      return NextResponse.json(
        { error: 'Missing required fields: worker_id, template_type' },
        { status: 400 }
      );
    }

    // Verify worker belongs to user's company
    const { data: worker, error: workerError } = await supabase
      .from('workers')
      .select('id, name, company_id')
      .eq('id', worker_id)
      .eq('company_id', companyId)
      .single();

    if (workerError || !worker) {
      console.error('Worker lookup error:', workerError);
      return NextResponse.json(
        { error: 'Worker not found or access denied' },
        { status: 404 }
      );
    }

    console.log('Worker lookup result:', {
      worker_id: worker.id,
      worker_name: worker.name,
      company_id: worker.company_id,
      error: workerError
    });

    // Use template data from client or capture on server if not provided
    let captureResult;
    
    if (template_data) {
      // Use template data provided by client
      captureResult = {
        success: true,
        template: {
          id: `template_${Date.now()}`,
          type: template_type,
          template: template_data, // Base64 encoded template
          quality: 0.95, // Assume high quality for client-provided templates
          features: [], // Will be extracted from template data
          metadata: {
            device: device_id || 'unknown',
            captureDate: new Date().toISOString(),
            algorithm: 'cross_device_v1',
            version: '1.0'
          }
        },
        quality: 0.95
      };
    } else {
      // Fallback to server-side capture (for backward compatibility)
      if (template_type === 'fingerprint') {
        captureResult = await biometricCaptureManager.captureFingerprintTemplate();
      } else if (template_type === 'face') {
        captureResult = await biometricCaptureManager.captureFaceTemplate();
      } else {
        return NextResponse.json(
          { error: 'Invalid template type. Must be "fingerprint" or "face"' },
          { status: 400 }
        );
      }
    }

    if (!captureResult.success || !captureResult.template) {
      console.error('Biometric capture failed:', captureResult.error);
      return NextResponse.json(
        { error: captureResult.error || 'Biometric capture failed' },
        { status: 400 }
      );
    }

    console.log('Biometric capture successful:', {
      template_id: captureResult.template.id,
      quality: captureResult.quality,
      type: captureResult.template.type
    });

    // Store the template in the database
    const createResult = await BiometricTemplatesService.createTemplate({
      worker_id: worker.id,
      company_id: companyId,
      template: captureResult.template
    });

    if (!createResult.success) {
      console.error('Template storage failed:', createResult.error);
      
      // Check if the error is due to missing table
      if (createResult.error && createResult.error.includes('relation "biometric_templates" does not exist')) {
        return NextResponse.json(
          { error: 'Biometric templates table not found. Please run the database migration first.' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: createResult.error || 'Failed to store biometric template' },
        { status: 500 }
      );
    }

    console.log('Biometric template created successfully:', {
      template_id: createResult.template_id,
      worker_name: worker.name,
      template_type: template_type,
      quality: captureResult.quality
    });

    return NextResponse.json({
      success: true,
      template_id: createResult.template_id,
      worker_name: worker.name,
      template_type: template_type,
      quality: captureResult.quality,
      capture_method: capture_method
    });

  } catch (error) {
    console.error('Unexpected error in biometric templates API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Biometric templates GET API called');
    
    // Check authentication
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    let companyId: string;
    
    if (authError || !user) {
      console.log('Authentication failed, using test company for development');
      // For development/testing, use a test company
      companyId = '8eb071ea-235a-4c5a-85e6-b00d2c6745b3'; // Test company ID
    } else {
      // Get user's company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.company_id) {
        console.error('Profile lookup error:', profileError);
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 400 }
        );
      }
      companyId = profile.company_id;
    }

    const { searchParams } = new URL(request.url);
    const worker_id = searchParams.get('worker_id');
    const template_type = searchParams.get('template_type') as 'fingerprint' | 'face' | 'both' | null;
    const active_only = searchParams.get('active_only') !== 'false';

    // Get templates
    const templatesResult = await BiometricTemplatesService.getTemplates({
      worker_id: worker_id || undefined,
      company_id: companyId,
      template_type: template_type || undefined,
      active_only
    });

    if (!templatesResult.success) {
      console.error('Failed to fetch templates:', templatesResult.error);
      return NextResponse.json(
        { error: templatesResult.error || 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    console.log(`Retrieved ${templatesResult.templates?.length || 0} biometric templates`);

    return NextResponse.json({
      success: true,
      templates: templatesResult.templates || [],
      count: templatesResult.templates?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error in biometric templates GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 