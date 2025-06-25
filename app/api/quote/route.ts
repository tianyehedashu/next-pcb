import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Create client that works for both authenticated and anonymous users
    const supabase = await createClient();
    
    // Try to get user (will be null for anonymous users)
    const { data: { user } } = await supabase.auth.getUser();
    
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