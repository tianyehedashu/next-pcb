import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendAdminNotification } from '@/lib/utils/sendEmail';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, company, projectType, message } = await request.json();

    // 验证必填字段
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // 创建 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 插入联系信息到数据库
    const { error: contactError } = await supabase
      .from('contacts')
      .insert([
        {
          name,
          email,
          phone,
          company,
          project_type: projectType,
          message,
          created_at: new Date().toISOString(),
        },
      ]);

    if (contactError) {
      console.error('Database error:', contactError);
      return NextResponse.json(
        { 
          error: 'Failed to save contact information', 
          details: contactError.message,
          code: contactError.code 
        },
        { status: 500 }
      );
    }

    // 发送邮件给管理员
    const emailSubject = `🔔 New Contact Form Submission - ${name}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📝 New Contact Form Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">SpeedXPCB Customer Inquiry</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
          <h2 style="color: #495057; margin-top: 0;">Customer Information</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #6c757d;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Email:</td>
                <td style="padding: 8px 0; color: #6c757d;">
                  <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Phone:</td>
                <td style="padding: 8px 0; color: #6c757d;">
                  <a href="tel:${phone}" style="color: #667eea; text-decoration: none;">${phone}</a>
                </td>
              </tr>
              ` : ''}
              ${company ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Company:</td>
                <td style="padding: 8px 0; color: #6c757d;">${company}</td>
              </tr>
              ` : ''}
              ${projectType ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #495057;">Project Type:</td>
                <td style="padding: 8px 0; color: #6c757d;">
                  <span style="background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    ${projectType}
                  </span>
                </td>
              </tr>
              ` : ''}
            </table>
          </div>

          <h3 style="color: #495057; margin-bottom: 15px;">📋 Customer Message</h3>
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
            <p style="color: #6c757d; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin-top: 0;">⚡ Quick Actions</h4>
            <p style="color: #856404; margin: 10px 0;">
              • Reply to customer: <a href="mailto:${email}" style="color: #856404;">Send Email</a><br/>
              • Call customer: ${phone ? `<a href="tel:${phone}" style="color: #856404;">${phone}</a>` : 'Phone not provided'}<br/>
              • View admin dashboard: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin" style="color: #856404;">Admin Panel</a>
            </p>
          </div>

          <div style="margin-top: 20px; text-align: center; color: #6c757d; font-size: 12px;">
            <p>This email was automatically generated from the SpeedXPCB contact form.</p>
            <p>Submitted on: ${new Date().toLocaleString('en-US', { 
              timeZone: 'America/Toronto',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })}</p>
          </div>
        </div>
      </div>
    `;

    try {
      console.log('🔄 Starting email notification process...');
      await sendAdminNotification(supabase, emailSubject, emailHtml);
      console.log('✅ Contact form email notification sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError);
      console.error('Email error details:', {
        message: emailError instanceof Error ? emailError.message : String(emailError),
        stack: emailError instanceof Error ? emailError.stack : undefined
      });
      // 不要因为邮件发送失败而让整个请求失败
      // 联系信息已经保存到数据库了
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message! We will get back to you within 2 hours during business hours.' 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
} 