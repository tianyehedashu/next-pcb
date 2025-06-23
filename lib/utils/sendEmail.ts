import * as nodemailer from 'nodemailer';
import { SupabaseClient, User } from '@supabase/supabase-js';

const getAdminProfiles = async (adminClient: SupabaseClient) => {
    console.log('Fetching admin profiles from database...');
    return adminClient.from('profiles').select('id').eq('role', 'admin');
};

const getAdminUsers = async (adminClient: SupabaseClient) => {
    console.log('Fetching admin users from auth...');
    return adminClient.auth.admin.listUsers();
};

/**
 * Sends a notification email to all admin users.
 * @param adminClient - An initialized Supabase client with service role permissions.
 * @param subject - The subject of the email.
 * @param html - The HTML content of the email.
 */
export async function sendAdminNotification(adminClient: SupabaseClient, subject: string, html: string): Promise<void> {
  console.log('🔄 sendAdminNotification called with subject:', subject);
  
  const { data: adminProfiles, error: profileError } = await getAdminProfiles(adminClient);
  
  if (profileError) {
    console.error('❌ Error fetching admin profiles:', profileError);
    throw new Error(`Failed to fetch admin profiles: ${profileError.message}`);
  }

  console.log('👥 Admin profiles found:', adminProfiles?.length || 0);

  if (!adminProfiles || adminProfiles.length === 0) {
    console.warn('⚠️ No admin profiles found. Cannot send notification email.');
    return;
  }

  const adminIds = adminProfiles.map(profile => profile.id);
  console.log('🔑 Admin IDs:', adminIds);
  
  const { data: adminUsersData, error: userError } = await getAdminUsers(adminClient);
  
  if (userError) {
    console.error('❌ Error fetching admin users:', userError);
    throw new Error(`Failed to fetch admin users: ${userError.message}`);
  }

  console.log('👤 Total auth users found:', adminUsersData.users?.length || 0);

  const adminEmails = adminUsersData.users
    .filter((user: User) => user.email && adminIds.includes(user.id))
    .map((user: User) => user.email);

  console.log('📧 Admin emails found:', adminEmails);

  const to = adminEmails.join(',');

  if (!to) {
    console.warn('⚠️ No admin emails found to send notification to.');
    console.log('Debug info:', {
      adminIds,
      totalUsers: adminUsersData.users?.length,
      usersWithEmails: adminUsersData.users?.filter(u => u.email).length,
      matchingUsers: adminUsersData.users?.filter(u => adminIds.includes(u.id)).length
    });
    return;
  }

  console.log('📬 Sending email to:', to);

  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.qq.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER || process.env.QQ_EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.QQ_EMAIL_AUTH_CODE,
    },
  };

  console.log('⚙️ Email config:', {
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    user: emailConfig.auth.user,
    passSet: !!emailConfig.auth.pass
  });

  const transporter = nodemailer.createTransport(emailConfig);
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.QQ_EMAIL_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'SpeedXPCB';

  console.log('📮 Email details:', {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    htmlLength: html.length
  });

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Admin notification email sent successfully!`);
    console.log('📊 Send result:', {
      to,
      subject,
      messageId: info.messageId,
      response: info.response
    });
  } catch (err) {
    console.error('❌ Failed to send admin notification email:', err);
    console.error('🔍 Error details:', {
      message: err instanceof Error ? err.message : String(err),
      code: (err as Record<string, unknown>)?.code,
      command: (err as Record<string, unknown>)?.command,
      response: (err as Record<string, unknown>)?.response
    });
    throw new Error(`Failed to send email: ${String(err)}`);
  }
}
