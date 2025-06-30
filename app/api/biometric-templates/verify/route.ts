import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { BiometricTemplatesService } from '@/lib/data/biometric-templates';
import { biometricCaptureManager } from '@/lib/utils/biometric-capture';

export async function POST(request: NextRequest) {
  try {
    console.log('Cross-device biometric verification API called');
    
    // Check authentication
    const supabase = createServerComponentClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    let companyId: string;
    
    if (authError || !user) {
      console.log('Authentication failed, using test company for development');
      // For development/testing, use a test company
      companyId = '8eb071ea-235a-4c5a-85e6-b00d2c6745b3'; // Test company ID
    } else {
      console.log('Auth check result:', { user: user.id, error: authError });
      
      // Get user's company
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
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
    console.log('Verification request:', requestBody);

    const { 
      worker_id, 
      template_type, 
      device_id,
      match_threshold = 0.85
    } = requestBody;

    if (!worker_id || !template_type) {
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

    // Capture biometric template for verification
    let captureResult;
    
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

    if (!captureResult.success || !captureResult.template) {
      console.error('Biometric capture failed:', captureResult.error);
      return NextResponse.json(
        { error: captureResult.error || 'Biometric capture failed' },
        { status: 400 }
      );
    }

    console.log('Biometric capture successful for verification:', {
      template_id: captureResult.template.id,
      quality: captureResult.quality,
      type: captureResult.template.type
    });

    // Verify the captured template against stored templates
    const verificationResult = await BiometricTemplatesService.verifyTemplate({
      worker_id: worker.id,
      company_id: companyId,
      template_type: template_type,
      captured_template: captureResult.template,
      match_threshold: match_threshold
    });

    if (!verificationResult.success) {
      console.error('Template verification failed:', verificationResult.error);
      return NextResponse.json(
        { error: verificationResult.error || 'Template verification failed' },
        { status: 500 }
      );
    }

    console.log('Template verification result:', {
      is_match: verificationResult.is_match,
      match_score: verificationResult.match_score,
      matched_template_id: verificationResult.matched_template_id
    });

    // Log the verification attempt
    try {
      const { error: logError } = await supabase
        .from('biometric_verifications')
        .insert({
          worker_id: worker.id,
          company_id: companyId,
          verification_type: template_type,
          device_id: device_id || 'unknown',
          is_successful: verificationResult.is_match,
          match_score: verificationResult.match_score,
          template_id: verificationResult.matched_template_id,
          verification_method: 'cross_device_template'
        });

      if (logError) {
        console.error('Failed to log verification:', logError);
      }
    } catch (logError) {
      console.error('Failed to log verification:', logError);
    }

    if (verificationResult.is_match) {
      console.log('Cross-device biometric verification successful');
      return NextResponse.json({
        success: true,
        is_verified: true,
        worker_name: worker.name,
        template_type: template_type,
        match_score: verificationResult.match_score,
        verification_method: 'cross_device_template'
      });
    } else {
      console.log('Cross-device biometric verification failed');
      return NextResponse.json(
        { 
          success: false,
          is_verified: false,
          error: 'Biometric verification failed',
          match_score: verificationResult.match_score
        },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error('Unexpected error in cross-device biometric verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 