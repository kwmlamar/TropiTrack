import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { EmailService } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const { name, company_name, email, phone_number } = await request.json();

    // Validate required fields
    if (!name || !company_name || !email || !phone_number) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Store the lead in the database
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        company_name,
        email,
        phone_number,
        status: 'new',
        source: 'landing_page',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing lead:', insertError);
      return NextResponse.json(
        { error: 'Failed to store lead information' },
        { status: 500 }
      );
    }

    // Send email notifications
    const emailResults = await EmailService.sendLeadEmails({
      name,
      company_name,
      email,
      phone_number,
    });

    console.log('Email results:', emailResults);
    console.log('New lead captured:', {
      id: lead.id,
      name,
      company: company_name,
      email,
      phone: phone_number,
    });

    return NextResponse.json({
      success: true,
      message: 'Lead captured successfully',
      leadId: lead.id,
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
