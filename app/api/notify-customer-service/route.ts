import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const { subject, html } = await req.json();

  // 创建 supabase 管理员 client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // 查询所有管理员邮箱（profiles join users）
  const { data: admins, error } = await adminClient
    .from('profiles')
    .select('id, role, users(email)')
    .eq('role', 'admin');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  type AdminWithEmail = { id: string; role: string; users?: { email?: string } };
  const to = (admins as AdminWithEmail[])
    .map((admin) => admin.users?.email)
    .filter((email): email is string => !!email)
    .join(',');
  if (!to) {
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