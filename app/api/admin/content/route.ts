import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ContentPageFormData, ContentTag } from '@/types/content';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('content_pages')
      .select(`
        *,
        category:content_categories(id, name, slug),
        author:profiles(id, company_name),
        tags:content_page_tags(tag:content_tags(id, name, slug, color))
      `)
      .order('updated_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (category) {
      query = query.eq('category_id', category);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: pages, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching content pages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to flatten tags
    const transformedPages = pages?.map(page => ({
      ...page,
      tags: page.tags?.map((t: { tag: ContentTag }) => t.tag) || []
    }));

    return NextResponse.json({
      pages: transformedPages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const body: ContentPageFormData = await request.json();
    
    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { tag_ids, ...pageData } = body;

    // Create the page
    const { data: page, error: pageError } = await supabase
      .from('content_pages')
      .insert({
        ...pageData,
        author_id: user.id,
        published_at: pageData.status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (pageError) {
      console.error('Error creating page:', pageError);
      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tagId => ({
        page_id: page.id,
        tag_id: tagId
      }));

      const { error: tagError } = await supabase
        .from('content_page_tags')
        .insert(tagRelations);

      if (tagError) {
        console.error('Error adding tags:', tagError);
      }
    }

    return NextResponse.json({ page }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 