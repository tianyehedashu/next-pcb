import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { subject, html } = await req.json();

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
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!adminProfiles || adminProfiles.length === 0) {
    console.error('No admin profiles found');
    return NextResponse.json({ error: 'No admin profiles found' }, { status: 500 });
  }

  // 获取管理员邮箱
  const adminIds = adminProfiles.map(profile => profile.id);
  const { data: adminUsers, error: userError } = await adminClient.auth.admin.listUsers();
  
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  const adminEmails = adminUsers.users
    .filter(user => adminIds.includes(user.id))
    .map(user => user.email)
    .filter(email => email);

  const to = adminEmails.join(',');
  if (!to) {
    console.error('No admin emails found');
    return NextResponse.json({ error: 'No admin emails found' }, { status: 500 });
  }

  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || process.env.QQ_EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.QQ_EMAIL_AUTH_CODE,
    },
  };

  const transporter = nodemailer.createTransport(emailConfig);

  try {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.QQ_EMAIL_USER;
    const fromName = process.env.SMTP_FROM_NAME || 'PCB Manufacturing';
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log('邮件已发送', to, subject);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
} 