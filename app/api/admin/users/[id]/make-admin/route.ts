import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabaseAdmin = createAdminClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, check if the user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);

    if (userError || !userData?.user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user metadata to make them admin
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        ...userData.user.user_metadata,
        role: 'admin'
      }
    });

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'User successfully promoted to admin',
      user: {
        id: userData.user.id,
        email: userData.user.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Unexpected error in make admin route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 