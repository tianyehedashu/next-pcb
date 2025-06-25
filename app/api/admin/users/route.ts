import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabaseAdmin = createAdminClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const keyword = searchParams.get('keyword') || '';

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let listUsersPromise;

    if (keyword) {
      // This is a simplified search. Supabase Admin API for users has limitations on searching.
      // A more robust solution might involve a separate user profile table.
      // For now, we fetch all and filter, which is not performant for large sets.
      listUsersPromise = supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    } else {
      listUsersPromise = supabaseAdmin.auth.admin.listUsers({ page, perPage: pageSize });
    }

    const { data, error } = await listUsersPromise;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    let users = data.users;
    let total = data.users.length;

    if (keyword) {
      const lowercasedKeyword = keyword.toLowerCase();
      users = users.filter(user =>
        user.email?.toLowerCase().includes(lowercasedKeyword) ||
        user.phone?.toLowerCase().includes(lowercasedKeyword) ||
        user.user_metadata?.full_name?.toLowerCase().includes(lowercasedKeyword)
      );
      total = users.length;
      // manual pagination after filtering
      users = users.slice(from, to + 1);
    } else {
      // When not searching, we need a separate query to get the total count
      const { data: { total: totalCount } } = await supabaseAdmin.auth.admin.listUsers();
      total = totalCount ?? 0;
    }

    // Get user profiles to include role information
    const userIds = users.map(user => user.id);
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching user profiles:', profileError);
      // Continue without profile data rather than failing
    }

    // Merge user data with profile data
    const usersWithRoles = users.map(user => {
      const profile = profiles?.find(p => p.id === user.id);
      return {
        ...user,
        role: profile?.role || 'user'
      };
    });

    return NextResponse.json({
      items: usersWithRoles,
      total: total,
    });
  } catch (error) {
    console.error('Unexpected error in GET users:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 