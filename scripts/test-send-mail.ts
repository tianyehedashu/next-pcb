import 'dotenv/config'; // Make sure to load env variables at the top
import { createClient } from '@supabase/supabase-js';
import { sendAdminNotification } from '../lib/utils/sendEmail';

// This is a standalone script to test the sendAdminNotification function.
// To run it:
// 1. Make sure you have a .env.local file with the correct Supabase and SMTP variables.
// 2. You might need to install ts-node: `pnpm install -D ts-node`
// 3. Run the script: `pnpm ts-node scripts/test-send-mail.ts`

async function runTest() {
  console.log('Starting test email script...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not set.');
    process.exit(1);
  }
  
  // Create a Supabase admin client for the script
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const subject = '🚀 Standalone Script Test';
  const html = `
    <h1>Test from Standalone Script</h1>
    <p>This email was triggered by running the <code>scripts/test-send-mail.ts</code> script.</p>
    <p>Current time: ${new Date().toISOString()}</p>
  `;

  try {
    console.log('Attempting to send notification to admins...');
    // We need to cast the client to the type expected by sendAdminNotification
    await sendAdminNotification(supabaseAdmin as any, subject, html);
    console.log('✅ Script completed successfully. Email should have been sent.');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

runTest(); 