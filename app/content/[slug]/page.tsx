import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ContentPage } from '@/types/content';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, Eye, Tag } from 'lucide-react';
import Link from 'next/link';
import { cache } from 'react';

interface PageProps {
  params: { slug: string };
}

export const revalidate = 3600; // revalidate at most every hour

const getPage = cache(async (slug: string): Promise<ContentPage | null> => {
  const supabase = await createSupabaseServerClient();
  
  const { data: page, error } = await supabase
    .from('content_pages')
    .select(`
      *,
      category:content_categories(id, name, slug),
      author:profiles(id, company_name),
      tags:content_page_tags(tag:content_tags(id, name, slug, color))
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !page) {
    return null;
  }

  // Transform tags
  const transformedPage = {
    ...page,
    tags: page.tags?.map((tag: any) => tag.tag) || []
  };

  // Increment view count
  await supabase
    .from('content_pages')
    .update({ view_count: page.view_count + 1 })
    .eq('id', page.id);

  return transformedPage;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await getPage(params.slug);
  
  if (!page) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found.',
    };
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.excerpt || page.title,
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || page.excerpt || page.title,
      type: 'article',
      publishedTime: page.published_at || undefined,
      authors: page.author?.company_name ? [page.author.company_name] : undefined,
      images: page.featured_image ? [page.featured_image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.meta_title || page.title,
      description: page.meta_description || page.excerpt || page.title,
      images: page.featured_image ? [page.featured_image] : undefined,
    },
  };
}

export default async function ContentPage({ params }: PageProps) {
  const page = await getPage(params.slug);

  if (!page) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      page: 'bg-blue-100 text-blue-800',
      post: 'bg-green-100 text-green-800',
      news: 'bg-orange-100 text-orange-800',
      help: 'bg-purple-100 text-purple-800'
    } as const;
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Check if content is HTML (from rich text editor) or Markdown
  const isHtmlContent = (content: string) => {
    return content.includes('<') && content.includes('>');
  };

  // Convert markdown-style content to basic HTML
  const formatContent = (content: string) => {
    if (isHtmlContent(content)) {
      return content; // Already HTML from rich text editor
    }
    
    // Convert Markdown to HTML
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-semibold mb-2">$1</h3>');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(page.type)}`}>
              {page.type.charAt(0).toUpperCase() + page.type.slice(1)}
            </span>
            {page.category && (
              <Badge variant="outline">{page.category.name}</Badge>
            )}
            {page.is_featured && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Featured
              </Badge>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {page.title}
          </h1>
          
          {page.excerpt && (
            <p className="text-xl text-gray-600 mb-6">
              {page.excerpt}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-b border-gray-200 pb-6">
            {page.author && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>By {page.author.company_name || 'Admin'}</span>
              </div>
            )}
            
            {page.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Published {formatDate(page.published_at)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{page.view_count} views</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                {page.featured_image && (
                  <img
                    src={page.featured_image}
                    alt={page.title}
                    className="w-full h-64 object-cover rounded-lg mb-8"
                  />
                )}
                
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: isHtmlContent(page.content) 
                      ? page.content 
                      : `<p>${formatContent(page.content)}</p>` 
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {page.tags && page.tags.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4" />
                    <h3 className="font-semibold">Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {page.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color, color: 'white' }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">More Content</h3>
                <div className="space-y-2">
                  <Link
                    href="/content"
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Browse All Content
                  </Link>
                  {page.category && (
                    <Link
                      href={`/content/category/${page.category.slug}`}
                      className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      More in {page.category.name}
                    </Link>
                  )}
                  <Link
                    href="/contact"
                    className="block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Contact Us
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/quote2"
                    className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Get PCB Quote
                  </Link>
                  <Link
                    href="/contact"
                    className="block w-full border border-gray-300 text-gray-700 text-center py-2 px-4 rounded hover:bg-gray-50 transition-colors text-sm"
                  >
                    Contact Support
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 