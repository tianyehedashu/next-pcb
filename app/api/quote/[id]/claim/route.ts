import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
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

    // 首先检查报价是否存在且为游客报价
    const { data: quote, error: fetchError } = await supabase
      .from('pcb_quotes')
      .select('*')
      .eq('id', id)
      .is('user_id', null) // 必须是游客报价
      .eq('email', user.email) // 邮箱必须匹配
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ 
        error: 'Quote not found or not eligible for claiming' 
      }, { status: 404 });
    }

    // 检查报价是否已经被认领
    if (quote.user_id) {
      return NextResponse.json({ 
        error: 'This quote has already been claimed' 
      }, { status: 400 });
    }

    // 更新报价，将user_id设置为当前用户
    const { error: updateError } = await supabase
      .from('pcb_quotes')
      .update({ 
        user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error claiming quote:', updateError);
      return NextResponse.json({ 
        error: 'Failed to claim quote' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Quote claimed successfully' 
    }, { status: 200 });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Claim quote error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 