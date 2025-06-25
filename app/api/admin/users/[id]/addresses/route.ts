import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest
) {
  const { error } = await checkAdminAuth();
  if (error) {
    return error;
  }

  try {
    const supabase = await createClient();

    const urlParts = request.url.split('/');
    // The user ID is before '/addresses'
    const userId = urlParts[urlParts.length - 2];
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user addresses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Unexpected error in GET user addresses:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 