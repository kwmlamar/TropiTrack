import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BiometricEnrollment, BiometricEnrollmentStatus } from '../types/worker';

const supabase = createClientComponentClient();

export async function createBiometricEnrollment(
  workerId: string,
  enrollmentType: 'fingerprint' | 'face' | 'both',
  deviceId: string,
  templateHash: string
): Promise<{ success: boolean; enrollment?: BiometricEnrollment; error?: string }> {
  try {
    // First, get the current user's company_id
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get user's company_id from profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile?.company_id) {
      return { success: false, error: 'User not associated with a company' };
    }

    // Create the enrollment with company_id
    const { data, error } = await supabase
      .from('biometric_enrollments')
      .insert({
        worker_id: workerId,
        company_id: userProfile.company_id,
        enrollment_type: enrollmentType,
        device_id: deviceId,
        template_hash: templateHash,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Create enrollment error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, enrollment: data };
  } catch (error) {
    console.error('Create enrollment exception:', error);
    return { success: false, error: 'Failed to create enrollment' };
  }
}

export async function getBiometricEnrollmentStatus(
  workerId: string
): Promise<{ success: boolean; status?: BiometricEnrollmentStatus; error?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('get_biometric_enrollment_status', { p_worker_id: workerId });

    if (error) {
      console.error('Get enrollment status error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, status: data[0] || null };
  } catch (error) {
    console.error('Get enrollment status exception:', error);
    return { success: false, error: 'Failed to get enrollment status' };
  }
}

export async function getActiveEnrollments(
  workerId: string
): Promise<{ success: boolean; enrollments?: BiometricEnrollment[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('biometric_enrollments')
      .select('*')
      .eq('worker_id', workerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get active enrollments error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, enrollments: data || [] };
  } catch (error) {
    console.error('Get active enrollments exception:', error);
    return { success: false, error: 'Failed to get active enrollments' };
  }
}

export async function deactivateEnrollment(
  enrollmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('biometric_enrollments')
      .update({ is_active: false })
      .eq('id', enrollmentId);

    if (error) {
      console.error('Deactivate enrollment error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Deactivate enrollment exception:', error);
    return { success: false, error: 'Failed to deactivate enrollment' };
  }
}

export async function getWorkerBiometricStatus(
  workerId: string
): Promise<{ success: boolean; status?: BiometricEnrollmentStatus; enrollments?: BiometricEnrollment[]; error?: string }> {
  try {
    // Get both status and active enrollments
    const [statusResult, enrollmentsResult] = await Promise.all([
      getBiometricEnrollmentStatus(workerId),
      getActiveEnrollments(workerId)
    ]);

    if (!statusResult.success) {
      return { success: false, error: statusResult.error };
    }

    if (!enrollmentsResult.success) {
      return { success: false, error: enrollmentsResult.error };
    }

    return {
      success: true,
      status: statusResult.status,
      enrollments: enrollmentsResult.enrollments
    };
  } catch (error) {
    console.error('Get worker biometric status exception:', error);
    return { success: false, error: 'Failed to get worker biometric status' };
  }
}

// Helper function to check device compatibility
export function checkDeviceCompatibility(): {
  fingerprint: boolean;
  face: boolean;
  webauthn: boolean;
} {
  const isSecure = window.isSecureContext;
  const hasWebAuthn = typeof window.PublicKeyCredential !== 'undefined';
  
  // Basic checks - in a real implementation, you'd do more thorough detection
  return {
    fingerprint: isSecure && hasWebAuthn, // Most fingerprint readers work through WebAuthn
    face: isSecure && hasWebAuthn, // Face ID/Touch ID work through WebAuthn
    webauthn: isSecure && hasWebAuthn
  };
}

// Helper function to generate a device ID
export function generateDeviceId(): string {
  // In a real implementation, you'd want to generate a more robust device ID
  // that persists across sessions but doesn't identify the user
  const userAgent = navigator.userAgent;
  const screenRes = `${screen.width}x${screen.height}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create a hash-like string from device characteristics
  const deviceString = `${userAgent}-${screenRes}-${timeZone}`;
  return btoa(deviceString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

// Helper function to generate a template hash (placeholder)
export async function generateTemplateHash(biometricData: string): Promise<string> {
  // In a real implementation, this would hash the actual biometric template
  // For now, we'll create a simple hash of the data
  const encoder = new TextEncoder();
  const data = encoder.encode(biometricData);
  
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
} 