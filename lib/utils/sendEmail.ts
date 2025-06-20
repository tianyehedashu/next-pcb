import { unstable_cache } from 'next/cache';
import * as nodemailer from 'nodemailer';
import { SupabaseClient, User } from '@supabase/supabase-js';

const getAdminProfiles = unstable_cache(
    async (adminClient: SupabaseClient) => {
        console.log('Fetching admin profiles from database...');
        return adminClient.from('profiles').select('id').eq('role', 'admin');
    },
    ['admin_profiles'],
    { revalidate: 3600 }
);

const getAdminUsers = unstable_cache(
    async (adminClient: SupabaseClient) => {
        console.log('Fetching admin users from auth...');
        return adminClient.auth.admin.listUsers();
    },
    ['admin_users'],
    { revalidate: 3600 }
);

/**
 * Sends a notification email to all admin users.
 * @param adminClient - An initialized Supabase client with service role permissions.
 * @param subject - The subject of the email.
 * @param html - The HTML content of the email.
 */
export async function sendAdminNotification(adminClient: SupabaseClient, subject: string, html: string): Promise<void> {
  const { data: adminProfiles, error: profileError } = await getAdminProfiles(adminClient);
  
  if (profileError) {
    console.error('Error fetching admin profiles:', profileError);
    throw new Error(`Failed to fetch admin profiles: ${profileError.message}`);
  }

  if (!adminProfiles || adminProfiles.length === 0) {
    console.warn('No admin profiles found. Cannot send notification email.');
    return;
  }

  const adminIds = adminProfiles.map(profile => profile.id);
  const { data: adminUsersData, error: userError } = await getAdminUsers(adminClient);
  
  if (userError) {
    console.error('Error fetching admin users:', userError);
    throw new Error(`Failed to fetch admin users: ${userError.message}`);
  }

  const adminEmails = adminUsersData.users
    .filter((user: User) => user.email && adminIds.includes(user.id))
    .map((user: User) => user.email);

  const to = adminEmails.join(',');

  if (!to) {
    console.warn('No admin emails found to send notification to.');
    return;
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
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.QQ_EMAIL_USER;
  const fromName = process.env.SMTP_FROM_NAME || 'PCB Manufacturing';

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });
    console.log(`Admin notification email sent to ${to} with subject: "${subject}"`);
  } catch (err) {
    console.error('Failed to send admin notification email:', err);
    throw new Error(`Failed to send email: ${String(err)}`);
  }
}
