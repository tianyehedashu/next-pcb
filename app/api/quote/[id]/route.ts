import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 查询报价，支持两种情况：
    // 1. 用户自己的报价 (user_id = user.id)
    // 2. 游客报价 (user_id is null and email = user.email)
    const { data, error } = await supabase
      .from('pcb_quotes')
      .select('*')
      .eq('id', id)
      .or(`user_id.eq.${user.id},and(user_id.is.null,email.eq.${user.email})`)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Quote not found or no permission' }, { status: 404 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.log(errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 