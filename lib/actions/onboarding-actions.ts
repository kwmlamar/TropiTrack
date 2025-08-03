"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/server-admin";
import type { OnboardingProgress, OnboardingData } from "@/lib/types/onboarding";
import { getAuthUserId } from "@/lib/data/userProfiles";

export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching onboarding progress:', error);
    return [];
  }

  return data || [];
}

export async function completeOnboardingStep(
  userId: string, 
  stepName: string, 
  data?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('onboarding_progress')
    .upsert({
      user_id: userId,
      step_name: stepName,
      data: data || {},
      completed_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error completing onboarding step:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function checkOnboardingStatus(userId: string): Promise<{
  isCompleted: boolean;
  completedSteps: string[];
  shouldShowOnboarding: boolean;
}> {
  const supabase = await createClient();
  
  // Check if user has completed onboarding
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Error checking onboarding status:', profileError);
    return { isCompleted: false, completedSteps: [], shouldShowOnboarding: true };
  }

  // Get completed steps
  const progress = await getOnboardingProgress(userId);
  const completedSteps = progress.map(p => p.step_name);

  const isCompleted = profileData?.onboarding_completed || false;
  const shouldShowOnboarding = !isCompleted;

  return { isCompleted, completedSteps, shouldShowOnboarding };
}

export async function markOnboardingComplete(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error marking onboarding complete:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resetOnboardingForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  // Delete all onboarding progress
  const { error: progressError } = await supabaseAdmin
    .from('onboarding_progress')
    .delete()
    .eq('user_id', userId);

  if (progressError) {
    console.error('Error deleting onboarding progress:', progressError);
    return { success: false, error: progressError.message };
  }

  // Reset onboarding flags in profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      onboarding_completed: false,
      onboarding_started_at: null,
      onboarding_completed_at: null,
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error resetting profile onboarding flags:', profileError);
    return { success: false, error: profileError.message };
  }

  return { success: true };
}

export async function startOnboardingForUser(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_started_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error starting onboarding:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveOnboardingData(
  userId?: string, 
  data: OnboardingData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get real user ID if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      try {
        actualUserId = await getAuthUserId();
      } catch (authError) {
        console.error('Authentication error:', authError);
        return { 
          success: false, 
          error: 'User not authenticated. Please log in first.' 
        };
      }
    }
    
    const supabase = await createClient();
    
    // Save onboarding data to a special step
    const { error } = await supabase
      .from('onboarding_progress')
      .upsert({
        user_id: actualUserId,
        step_name: 'onboarding_data',
        data: data,
        completed_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving onboarding data:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveOnboardingData:', error);
    return { 
      success: false, 
      error: `Failed to save onboarding data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function getOnboardingData(userId: string): Promise<OnboardingData | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('onboarding_progress')
    .select('data')
    .eq('user_id', userId)
    .eq('step_name', 'onboarding_data')
    .single();

  if (error) {
    console.error('Error fetching onboarding data:', error);
    return null;
  }

  return data?.data || null;
}

// Development/testing utilities (only available in development)
export async function forceOnboardingMode(userId?: string): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'This function is only available in development' };
  }

  try {
    // Get real user ID if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      try {
        actualUserId = await getAuthUserId();
      } catch (authError) {
        console.error('Authentication error:', authError);
        return { 
          success: false, 
          error: 'User not authenticated. Please log in first.' 
        };
      }
    }
    
    return await resetOnboardingForUser(actualUserId);
  } catch (error) {
    console.error('Error in forceOnboardingMode:', error);
    return { 
      success: false, 
      error: `Failed to force onboarding mode: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

export async function simulateOnboardingProgress(
  userId?: string, 
  steps: string[]
): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'This function is only available in development' };
  }

  try {
    // Get real user ID if not provided
    let actualUserId = userId;
    if (!actualUserId) {
      try {
        actualUserId = await getAuthUserId();
      } catch (authError) {
        console.error('Authentication error:', authError);
        return { 
          success: false, 
          error: 'User not authenticated. Please log in first.' 
        };
      }
    }
    
    const supabase = await createClient();
    
    // Complete the specified steps
    for (const step of steps) {
      const { error } = await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: actualUserId,
          step_name: step,
          data: {},
          completed_at: new Date().toISOString(),
        });

      if (error) {
        console.error(`Error completing step ${step}:`, error);
        return { 
          success: false, 
          error: `Database error for step '${step}': ${error.message}. Make sure the onboarding_progress table exists.` 
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in simulateOnboardingProgress:', error);
    return { 
      success: false, 
      error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}. The onboarding_progress table may not exist.` 
    };
  }
} 