import { createClient } from "@/utils/supabase/server"

export async function approveTimesheet(timesheetId: string) {
  const supabase = await createClient()
  
  try {
    // Update the timesheet status to approved
    const { error: updateError } = await supabase
      .from('timesheets')
      .update({ 
        supervisor_approval: 'approved'
      })
      .eq('id', timesheetId)

    if (updateError) {
      console.error('Error updating timesheet:', updateError)
      return { success: false, error: updateError.message }
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
    const { error: updateError } = await supabase
      .from('timesheets')
      .update({ 
        supervisor_approval: 'rejected'
      })
      .eq('id', timesheetId)

    if (updateError) {
      console.error('Error rejecting timesheet:', updateError)
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error rejecting timesheet:', error)
    return { success: false, error: 'Failed to reject timesheet' }
  }
} 