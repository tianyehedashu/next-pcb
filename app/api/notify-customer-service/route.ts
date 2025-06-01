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

  const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.QQ_EMAIL_USER,
      pass: process.env.QQ_EMAIL_AUTH_CODE,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Your App" <${process.env.QQ_EMAIL_USER}>`,
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