import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ContentPageFormData } from '@/types/content';
import { checkAdminAuth } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    const { data: page, error } = await supabase
      .from('content_pages')
      .select(`
        *,
        category:content_categories(id, name, slug),
        author:profiles(id, company_name),
        tags:content_page_tags(tag:content_tags(id, name, slug, color))
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform tags
    const transformedPage = {
      ...page,
      tags: page.tags?.map((tag: any) => tag.tag) || []
    };

    return NextResponse.json({ page: transformedPage });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;
    const body: ContentPageFormData = await request.json();

    const { tag_ids, ...pageData } = body;

    // Update the page
    const { data: page, error: pageError } = await supabase
      .from('content_pages')
      .update({
        ...pageData,
        category_id: pageData.category_id || null,
        published_at: pageData.status === 'published' && !pageData.published_at 
          ? new Date().toISOString() 
          : pageData.published_at
      })
      .eq('id', id)
      .select()
      .single();

    if (pageError) {
      console.error('Error updating page:', pageError);
      return NextResponse.json({ error: pageError.message }, { status: 500 });
    }

    // Update tags
    // First, delete existing tag relations
    await supabase
      .from('content_page_tags')
      .delete()
      .eq('page_id', id);

    // Then add new tag relations
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tagId => ({
        page_id: id,
        tag_id: tagId
      }));

      const { error: tagError } = await supabase
        .from('content_page_tags')
        .insert(tagRelations);

      if (tagError) {
        console.error('Error updating tags:', tagError);
      }
    }

    return NextResponse.json({ page });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check admin authentication
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const supabase = await createSupabaseServerClient();
    const { id } = await params;

    // Delete the page (tags will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('content_pages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting page:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Page deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 