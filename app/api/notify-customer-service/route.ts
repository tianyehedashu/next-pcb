import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { to, subject, html } = await req.json();

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