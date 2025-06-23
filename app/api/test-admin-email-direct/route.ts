import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminNotification } from '@/lib/utils/sendEmail';

export async function POST(request: NextRequest) {
  try {
    const { subject, html } = await request.json();

    if (!subject || !html) {
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      );
    }

    // 创建 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('🔄 Testing admin email notification...');
    console.log('📧 Subject:', subject);
    console.log('📝 HTML length:', html.length);

    // 检查环境变量
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST || 'Not set',
      SMTP_PORT: process.env.SMTP_PORT || 'Not set',
      SMTP_USER: process.env.SMTP_USER || 'Not set',
      QQ_EMAIL_USER: process.env.QQ_EMAIL_USER || 'Not set',
      SMTP_FROM: process.env.SMTP_FROM || 'Not set',
      SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'Not set',
      // 不记录密码
      SMTP_PASS_SET: process.env.SMTP_PASS ? 'Yes' : 'No',
      QQ_EMAIL_AUTH_CODE_SET: process.env.QQ_EMAIL_AUTH_CODE ? 'Yes' : 'No',
    };

    console.log('🔧 SMTP Environment Variables:', envVars);

    try {
      await sendAdminNotification(supabase, subject, html);
      console.log('✅ Email test successful');
      
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully to admin users',
        environmentCheck: envVars,
      });
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to send email',
        details: emailError instanceof Error ? emailError.message : String(emailError),
        environmentCheck: envVars,
        stack: emailError instanceof Error ? emailError.stack : undefined,
      });
    }

  } catch (error) {
    console.error('Test admin email API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during email test', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 