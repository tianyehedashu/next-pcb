import React from 'react';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';
// Remove unused imports - types are inferred from the data structure
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, Eye, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Knowledge Center | SpeedXPCB',
  description: 'Comprehensive PCB manufacturing guides, tutorials, and industry insights.',
  openGraph: {
    title: 'Knowledge Center | SpeedXPCB',
    description: 'Comprehensive PCB manufacturing guides, tutorials, and industry insights.',
    type: 'website',
  },
};

interface ContentListProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    type?: string;
    page?: string;
  }>;
}

// 添加类型接口
interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface TagWrapper {
  tag: Tag;
}

async function getContent(searchParams: {
  search?: string;
  category?: string;
  type?: string;
  page?: string;
}) {
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
    tags: page.tags?.map((tag: TagWrapper) => tag.tag) || []
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
    tags: page.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

export default async function ContentListPage({ searchParams }: ContentListProps) {
  const resolvedSearchParams = await searchParams;
  const [pages, categories, featuredContent] = await Promise.all([
    getContent(resolvedSearchParams),
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 pt-20 md:pt-24 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section - Simplified */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            PCB Knowledge Center
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Your comprehensive resource for PCB manufacturing insights, design guides, and industry expertise.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-12 border-2 border-gray-100 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Search & Filter</h3>
              <Badge variant="outline" className="ml-auto">
                {pages.length} Articles
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search articles..."
                  defaultValue={resolvedSearchParams.search}
                  className="pl-10"
                />
              </div>
              
              <Select defaultValue={resolvedSearchParams.category || 'all'}>
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

              <Select defaultValue={resolvedSearchParams.type || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="help">Help & Guides</SelectItem>
                  <SelectItem value="news">Industry News</SelectItem>
                  <SelectItem value="post">Articles</SelectItem>
                  <SelectItem value="page">Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'help', icon: '📚', name: 'Help & Guides', desc: 'Technical documentation', color: 'purple' },
              { type: 'news', icon: '📰', name: 'Industry News', desc: 'Latest updates', color: 'orange' },
              { type: 'post', icon: '✍️', name: 'Articles', desc: 'In-depth insights', color: 'green' },
              { type: 'page', icon: '📄', name: 'Resources', desc: 'Reference materials', color: 'blue' }
            ].map((item) => (
              <Link key={item.type} href={`/content?type=${item.type}`} className="group">
                <Card className={`hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-${item.color}-200 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h3 className={`font-bold text-${item.color}-700 group-hover:text-${item.color}-800`}>
                      {item.name}
                    </h3>
                    <p className={`text-xs text-${item.color}-600 mt-1`}>{item.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Content */}
        {featuredContent.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredContent.map((page) => (
                <Link key={page.id} href={`/content/${page.slug}`} className="group">
                  <Card className="h-full hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden">
                    <div className="relative">
                      {page.featured_image ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={page.featured_image}
                            alt={page.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={400}
                            height={192}
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <div className="text-white text-6xl opacity-50">📄</div>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-yellow-500 text-white">⭐ Featured</Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {page.title}
                      </h3>
                      {page.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {page.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(page.published_at || page.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {page.view_count}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Articles Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Articles</h2>
          {pages.length > 0 ? (
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
                      <Image
                        src={page.featured_image}
                        alt={page.title}
                        className="w-full h-32 object-cover rounded mb-3"
                        width={400}
                        height={128}
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
                        {page.tags.slice(0, 3).map((tag: { id: string; name: string; color: string }) => (
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
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-4">No content found</div>
              <p className="text-gray-400">
                Try adjusting your search criteria or check back later for new articles.
              </p>
            </div>
          )}
        </div>

        {/* Call to Action - Simplified */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your PCB Project?</h2>
            <p className="text-xl mb-8 opacity-90">
              Get instant quotes and professional guidance for your PCB manufacturing needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote2"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Get PCB Quote
              </Link>
              <Link
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
              >
                Contact Us
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 