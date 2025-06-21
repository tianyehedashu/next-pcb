import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import type { ContentPage } from '@/types/content';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, User, Eye, Tag, ArrowLeft, Share2, Bookmark, Download } from 'lucide-react';
import Link from 'next/link';
import { cache } from 'react';
import Image from 'next/image';
import MarkdownPreview from '@/app/components/custom-ui/MarkdownPreview';

interface PageProps {
  params: Promise<{ slug: string }>;
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
    tags: page.tags?.map((relation: { tag: unknown }) => relation.tag) || [],
  };

  // Increment view count
  await supabase
    .from('content_pages')
    .update({ view_count: page.view_count + 1 })
    .eq('id', page.id);

  return transformedPage;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  
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
  const { slug } = await params;
  const page = await getPage(slug);

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



  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Navigation */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/content">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Knowledge Center
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  page.type === 'help' ? 'bg-purple-500 text-white' :
                  page.type === 'news' ? 'bg-orange-500 text-white' :
                  page.type === 'post' ? 'bg-green-500 text-white' :
                  'bg-blue-500 text-white'
                }`}>
                  {page.type === 'help' ? '📚 Help Guide' :
                   page.type === 'news' ? '📰 Industry News' :
                   page.type === 'post' ? '✍️ Article' :
                   '📄 Resource'}
                </span>
                {page.category && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    📁 {page.category.name}
                  </Badge>
                )}
                {page.is_featured && (
                  <Badge className="bg-yellow-500 text-white border-0">
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {page.title}
              </h1>

              {/* Excerpt */}
              {page.excerpt && (
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  {page.excerpt}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-blue-100">
                {page.author && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>By {page.author.company_name || 'SpeedXPCB Team'}</span>
                  </div>
                )}
                
                {page.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(page.published_at)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{page.view_count} views</span>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            {page.featured_image && (
              <div className="lg:col-span-1">
                <div className="relative">
                  <Image
                    src={page.featured_image}
                    alt={page.title}
                    width={400}
                    height={300}
                    className="w-full h-64 object-cover rounded-xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-xl border-0 overflow-hidden">
              {/* Action Bar */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Reading time: ~{Math.ceil(page.content.length / 1000)} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bookmark className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-0">
                {/* Article Body */}
                <div className="p-8 lg:p-12">
                  <MarkdownPreview 
                    content={page.content}
                    title={page.title}
                    excerpt={page.excerpt}
                    type={page.type}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tags Section */}
            {page.tags && page.tags.length > 0 && (
              <Card className="mt-8 shadow-lg border-0">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Related Topics</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {page.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color, color: 'white' }}
                        className="px-3 py-1 text-sm"
                      >
                        #{tag.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500">
              <CardContent className="p-6">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                  🚀 Take Action
                </h3>
                <div className="space-y-3">
                  <Link href="/quote2" className="block">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg">
                      Get PCB Quote
                    </Button>
                  </Link>
                  <Link href="/contact" className="block">
                    <Button variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                      Contact Expert
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="shadow-lg border-0">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  🧭 Explore More
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/content"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    📚 Browse All Resources
                  </Link>
                  {page.category && (
                    <Link
                      href={`/content?category=${page.category.id}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                    >
                      📁 More in {page.category.name}
                    </Link>
                  )}
                  <Link
                    href={`/content?type=${page.type}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                  >
                    🏷️ Similar {page.type === 'help' ? 'Guides' : page.type === 'news' ? 'News' : page.type === 'post' ? 'Articles' : 'Resources'}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-green-500">
              <CardContent className="p-6">
                <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  💬 Need Help?
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  Our PCB experts are here to help with your questions.
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-green-600">
                    📞 +1-555-PCB-HELP
                  </div>
                  <div className="text-xs text-green-600">
                    ✉️ support@speedxpcb.com
                  </div>
                  <div className="text-xs text-green-600">
                    🕒 24/7 Expert Support
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust Signals */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold text-purple-900 mb-3">
                  🏆 Industry Leader
                </h3>
                <div className="space-y-2 text-xs text-purple-700">
                  <div>✓ 50,000+ Happy Customers</div>
                  <div>✓ ISO 9001:2015 Certified</div>
                  <div>✓ 99.8% Quality Rate</div>
                  <div>✓ 24hr Fast Turnaround</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 