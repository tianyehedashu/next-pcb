import * as nodemailer from 'nodemailer';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/utils/supabase/server';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailTemplate {
  subject: string;
  html: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface NotificationMetadata {
  orderId?: string;
  notificationType: string;
  userId?: string;
  timestamp?: string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  private constructor() {
    this.config = this.getEmailConfig();
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getEmailConfig(): EmailConfig {
    return {
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || process.env.QQ_EMAIL_USER || '',
        pass: process.env.SMTP_PASS || process.env.QQ_EMAIL_AUTH_CODE || '',
      },
    };
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransporter(this.config);
    }
    return this.transporter;
  }

  private getFromAddress(): { email: string; name: string } {
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.QQ_EMAIL_USER || '';
    const fromName = process.env.SMTP_FROM_NAME || 'SpeedXPCB';
    return { email: fromEmail, name: fromName };
  }

  /**
   * 发送邮件的通用方法
   */
  private async sendEmail(to: string | string[], template: EmailTemplate): Promise<void> {
    const transporter = this.getTransporter();
    const { email: fromEmail, name: fromName } = this.getFromAddress();
    
    const recipients = Array.isArray(to) ? to.join(',') : to;

    try {
      console.log('📬 Sending email:', {
        to: recipients,
        subject: template.subject,
        priority: template.priority || 'normal'
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: recipients,
        subject: template.subject,
        html: template.html,
      });

      console.log('✅ Email sent successfully:', {
        to: recipients,
        subject: template.subject,
        messageId: info.messageId
      });
    } catch (error) {
      console.error('❌ Failed to send email:', {
        to: recipients,
        subject: template.subject,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Failed to send email: ${String(error)}`);
    }
  }

  /**
   * 获取管理员邮箱列表
   */
  private async getAdminEmails(supabaseClient: SupabaseClient): Promise<string[]> {
    try {
      // 获取管理员profiles
      const { data: adminProfiles, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (profileError || !adminProfiles?.length) {
        console.warn('⚠️ No admin profiles found');
        return [];
      }

      const adminIds = adminProfiles.map(profile => profile.id);

      // 获取管理员用户详情
      const { data: adminUsersData, error: userError } = await supabaseClient.auth.admin.listUsers();

      if (userError || !adminUsersData.users?.length) {
        console.warn('⚠️ No admin users found');
        return [];
      }

      const adminEmails = adminUsersData.users
        .filter((user: User) => user.email && adminIds.includes(user.id))
        .map((user: User) => user.email as string);

      console.log('📧 Found admin emails:', adminEmails.length);
      return adminEmails;
    } catch (error) {
      console.error('❌ Error fetching admin emails:', error);
      return [];
    }
  }

  /**
   * 获取用户邮箱
   */
  private async getUserEmail(userId: string, supabaseClient?: SupabaseClient): Promise<string | null> {
    try {
      const client = supabaseClient || createSupabaseAdminClient();

      // 先从 auth.users 表获取
      const { data: authUser, error: authError } = await client.auth.admin.getUserById(userId);
      
      if (!authError && authUser?.user?.email) {
        return authUser.user.email;
      }

      // 备选方案：从 profiles 表获取
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
        
      if (!profileError && profile?.email) {
        return profile.email;
      }

      console.warn(`⚠️ No email found for user: ${userId}`);
      return null;
    } catch (error) {
      console.error('❌ Error fetching user email:', error);
      return null;
    }
  }

  /**
   * 发送通知给管理员
   */
  public async sendAdminNotification(
    template: EmailTemplate,
    metadata: NotificationMetadata,
    supabaseClient?: SupabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Sending admin notification:', {
        subject: template.subject,
        notificationType: metadata.notificationType,
        orderId: metadata.orderId,
        priority: template.priority || 'normal'
      });

      const client = supabaseClient || createSupabaseAdminClient();
      const adminEmails = await this.getAdminEmails(client);

      if (adminEmails.length === 0) {
        console.warn('⚠️ No admin emails found, skipping notification');
        return { success: false, error: 'No admin emails found' };
      }

      await this.sendEmail(adminEmails, template);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to send admin notification:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 发送通知给用户
   */
  public async sendUserNotification(
    userId: string,
    template: EmailTemplate,
    metadata: NotificationMetadata,
    supabaseClient?: SupabaseClient
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Sending user notification:', {
        userId,
        subject: template.subject,
        notificationType: metadata.notificationType,
        orderId: metadata.orderId
      });

      const client = supabaseClient || createSupabaseAdminClient();
      const userEmail = await this.getUserEmail(userId, client);

      if (!userEmail) {
        return { success: false, error: 'User email not found' };
      }

      await this.sendEmail(userEmail, template);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to send user notification:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 发送自定义邮件
   */
  public async sendCustomEmail(
    to: string | string[],
    template: EmailTemplate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.sendEmail(to, template);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance();

// 向后兼容的函数
export async function sendAdminNotification(
  adminClient: SupabaseClient,
  subject: string,
  html: string
): Promise<void> {
  const template: EmailTemplate = { subject, html };
  const metadata: NotificationMetadata = { notificationType: 'legacy_admin_notification' };
  
  const result = await emailService.sendAdminNotification(template, metadata, adminClient);
  if (!result.success) {
    throw new Error(result.error || 'Failed to send admin notification');
  }
} 