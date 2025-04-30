import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { keysToLowerCase } from '@/lib/keysToLowerCase';

// 这里建议将环境变量配置在 .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    // 1. 获取token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    // 2. 用token初始化supabase客户端
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    // 4. 处理业务逻辑
    const body = await req.json();
    // const lowerBody = keysToLowerCase(body);
    
    // user_id由前端传，RLS会校验user_id必须等于auth.uid()
    const result = await supabase.from('pcb_quotes').insert([body]).select('id').single();
    console.log("result is ",result)
    if (result.error) {
      
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, id: result.data?.id }, { status: 200 });
  } catch (err: any) {
  
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 