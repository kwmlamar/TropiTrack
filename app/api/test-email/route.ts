import { NextRequest, NextResponse } from 'next/server';
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

    // Test sending emails
    const emailResults = await EmailService.sendLeadEmails({
      name,
      company_name,
      email,
      phone_number,
    });

    return NextResponse.json({
      success: true,
      message: 'Test emails sent successfully',
      results: emailResults,
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test email endpoint',
    usage: 'POST with { name, company_name, email, phone_number }',
    example: {
      name: 'John Smith',
      company_name: 'Smith Construction Co.',
      email: 'john@smithconstruction.com',
      phone_number: '+1 (242) 555-0123'
    }
  });
}
