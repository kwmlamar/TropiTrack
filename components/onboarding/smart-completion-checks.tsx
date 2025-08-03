"use client";

import { getAuthUserId, getUserProfile } from '@/lib/data/userProfiles';
import { getWorkers } from '@/lib/data/workers';
import { getClients } from '@/lib/data/clients';
import { getProjects } from '@/lib/data/projects';
import { getOnboardingProgress } from '@/lib/actions/onboarding-actions';

// Smart completion check for workers step
export async function isWorkersStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  workerCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Get user profile to get company ID
    const userProfile = await getUserProfile();
    const companyId = userProfile.company_id;
    
    if (!companyId) {
      console.error('No company ID found for user');
      return {
        isCompleted: false,
        method: 'explicit',
        workerCount: 0
      };
    }
    
    // Check explicit completion
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    const explicitCompleted = completedSteps.includes('workers');
    
    // Check implicit completion
    const workersResponse = await getWorkers(companyId, {});
    const workerCount = workersResponse.success && workersResponse.data ? workersResponse.data.length : 0;
    const implicitCompleted = workerCount > 0;
    
    console.log('Workers smart completion check:', {
      explicitCompleted,
      implicitCompleted,
      workerCount,
      companyId
    });
    
    // Determine completion method
    let method: 'explicit' | 'implicit' | 'both' = 'both';
    if (explicitCompleted && !implicitCompleted) method = 'explicit';
    if (!explicitCompleted && implicitCompleted) method = 'implicit';
    
    return {
      isCompleted: explicitCompleted || implicitCompleted,
      method,
      workerCount
    };
  } catch (error) {
    console.error('Error in workers smart completion check:', error);
    return {
      isCompleted: false,
      method: 'explicit',
      workerCount: 0
    };
  }
}

// Smart completion check for clients step
export async function isClientsStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  clientCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Get user profile to get company ID
    const userProfile = await getUserProfile();
    const companyId = userProfile.company_id;
    
    if (!companyId) {
      console.error('No company ID found for user');
      return {
        isCompleted: false,
        method: 'explicit',
        clientCount: 0
      };
    }
    
    // Check explicit completion
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    const explicitCompleted = completedSteps.includes('clients');
    
    // Check implicit completion
    const clientsResponse = await getClients(companyId, {});
    const clientCount = clientsResponse.success && clientsResponse.data ? clientsResponse.data.length : 0;
    const implicitCompleted = clientCount > 0;
    
    console.log('Clients smart completion check:', {
      explicitCompleted,
      implicitCompleted,
      clientCount,
      companyId
    });
    
    // Determine completion method
    let method: 'explicit' | 'implicit' | 'both' = 'both';
    if (explicitCompleted && !implicitCompleted) method = 'explicit';
    if (!explicitCompleted && implicitCompleted) method = 'implicit';
    
    return {
      isCompleted: explicitCompleted || implicitCompleted,
      method,
      clientCount
    };
  } catch (error) {
    console.error('Error in clients smart completion check:', error);
    return {
      isCompleted: false,
      method: 'explicit',
      clientCount: 0
    };
  }
}

// Smart completion check for projects step
export async function isProjectsStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  projectCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Get user profile to get company ID
    const userProfile = await getUserProfile();
    const companyId = userProfile.company_id;
    
    if (!companyId) {
      console.error('No company ID found for user');
      return {
        isCompleted: false,
        method: 'explicit',
        projectCount: 0
      };
    }
    
    // Check explicit completion
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    const explicitCompleted = completedSteps.includes('projects');
    
    // Check implicit completion
    const projectsResponse = await getProjects(companyId, {});
    const projectCount = projectsResponse.success && projectsResponse.data ? projectsResponse.data.length : 0;
    const implicitCompleted = projectCount > 0;
    
    console.log('Projects smart completion check:', {
      explicitCompleted,
      implicitCompleted,
      projectCount,
      companyId
    });
    
    // Determine completion method
    let method: 'explicit' | 'implicit' | 'both' = 'both';
    if (explicitCompleted && !implicitCompleted) method = 'explicit';
    if (!explicitCompleted && implicitCompleted) method = 'implicit';
    
    return {
      isCompleted: explicitCompleted || implicitCompleted,
      method,
      projectCount
    };
  } catch (error) {
    console.error('Error in projects smart completion check:', error);
    return {
      isCompleted: false,
      method: 'explicit',
      projectCount: 0
    };
  }
}

// Generic smart completion check function
export async function isStepSmartCompleted(stepId: string, userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  count: number;
}> {
  switch (stepId) {
    case 'workers':
      const workersResult = await isWorkersStepSmartCompleted(userId);
      return {
        isCompleted: workersResult.isCompleted,
        method: workersResult.method,
        count: workersResult.workerCount
      };
    case 'clients':
      const clientsResult = await isClientsStepSmartCompleted(userId);
      return {
        isCompleted: clientsResult.isCompleted,
        method: clientsResult.method,
        count: clientsResult.clientCount
      };
    case 'projects':
      const projectsResult = await isProjectsStepSmartCompleted(userId);
      return {
        isCompleted: projectsResult.isCompleted,
        method: projectsResult.method,
        count: projectsResult.projectCount
      };
    default:
      // For other steps, only check explicit completion
      try {
        const actualUserId = userId || await getAuthUserId();
        const progress = await getOnboardingProgress(actualUserId);
        const completedSteps = progress.map(p => p.step_name);
        const explicitCompleted = completedSteps.includes(stepId);
        
        return {
          isCompleted: explicitCompleted,
          method: 'explicit',
          count: 0
        };
      } catch (error) {
        console.error(`Error checking completion for step ${stepId}:`, error);
        return {
          isCompleted: false,
          method: 'explicit',
          count: 0
        };
      }
  }
} 