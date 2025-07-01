// 管理员文件审核状态更新API
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';

// 允许的文件字段白名单
const ALLOWED_FILE_FIELDS = [
  'gerber_file_url',
  'design_files_url', 
  'bom_file_url',
  'placement_file_url',
  'stencil_file_url',
  'specification_file_url',
  'additional_files_url'
];

// 允许的审核状态
const ALLOWED_REVIEW_STATUSES = ['approved', 'rejected', 'pending'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const { user, error: authError } = await checkAdminAuth();
    if (authError || !user) return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = await createSupabaseServerClient();

    const orderId = params.id;
    const { fileField, reviewStatus } = await request.json();

    // 验证请求参数
    if (!fileField || !reviewStatus) {
      return NextResponse.json(
        { error: 'fileField and reviewStatus are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_FIELDS.includes(fileField)) {
      return NextResponse.json(
        { error: 'Invalid file field' },
        { status: 400 }
      );
    }

    if (!ALLOWED_REVIEW_STATUSES.includes(reviewStatus)) {
      return NextResponse.json(
        { error: 'Invalid review status' },
        { status: 400 }
      );
    }

    // 获取当前订单信息
    const { data: order, error: fetchError } = await supabase
      .from('pcb_quotes')
      .select('file_metadata')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 更新文件元数据中的审核状态
    const currentMetadata = order.file_metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      [fileField]: {
        ...currentMetadata[fileField],
        reviewStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id
      }
    };

    // 更新数据库
    const { error: updateError } = await supabase
      .from('pcb_quotes')
      .update({
        file_metadata: updatedMetadata,
        last_file_update: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('File status update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update file status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File review status updated successfully',
      data: {
        fileField,
        reviewStatus,
        reviewedAt: updatedMetadata[fileField].reviewedAt,
        reviewedBy: user.id
      }
    });

  } catch (error) {
    console.error('File review API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 