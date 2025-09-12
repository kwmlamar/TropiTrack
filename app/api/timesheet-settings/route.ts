import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCurrentUserCompany } from '@/lib/data/companies';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user and company
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await getCurrentUserCompany();
    if (!company) {
      console.error('Company not found for user:', user.id);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = company.id;

    // Try to get existing settings first
    const { data: existingSettings, error: fetchError } = await supabase
      .from('timesheet_settings')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching timesheet settings:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // If settings exist, return them
    if (existingSettings) {
      return NextResponse.json({ success: true, data: existingSettings });
    }

    // If no settings exist, create default ones
    const { data: newSettings, error: createError } = await supabase
      .from('timesheet_settings')
      .insert({
        company_id: companyId,
        work_day_start: '07:00:00',
        work_day_end: '16:00:00',
        break_time: 60,
        overtime_threshold: 40,
        rounding_method: 'nearest_15',
        auto_clockout: true,
        require_approval: true,
        allow_overtime: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating default timesheet settings:', createError);
      return NextResponse.json({ error: 'Failed to create default settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newSettings });
  } catch (error) {
    console.error('Error in timesheet settings GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user and company
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await getCurrentUserCompany();
    if (!company) {
      console.error('Company not found for user:', user.id);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyId = company.id;

    // Parse request body
    const body = await request.json();
    const {
      work_day_start,
      work_day_end,
      break_time,
      overtime_threshold,
      rounding_method,
      auto_clockout,
      require_approval,
      allow_overtime
    } = body;

    // Validate required fields - require_approval is required for both update and create
    if (require_approval === undefined) {
      return NextResponse.json({ error: 'require_approval is required' }, { status: 400 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (work_day_start !== undefined) updateData.work_day_start = work_day_start;
    if (work_day_end !== undefined) updateData.work_day_end = work_day_end;
    if (break_time !== undefined) updateData.break_time = break_time;
    if (overtime_threshold !== undefined) updateData.overtime_threshold = overtime_threshold;
    if (rounding_method !== undefined) updateData.rounding_method = rounding_method;
    if (auto_clockout !== undefined) updateData.auto_clockout = auto_clockout;
    if (require_approval !== undefined) updateData.require_approval = require_approval;
    if (allow_overtime !== undefined) updateData.allow_overtime = allow_overtime;

    // Check if settings exist first
    const { data: existingSettings, error: checkError } = await supabase
      .from('timesheet_settings')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking for existing timesheet settings:', checkError);
      return NextResponse.json({ error: 'Failed to check settings' }, { status: 500 });
    }

    if (existingSettings) {
      // Settings exist, update them
      const { data: updatedSettings, error: updateError } = await supabase
        .from('timesheet_settings')
        .update(updateData)
        .eq('company_id', companyId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating timesheet settings:', updateError);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: updatedSettings });
    } else {
      // No settings exist, create new ones
      const insertData = {
        company_id: companyId,
        work_day_start: work_day_start || '07:00:00',
        work_day_end: work_day_end || '16:00:00',
        break_time: break_time || 60,
        overtime_threshold: overtime_threshold || 40,
        rounding_method: rounding_method || 'nearest_15',
        auto_clockout: auto_clockout !== undefined ? auto_clockout : true,
        require_approval: require_approval,
        allow_overtime: allow_overtime !== undefined ? allow_overtime : true
      };
      const { data: newSettings, error: createError } = await supabase
        .from('timesheet_settings')
        .insert(insertData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating timesheet settings:', createError);
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: newSettings });
    }
  } catch (error) {
    console.error('Error in timesheet settings PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
