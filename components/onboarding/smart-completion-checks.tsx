"use client";

import { getAuthUserId, getUserProfile } from '@/lib/data/userProfiles';
import { getWorkers } from '@/lib/data/workers';
import { getClients } from '@/lib/data/clients';
import { getProjects } from '@/lib/data/projects';
import { getTimesheets } from '@/lib/data/timesheets';
import { getAggregatedPayrolls } from '@/lib/data/payroll';
import { getOnboardingProgress, completeOnboardingStep } from '@/lib/actions/onboarding-actions';

// Track recent checks to prevent excessive calls
const recentChecks = new Map<string, number>();

// Function to save smart completion to database
async function saveSmartCompletion(stepId: string, userId: string, data?: Record<string, unknown>) {
  try {
    const result = await completeOnboardingStep(userId, stepId, data);
    if (result.success) {
      console.log(`Smart completion saved for step: ${stepId}`);
      return true;
    } else {
      console.error(`Failed to save smart completion for step ${stepId}:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`Error saving smart completion for step ${stepId}:`, error);
    return false;
  }
}

// Smart completion check for workers step
export async function isWorkersStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  workerCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Debounce checks to prevent excessive calls
    const now = Date.now();
    const key = `workers-${actualUserId}`;
    const lastCheck = recentChecks.get(key);
    if (lastCheck && (now - lastCheck) < 2000) { // 2 second debounce
      console.log('Skipping workers check - too recent');
      return {
        isCompleted: false,
        method: 'explicit',
        workerCount: 0
      };
    }
    recentChecks.set(key, now);
    
    // Get user profile to get company ID
    let userProfile;
    try {
      userProfile = await getUserProfile();
    } catch (profileError) {
      console.error('Error fetching profile info:', profileError);
      return {
        isCompleted: false,
        method: 'explicit',
        workerCount: 0
      };
    }
    
    // If no profile exists, return early
    if (!userProfile) {
      console.log('No user profile found - skipping smart completion check');
      return {
        isCompleted: false,
        method: 'explicit',
        workerCount: 0
      };
    }
    
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
    
    // If implicitly completed but not explicitly, save to database
    if (implicitCompleted && !explicitCompleted) {
      await saveSmartCompletion('workers', actualUserId, { 
        worker_count: workerCount,
        smart_completed: true 
      });
    }
    
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
    
    // Debounce checks to prevent excessive calls
    const now = Date.now();
    const key = `clients-${actualUserId}`;
    const lastCheck = recentChecks.get(key);
    if (lastCheck && (now - lastCheck) < 2000) { // 2 second debounce
      console.log('Skipping clients check - too recent');
      return {
        isCompleted: false,
        method: 'explicit',
        clientCount: 0
      };
    }
    recentChecks.set(key, now);
    
    // Get user profile to get company ID
    let userProfile;
    try {
      userProfile = await getUserProfile();
    } catch (profileError) {
      console.error('Error fetching profile info:', profileError);
      return {
        isCompleted: false,
        method: 'explicit',
        clientCount: 0
      };
    }
    
    // If no profile exists, return early
    if (!userProfile) {
      console.log('No user profile found - skipping smart completion check');
      return {
        isCompleted: false,
        method: 'explicit',
        clientCount: 0
      };
    }
    
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
    
    // If implicitly completed but not explicitly, save to database
    if (implicitCompleted && !explicitCompleted) {
      await saveSmartCompletion('clients', actualUserId, { 
        client_count: clientCount,
        smart_completed: true 
      });
    }
    
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
    
    // Debounce checks to prevent excessive calls
    const now = Date.now();
    const key = `projects-${actualUserId}`;
    const lastCheck = recentChecks.get(key);
    if (lastCheck && (now - lastCheck) < 2000) { // 2 second debounce
      console.log('Skipping projects check - too recent');
      return {
        isCompleted: false,
        method: 'explicit',
        projectCount: 0
      };
    }
    recentChecks.set(key, now);
    
    // Get user profile to get company ID
    let userProfile;
    try {
      userProfile = await getUserProfile();
    } catch (profileError) {
      console.error('Error fetching profile info:', profileError);
      return {
        isCompleted: false,
        method: 'explicit',
        projectCount: 0
      };
    }
    
    // If no profile exists, return early
    if (!userProfile) {
      console.log('No user profile found - skipping smart completion check');
      return {
        isCompleted: false,
        method: 'explicit',
        projectCount: 0
      };
    }
    
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
    
    // If implicitly completed but not explicitly, save to database
    if (implicitCompleted && !explicitCompleted) {
      await saveSmartCompletion('projects', actualUserId, { 
        project_count: projectCount,
        smart_completed: true 
      });
    }
    
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

// Smart completion check for timesheets step
export async function isTimesheetsStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  timesheetCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Debounce checks to prevent excessive calls
    const now = Date.now();
    const key = `timesheets-${actualUserId}`;
    const lastCheck = recentChecks.get(key);
    if (lastCheck && (now - lastCheck) < 2000) { // 2 second debounce
      console.log('Skipping timesheets check - too recent');
      return {
        isCompleted: false,
        method: 'explicit',
        timesheetCount: 0
      };
    }
    recentChecks.set(key, now);
    
    // Get user profile to get company ID
    let userProfile;
    try {
      userProfile = await getUserProfile();
    } catch (profileError) {
      console.error('Error fetching profile info:', profileError);
      return {
        isCompleted: false,
        method: 'explicit',
        timesheetCount: 0
      };
    }
    
    // If no profile exists, return early
    if (!userProfile) {
      console.log('No user profile found - skipping smart completion check');
      return {
        isCompleted: false,
        method: 'explicit',
        timesheetCount: 0
      };
    }
    
    const companyId = userProfile.company_id;
    
    if (!companyId) {
      console.error('No company ID found for user');
      return {
        isCompleted: false,
        method: 'explicit',
        timesheetCount: 0
      };
    }
    
    // Check explicit completion
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    const explicitCompleted = completedSteps.includes('timesheets');
    
    // Check implicit completion
    const timesheetsResponse = await getTimesheets(companyId, {});
    const timesheetCount = timesheetsResponse.success && timesheetsResponse.data ? timesheetsResponse.data.length : 0;
    const implicitCompleted = timesheetCount > 0;
    
    console.log('Timesheets smart completion check:', {
      explicitCompleted,
      implicitCompleted,
      timesheetCount,
      companyId
    });
    
    // If implicitly completed but not explicitly, save to database
    if (implicitCompleted && !explicitCompleted) {
      await saveSmartCompletion('timesheets', actualUserId, { 
        timesheet_count: timesheetCount,
        smart_completed: true 
      });
    }
    
    // Determine completion method
    let method: 'explicit' | 'implicit' | 'both' = 'both';
    if (explicitCompleted && !implicitCompleted) method = 'explicit';
    if (!explicitCompleted && implicitCompleted) method = 'implicit';
    
    return {
      isCompleted: explicitCompleted || implicitCompleted,
      method,
      timesheetCount
    };
  } catch (error) {
    console.error('Error in timesheets smart completion check:', error);
    return {
      isCompleted: false,
      method: 'explicit',
      timesheetCount: 0
    };
  }
}

// Smart completion check for approvals step
export async function isApprovalsStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  approvalCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Debounce checks to prevent excessive calls
    const now = Date.now();
    const key = `approvals-${actualUserId}`;
    const lastCheck = recentChecks.get(key);
    if (lastCheck && (now - lastCheck) < 2000) { // 2 second debounce
      console.log('Skipping approvals check - too recent');
      return {
        isCompleted: false,
        method: 'explicit',
        approvalCount: 0
      };
    }
    recentChecks.set(key, now);
    
    // Get user profile to get company ID
    let userProfile;
    try {
      userProfile = await getUserProfile();
    } catch (profileError) {
      console.error('Error fetching profile info:', profileError);
      return {
        isCompleted: false,
        method: 'explicit',
        approvalCount: 0
      };
    }
    
    // If no profile exists, return early
    if (!userProfile) {
      console.log('No user profile found - skipping smart completion check');
      return {
        isCompleted: false,
        method: 'explicit',
        approvalCount: 0
      };
    }
    
    const companyId = userProfile.company_id;
    
    if (!companyId) {
      console.error('No company ID found for user');
      return {
        isCompleted: false,
        method: 'explicit',
        approvalCount: 0
      };
    }
    
    // Check explicit completion
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    const explicitCompleted = completedSteps.includes('approvals');
    
    // Check implicit completion - look for approved timesheets
    const timesheetsResponse = await getTimesheets(companyId, { supervisor_approval: 'approved' });
    const approvedTimesheetCount = timesheetsResponse.success && timesheetsResponse.data ? timesheetsResponse.data.length : 0;
    const implicitCompleted = approvedTimesheetCount > 0;
    
    console.log('Approvals smart completion check:', {
      explicitCompleted,
      implicitCompleted,
      approvedTimesheetCount,
      companyId
    });
    
    // If implicitly completed but not explicitly, save to database
    if (implicitCompleted && !explicitCompleted) {
      await saveSmartCompletion('approvals', actualUserId, { 
        approval_count: approvedTimesheetCount,
        smart_completed: true 
      });
    }
    
    // Determine completion method
    let method: 'explicit' | 'implicit' | 'both' = 'both';
    if (explicitCompleted && !implicitCompleted) method = 'explicit';
    if (!explicitCompleted && implicitCompleted) method = 'implicit';
    
    return {
      isCompleted: explicitCompleted || implicitCompleted,
      method,
      approvalCount: approvedTimesheetCount
    };
  } catch (error) {
    console.error('Error in approvals smart completion check:', error);
    return {
      isCompleted: false,
      method: 'explicit',
      approvalCount: 0
    };
  }
}

// Smart completion check for payroll step
export async function isPayrollStepSmartCompleted(userId?: string): Promise<{
  isCompleted: boolean;
  method: 'explicit' | 'implicit' | 'both';
  payrollCount: number;
}> {
  try {
    const actualUserId = userId || await getAuthUserId();
    
    // Debounce checks to prevent excessive calls
    const now = Date.now();
    const key = `payroll-${actualUserId}`;
    const lastCheck = recentChecks.get(key);
    if (lastCheck && (now - lastCheck) < 2000) { // 2 second debounce
      console.log('Skipping payroll check - too recent');
      return {
        isCompleted: false,
        method: 'explicit',
        payrollCount: 0
      };
    }
    recentChecks.set(key, now);
    
    // Get user profile to get company ID
    let userProfile;
    try {
      userProfile = await getUserProfile();
    } catch (profileError) {
      console.error('Error fetching profile info:', profileError);
      return {
        isCompleted: false,
        method: 'explicit',
        payrollCount: 0
      };
    }
    
    // If no profile exists, return early
    if (!userProfile) {
      console.log('No user profile found - skipping smart completion check');
      return {
        isCompleted: false,
        method: 'explicit',
        payrollCount: 0
      };
    }
    
    const companyId = userProfile.company_id;
    
    if (!companyId) {
      console.error('No company ID found for user');
      return {
        isCompleted: false,
        method: 'explicit',
        payrollCount: 0
      };
    }
    
    // Check explicit completion
    const progress = await getOnboardingProgress(actualUserId);
    const completedSteps = progress.map(p => p.step_name);
    const explicitCompleted = completedSteps.includes('payroll');
    
    // Check implicit completion - look for any payroll records
    const payrollResponse = await getAggregatedPayrolls({
      target_period_type: 'weekly'
    });
    const payrollCount = payrollResponse.success && payrollResponse.data ? payrollResponse.data.length : 0;
    const implicitCompleted = payrollCount > 0;
    
    console.log('Payroll smart completion check:', {
      explicitCompleted,
      implicitCompleted,
      payrollCount,
      companyId
    });
    
    // If implicitly completed but not explicitly, save to database
    if (implicitCompleted && !explicitCompleted) {
      await saveSmartCompletion('payroll', actualUserId, { 
        payroll_count: payrollCount,
        smart_completed: true 
      });
    }
    
    // Determine completion method
    let method: 'explicit' | 'implicit' | 'both' = 'both';
    if (explicitCompleted && !implicitCompleted) method = 'explicit';
    if (!explicitCompleted && implicitCompleted) method = 'implicit';
    
    return {
      isCompleted: explicitCompleted || implicitCompleted,
      method,
      payrollCount
    };
  } catch (error) {
    console.error('Error in payroll smart completion check:', error);
    return {
      isCompleted: false,
      method: 'explicit',
      payrollCount: 0
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
    case 'timesheets':
      const timesheetsResult = await isTimesheetsStepSmartCompleted(userId);
      return {
        isCompleted: timesheetsResult.isCompleted,
        method: timesheetsResult.method,
        count: timesheetsResult.timesheetCount
      };
    case 'approvals':
      const approvalsResult = await isApprovalsStepSmartCompleted(userId);
      return {
        isCompleted: approvalsResult.isCompleted,
        method: approvalsResult.method,
        count: approvalsResult.approvalCount
      };
    case 'payroll':
      const payrollResult = await isPayrollStepSmartCompleted(userId);
      return {
        isCompleted: payrollResult.isCompleted,
        method: payrollResult.method,
        count: payrollResult.payrollCount
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