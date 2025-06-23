import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // 创建 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 检查表结构
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'contacts' })
      .select();

    if (columnsError) {
      console.log('Columns error (expected if function does not exist):', columnsError);
    }

    // 测试插入权限
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      company: 'Test Company',
      project_type: 'prototype',
      message: 'This is a test message',
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('contacts')
      .insert([testData])
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Insert test failed',
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        testData,
      });
    }

    // 如果插入成功，立即删除测试数据
    if (insertResult && insertResult.length > 0) {
      await supabase
        .from('contacts')
        .delete()
        .eq('id', insertResult[0].id);
    }

    return NextResponse.json({
      success: true,
      message: 'Contact table is working correctly',
      insertedData: insertResult,
    });

  } catch (error) {
    console.error('Test contact table error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during table test', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 