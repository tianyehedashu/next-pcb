import * as nodemailer from 'nodemailer';
import { SupabaseClient } from '@supabase/supabase-js';

// Define a type for the Supabase client that includes the admin methods we need.
// This helps with type safety.
type SupabaseAdminClient = SupabaseClient<any, "public", any> & {
    auth: {
        admin: {
            listUsers: (params?: any) => Promise<{ data: { users: any[] }, error: any }>;
        }
    }
}

/**
 * Sends a notification email to all admin users.
 * @param adminClient - An initialized Supabase client with service role permissions.
 * @param subject - The subject of the email.
 * @param html - The HTML content of the email.
 */
export async function sendAdminNotification(adminClient: SupabaseAdminClient, subject: string, html: string): Promise<void> {
  // 1. Query all admin user profiles
  const { data: adminProfiles, error: profileError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('role', 'admin');
  
  if (profileError) {
    console.error('Error fetching admin profiles:', profileError);
    throw new Error(`Failed to fetch admin profiles: ${profileError.message}`);
  }

  if (!adminProfiles || adminProfiles.length === 0) {
    console.warn('No admin profiles found. Cannot send notification email.');
    return;
  }

  // 2. Get all users and filter for admin emails
  const adminIds = adminProfiles.map(profile => profile.id);
  const { data: adminUsersData, error: userError } = await adminClient.auth.admin.listUsers();
  
  if (userError) {
    console.error('Error fetching admin users:', userError);
    throw new Error(`Failed to fetch admin users: ${userError.message}`);
  }

  const adminEmails = adminUsersData.users
    .filter(user => adminIds.includes(user.id) && user.email)
    .map(user => user.email);

  const to = adminEmails.join(',');

  if (!to) {
    console.warn('No admin emails found to send notification to.');
    return;
  }

  // 3. Configure Nodemailer transport
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

  // 4. Send the email
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
    // We throw the error so the calling function can decide how to handle it.
    throw new Error(`Failed to send email: ${String(err)}`);
  }
} 