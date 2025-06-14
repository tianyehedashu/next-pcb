import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();
    const urlParts = request.url.split('/');
    // The user ID is before '/reset-password'
    const id = urlParts[urlParts.length - 2];

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // First, get the user's email from their ID
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);

    if (userError || !userData?.user?.email) {
      console.error('Error fetching user for password reset:', userError);
      return NextResponse.json({ error: 'User not found or has no email' }, { status: 404 });
    }
    
    const email = userData.user.email;

    // Use the regular client to send the reset email, as admin client doesn't have this method directly
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: '/profile/password', // Redirect user to this page after they click the link
    });

    if (resetError) {
      console.error('Error sending password reset email:', resetError);
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password reset email sent successfully.' });

  } catch (error) {
    console.error('Unexpected error in reset password route:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 