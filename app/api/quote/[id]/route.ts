import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest, context: any) {
  try {
    const params = context.params ? (await context.params) : {};
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    const { data, error } = await supabase.from('pcb_quotes').select('*').eq('id', params.id).single();
    if (error || !data) {
      return NextResponse.json({ error: 'Quote not found or no permission' }, { status: 404 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.log(err.message)
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 