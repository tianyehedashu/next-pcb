import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
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

    // 查找所有符合条件的游客报价
    const { data: quotes, error: fetchError } = await supabase
      .from('pcb_quotes')
      .select('id')
      .is('user_id', null) // 必须是游客报价
      .eq('email', user.email); // 邮箱必须匹配

    if (fetchError) {
      console.error('Error fetching quotes:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch quotes' 
      }, { status: 500 });
    }

    if (!quotes || quotes.length === 0) {
      return NextResponse.json({ 
        message: 'No guest quotes found to claim',
        claimedCount: 0
      }, { status: 200 });
    }

    // 批量更新所有游客报价
    const { error: updateError } = await supabase
      .from('pcb_quotes')
      .update({ 
        user_id: user.id,
        updated_at: new Date().toISOString()
      })
      .is('user_id', null)
      .eq('email', user.email);

    if (updateError) {
      console.error('Error claiming quotes:', updateError);
      return NextResponse.json({ 
        error: 'Failed to claim quotes' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully claimed ${quotes.length} quote(s)`,
      claimedCount: quotes.length
    }, { status: 200 });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Claim all quotes error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 