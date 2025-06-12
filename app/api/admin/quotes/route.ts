import { createSupabaseServerClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const pageSize = 10;

    const supabase = createSupabaseServerClient();

    // 构建查询
    let query = supabase
      .from("pcb_quotes")
      .select("*", { count: "exact" });

    // 添加状态筛选
    if (status !== "all") {
      query = query.eq("status", status);
    }

    // 添加搜索条件
    if (search) {
      query = query.or(`id.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // 添加分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // 按创建时间降序排序
    query = query.order("created_at", { ascending: false });

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error("Error fetching quotes:", error);
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