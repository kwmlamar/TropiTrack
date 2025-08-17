import { createClient } from "@/utils/supabase/server"
import { completeOnboardingStep } from "@/lib/actions/onboarding-actions"

export async function approveTimesheet(timesheetId: string) {
  const supabase = await createClient()
  
  try {
    // Update the timesheet status to approved
    const { data, error: updateError } = await supabase
      .from('timesheets')
      .update({ 
        supervisor_approval: 'approved'
      })
      .eq('id', timesheetId)
      .select('created_by')
      .single()

    if (updateError) {
      console.error('Error updating timesheet:', updateError)
      return { success: false, error: updateError.message }
    }

    // Complete the approvals onboarding step
    if (data?.created_by) {
      try {
        await completeOnboardingStep(data.created_by, 'approvals', {
          timesheet_id: timesheetId,
          approved_at: new Date().toISOString()
        });
        console.log('Onboarding step "approvals" completed for user:', data.created_by);
      } catch (onboardingError) {
        console.error('Error completing approvals onboarding step:', onboardingError);
        // Don't fail the approval if onboarding completion fails
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error approving timesheet:', error)
    return { success: false, error: 'Failed to approve timesheet' }
  }
}

export async function rejectTimesheet(timesheetId: string) {
  const supabase = await createClient()
  
  try {
    // Update the timesheet status to rejected
    const { data, error: updateError } = await supabase
      .from('timesheets')
      .update({ 
        supervisor_approval: 'rejected'
      })
      .eq('id', timesheetId)
      .select('created_by')
      .single()

    if (updateError) {
      console.error('Error updating timesheet:', updateError)
      return { success: false, error: updateError.message }
    }

    // Complete the approvals onboarding step (rejecting is also part of the approval process)
    if (data?.created_by) {
      try {
        await completeOnboardingStep(data.created_by, 'approvals', {
          timesheet_id: timesheetId,
          rejected_at: new Date().toISOString()
        });
        console.log('Onboarding step "approvals" completed for user (rejection):', data.created_by);
      } catch (onboardingError) {
        console.error('Error completing approvals onboarding step:', onboardingError);
        // Don't fail the rejection if onboarding completion fails
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error rejecting timesheet:', error)
    return { success: false, error: 'Failed to reject timesheet' }
  }
} 