import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  const { id: userIdToReset } = await params;
  if (!userIdToReset) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createSupabaseAdminClient();
    
    const { data: userToReset, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userIdToReset);

    if (getUserError || !userToReset?.user?.email) {
      console.error('Error fetching user to reset password:', getUserError);
      return NextResponse.json({ error: 'Failed to find user or user has no email' }, { status: 404 });
    }

    const email = userToReset.user.email;
    
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/update-password`
    });

    if (resetError) {
      console.error('Supabase admin error sending password reset email:', resetError);
      return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 500 });
    }

    return NextResponse.json({ message: `Password reset email sent to ${email}` });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected server error occurred.';
    console.error('Password reset endpoint error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 