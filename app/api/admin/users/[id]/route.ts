import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest
) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    // Workaround for Next.js params handling issue.
    const urlParts = request.url.split('/');
    let id = urlParts[urlParts.length - 1];

    // Handle potential query params in the last part
    if (id.includes('?')) {
      id = id.split('?')[0];
    }

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error) {
      console.error('Error fetching user by id:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data.user);

  } catch (error) {
    console.error('Unexpected error in GET user by id:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 