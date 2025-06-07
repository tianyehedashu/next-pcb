import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 这里建议将环境变量配置在 .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    // 1. 获取token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    // 2. 用token初始化supabase客户端
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    // 3. 验证用户（如果有token）
    let user = null;
    if (token) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      user = authUser;
    }
    
    // 4. 处理业务逻辑
    const body = await req.json();
    
    // 提取关键字段
    const { email, phone, shippingAddress, gerberFileUrl, cal_values, ...pcbSpecData } = body;
    
    // 验证必需字段
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // 构建插入数据
    const insertData = {
      user_id: user?.id || null, // 游客报价时为null
      email,
      phone: phone || null,
      pcb_spec: pcbSpecData, // 只存表单字段
      cal_values: cal_values || null, // 新增：存所有计算字段
      shipping_address: shippingAddress || null,
      gerber_file_url: gerberFileUrl || null,
      status: 'pending'
    };
    
    // 插入数据库
    const result = await supabase
      .from('pcb_quotes')
      .insert([insertData])
      .select('id')
      .single();
    
    console.log("Insert result:", result);
    
    if (result.error) {
      console.error("Database error:", result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      id: result.data?.id,
      message: 'Quote submitted successfully'
    }, { status: 200 });
    
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error("API error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 