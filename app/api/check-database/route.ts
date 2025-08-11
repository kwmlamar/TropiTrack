import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if tables exist by trying to select from them
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const { error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    // Check table schemas
    const { error: profilesSchemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0);

    const { error: companiesSchemaError } = await supabase
      .from('companies')
      .select('*')
      .limit(0);

    // Check if trigger exists by checking if we can insert a test user
    // (This is a simplified check - in production you'd use raw SQL)
    const tables = {
      profiles: { exists: !profilesError, error: profilesError?.message },
      companies: { exists: !companiesError, error: companiesError?.message }
    };

    // Test basic permissions
    const { error: profileTestError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const { error: companyTestError } = await supabase
      .from('companies')
      .select('count')
      .limit(1);

    // Check for any existing users to see if the trigger worked before
    const { data: existingUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, company_id')
      .limit(5);

    // Check if there's already a company with the test email
    const { data: existingCompany, error: existingCompanyError } = await supabase
      .from('companies')
      .select('id, name, email')
      .eq('email', 'test@example.com');

    return NextResponse.json({
      success: true,
      tables,
      permissions: {
        profiles: {
          error: profileTestError?.message
        },
        companies: {
          error: companyTestError?.message
        }
      },
      existingUsers: {
        data: existingUsers,
        error: usersError?.message
      },
      existingCompany: {
        data: existingCompany,
        error: existingCompanyError?.message
      },
      schemas: {
        profiles: profilesSchemaError?.message || 'OK',
        companies: companiesSchemaError?.message || 'OK'
      }
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error 
    }, { status: 500 });
  }
}
