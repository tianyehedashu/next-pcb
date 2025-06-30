import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, company_name, phone, address, last_login, created_at, updated_at')
      .eq('id', id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // If no profile exists, return default user role
    if (!profile) {
      return NextResponse.json({
        id,
        role: 'user',
        company_name: null,
        phone: null,
        address: null,
        last_login: null,
        created_at: null,
        updated_at: null
      });
    }

    return NextResponse.json(profile);

  } catch (error) {
    console.error('Unexpected error in GET user profile:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 