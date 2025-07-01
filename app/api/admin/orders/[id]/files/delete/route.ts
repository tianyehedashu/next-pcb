import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // 验证用户权限
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 检查管理员权限
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const orderId = params.id;
    const { searchParams } = new URL(request.url);
    const fileField = searchParams.get('field');

    if (!orderId || !fileField) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID and file field are required' 
      }, { status: 400 });
    }

    // 验证文件字段
    const allowedFileFields = [
      'gerber_file_url',
      'design_files_url',
      'bom_file_url',
      'placement_file_url',
      'stencil_file_url',
      'specification_file_url',
      'additional_files_url'
    ];

    if (!allowedFileFields.includes(fileField)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file field' 
      }, { status: 400 });
    }

    // 获取当前文件URL（用于删除存储文件）
    const { data: currentOrder } = await supabase
      .from('pcb_quotes')
      .select(fileField)
      .eq('id', orderId)
      .single();

    if (!currentOrder || !currentOrder[fileField]) {
      return NextResponse.json({ 
        success: false, 
        error: 'File not found' 
      }, { status: 404 });
    }

    const fileUrl = currentOrder[fileField];

    // 从存储中删除文件
    if (fileUrl) {
      // 提取文件路径
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // 确定存储桶
      let bucket = 'gerber'; // 默认
      if (fileField === 'stencil_file_url') {
        bucket = 'stencil';
      } else if (!fileField.includes('gerber') && !fileField.includes('design')) {
        bucket = 'documents';
      }

      // 删除存储文件
      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (deleteError) {
        console.warn('Failed to delete file from storage:', deleteError);
        // 继续执行数据库更新，即使存储删除失败
      }
    }

    // 更新数据库，清空文件字段
    const updateData = {
      [fileField]: null,
      last_file_update: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pcb_quotes')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete file record',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: data,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 