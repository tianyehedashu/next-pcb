import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAILS = ["admin@example.com"];

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    // 用token获取用户信息
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user || !ADMIN_EMAILS.includes(user.email!)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }
    
    // 用service_role_key查所有报价
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await adminClient
      .from('pcb_quotes')
      .select(`
        id,
        user_id,
        email,
        phone,
        pcb_spec,
        shipping_address,
        gerber_file_url,
        status,
        admin_quote_price,
        admin_notes,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data }, { status: 200 });
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Admin API error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 