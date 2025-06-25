import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function POST(
  request: NextRequest
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabaseAdmin = createAdminClient();
    const urlParts = request.url.split('/');
    // The user ID is before '/make-admin'
    const id = urlParts[urlParts.length - 2];

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, check if the user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);

    if (userError || !userData?.user) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if profile exists, if not create one
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileCheckError);
      return NextResponse.json({ error: 'Failed to check user profile' }, { status: 500 });
    }

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { error: createProfileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: id,
          role: 'admin'
        });

      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
    } else {
      // Update existing profile to admin
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating user role:', updateError);
        return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
      }
    }

    // Also update the user metadata for immediate effect
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        ...userData.user.user_metadata,
        role: 'admin'
      }
    });

    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Don't fail the request if metadata update fails, as the profile update succeeded
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