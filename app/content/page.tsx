import React from 'react';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ContentPage, ContentCategory } from '@/types/content';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Eye, Tag, Search } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Content Hub | SpeedXPCB',
  description: 'Browse our collection of articles, guides, and resources about PCB manufacturing and design.',
  openGraph: {
    title: 'Content Hub | SpeedXPCB',
    description: 'Browse our collection of articles, guides, and resources about PCB manufacturing and design.',
    type: 'website',
  },
};

interface ContentListProps {
  searchParams: {
    search?: string;
    category?: string;
    type?: string;
    page?: string;
  };
}

async function getContent(searchParams: ContentListProps['searchParams']) {
  const supabase = await createSupabaseServerClient();
  
  let query = supabase
    .from('content_pages')
    .select(`
      *,
      category:content_categories(id, name, slug),
      author:profiles(id, company_name),
      tags:content_page_tags(tag:content_tags(id, name, slug, color))
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // Apply filters
  if (searchParams.search) {
    query = query.ilike('title', `%${searchParams.search}%`);
  }
  
  if (searchParams.category) {
    query = query.eq('category_id', searchParams.category);
  }
  
  if (searchParams.type) {
    query = query.eq('type', searchParams.type);
  }

  const { data: pages, error } = await query;

  if (error) {
    console.error('Error fetching content:', error);
    return [];
  }

  // Transform the data to flatten tags
  return pages?.map(page => ({
    ...page,
    tags: page.tags?.map((tag: any) => tag.tag) || []
  })) || [];
}

async function getCategories() {
  const supabase = await createSupabaseServerClient();
  
  const { data: categories, error } = await supabase
    .from('content_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories || [];
}

async function getFeaturedContent() {
  const supabase = await createSupabaseServerClient();
  
  const { data: featured, error } = await supabase
    .from('content_pages')
    .select(`
      *,
      category:content_categories(id, name, slug),
      author:profiles(id, company_name),
      tags:content_page_tags(tag:content_tags(id, name, slug, color))
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching featured content:', error);
    return [];
  }

  return featured?.map(page => ({
    ...page,
    tags: page.tags?.map((tag: any) => tag.tag) || []
  })) || [];
}

export default async function ContentListPage({ searchParams }: ContentListProps) {
  const [pages, categories, featuredContent] = await Promise.all([
    getContent(searchParams),
    getCategories(),
    getFeaturedContent()
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Content Hub
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover insights, guides, and resources about PCB manufacturing, design best practices, and industry trends.
          </p>
        </div>

        {/* Featured Content */}
        {featuredContent.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Content</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredContent.map((page) => (
                <Card key={page.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(page.type)}`}>
                        {page.type.charAt(0).toUpperCase() + page.type.slice(1)}
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Featured
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">
                      <Link 
                        href={`/content/${page.slug}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {page.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {page.excerpt && (
                      <p className="text-gray-600 text-sm mb-3">
                        {truncateText(page.excerpt, 120)}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(page.published_at || page.created_at)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="w-3 h-3" />
                        {page.view_count}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search content..."
                  defaultValue={searchParams.search}
                  className="pl-10"
                />
              </div>
              
              <Select defaultValue={searchParams.category || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select defaultValue={searchParams.type || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="page">Pages</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="help">Help</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-gray-500 flex items-center">
                {pages.length} articles found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/content?category=${category.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(page.type)}`}>
                    {page.type.charAt(0).toUpperCase() + page.type.slice(1)}
                  </span>
                  {page.category && (
                    <Badge variant="outline" className="text-xs">
                      {page.category.name}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">
                  <Link 
                    href={`/content/${page.slug}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {page.title}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {page.featured_image && (
                  <img
                    src={page.featured_image}
                    alt={page.title}
                    className="w-full h-32 object-cover rounded mb-3"
                  />
                )}
                
                {page.excerpt && (
                  <p className="text-gray-600 text-sm mb-3">
                    {truncateText(page.excerpt, 120)}
                  </p>
                )}

                {/* Tags */}
                {page.tags && page.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {page.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        style={{ backgroundColor: tag.color, color: 'white' }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {page.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{page.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(page.published_at || page.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {page.view_count}
                    </div>
                  </div>
                  {page.author && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {page.author.company_name || 'Admin'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {pages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No content found</div>
            <p className="text-gray-400">
              Try adjusting your search criteria or browse all categories.
            </p>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Get instant quotes for your PCB projects and experience our fast, reliable manufacturing service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote2"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get PCB Quote
            </Link>
            <Link
              href="/contact"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 