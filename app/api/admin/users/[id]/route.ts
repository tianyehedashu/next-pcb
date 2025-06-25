import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabaseAdmin = createAdminClient();
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

    const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);

    if (userError) {
      console.error('Error fetching user by id:', userError);
      return NextResponse.json({ error: userError.message }, { status: 404 });
    }

    return NextResponse.json(data.user);

  } catch (error) {
    console.error('Unexpected error in GET user by id:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 