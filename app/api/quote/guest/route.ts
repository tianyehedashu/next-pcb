import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, phone, shippingAddress, gerberFileUrl, ...pcbSpecData } = body;

    // 验证必需字段
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 使用 service role key 来绕过 RLS 限制
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 构建插入数据 - 游客报价user_id为null
    const insertData = {
      user_id: null, // 明确标识为游客报价
      email,
      phone: phone || null,
      pcb_spec: pcbSpecData, // 所有PCB技术规格存储为JSON
      shipping_address: shippingAddress || null,
      gerber_file_url: gerberFileUrl || null,
      status: 'pending'
    };

    // 创建游客报价记录
    const { data: quoteData, error: quoteError } = await supabase
      .from('pcb_quotes')
      .insert([insertData])
      .select('id')
      .single();

    if (quoteError) {
      console.error('Quote creation error:', quoteError);
      return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
    }

    // 2. 发送邮件通知（可选）
    // TODO: 集成邮件服务（如 Resend、SendGrid 等）
    
    return NextResponse.json({ 
      success: true, 
      id: quoteData.id,
      message: 'Quote submitted successfully. We will contact you soon via email.' 
    }, { status: 200 });

  } catch (err: unknown) {
    console.error('Guest quote error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 