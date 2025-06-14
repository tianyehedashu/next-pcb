import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // 创建 supabase 管理员 client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 查询所有管理员用户ID
    const { data: adminProfiles, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('role', 'admin');

    if (profileError) {
      console.error('查询管理员失败:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      return NextResponse.json({
        adminCount: 0,
        adminEmails: [],
        admins: [],
        timestamp: new Date().toISOString()
      });
    }

    // 获取管理员邮箱
    const adminIds = adminProfiles.map(profile => profile.id);
    const { data: adminUsers, error: userError } = await adminClient.auth.admin.listUsers();
    
    if (userError) {
      console.error('获取用户信息失败:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const adminUsersWithEmails = adminUsers.users
      .filter(user => adminIds.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email || 'No email'
      }));

    const adminEmails = adminUsersWithEmails
      .map(user => user.email)
      .filter(email => email && email !== 'No email');

    // 返回调试信息
    return NextResponse.json({
      adminCount: adminProfiles.length,
      adminEmails,
      admins: adminProfiles.map(profile => {
        const userInfo = adminUsersWithEmails.find(user => user.id === profile.id);
        return {
          id: profile.id,
          role: profile.role,
          email: userInfo?.email || 'No email'
        };
      }),
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('获取管理员信息失败:', err);
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Unknown error' 
    }, { status: 500 });
  }
} 