import { createClient } from '@/utils/supabase/server';
import { checkAdminAuth } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const pageSize = 10;

    const supabase = await createClient();

    // 构建查询
    let query = supabase
      .from("pcb_quotes")
      .select("*", { count: "exact" })
      .is("user_id", null);

    // 添加状态筛选
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 添加搜索条件 - 修复UUID查询问题
    if (search) {
      // 先尝试UUID搜索
      const { data: matchingIds } = await supabase
        .rpc('search_orders_by_uuid', { search_text: search });
      
      if (matchingIds && matchingIds.length > 0) {
        // 如果找到匹配的UUID，组合UUID、email、phone查询
        const uuidList = matchingIds.map((item: { id: string }) => item.id);
        query = query.or(`id.in.(${uuidList.join(',')}),email.ilike.%${search}%,phone.ilike.%${search}%`);
      } else {
        // 如果没有匹配的UUID，只搜索email和phone
        query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
    }

    // 添加分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // 按创建时间降序排序
    query = query.order("created_at", { ascending: false });

    const { data: quotes, error: queryError, count } = await query;

    if (queryError) {
      console.error("Error fetching quotes:", queryError);
      return NextResponse.json(
        { error: "Failed to fetch quotes" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return NextResponse.json({
      quotes,
      totalPages,
      currentPage: page,
      totalCount: count
    });
  } catch (error) {
    console.error("Error in quotes API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 