"use server";

// Simple test actions that don't require database tables
// These are for testing the UI components without database setup

export async function testSimulateOnboardingProgress(
  _steps: string[] // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'This function is only available in development' };
  }

  // Simulate a delay to make it feel like a real operation
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Always succeed for testing
  return { success: true };
}

export async function testForceOnboardingMode(): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'This function is only available in development' };
  }

  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Always succeed for testing
  return { success: true };
}

export async function testCheckOnboardingStatus(): Promise<{
  isCompleted: boolean;
  completedSteps: string[];
  shouldShowOnboarding: boolean;
}> {
  // Return mock data for testing
  return {
    isCompleted: false,
    completedSteps: ['company-setup', 'workers'],
    shouldShowOnboarding: true,
  };
}

export async function checkAuthenticationStatus(): Promise<{
  isAuthenticated: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return {
        isAuthenticated: false,
        error: error?.message || 'User not found'
      };
    }
    
    return {
      isAuthenticated: true,
      userId: user.id
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 