import React from 'react';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';
// Remove unused imports - types are inferred from the data structure
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Eye, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ContentFilters } from './components/ContentFilters';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
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

        {/* Category Navigation */}
        <div className="mb-12">
          <Card className="border-2 border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Explore by Category</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { 
                    href: '/content/guides', 
                    name: 'Technical Guides', 
                    icon: '📚', 
                    count: pages.filter(p => p.type === 'help').length,
                    bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100',
                    hoverClass: 'hover:border-purple-200',
                    textClass: 'text-purple-700',
                    hoverTextClass: 'group-hover:text-purple-800',
                    countClass: 'text-purple-600'
                  },
                  { 
                    href: '/content/news', 
                    name: 'Industry News', 
                    icon: '📰', 
                    count: pages.filter(p => p.type === 'news').length,
                    bgClass: 'bg-gradient-to-br from-orange-50 to-orange-100',
                    hoverClass: 'hover:border-orange-200',
                    textClass: 'text-orange-700',
                    hoverTextClass: 'group-hover:text-orange-800',
                    countClass: 'text-orange-600'
                  },
                  { 
                    href: '/content/articles', 
                    name: 'In-Depth Articles', 
                    icon: '✍️', 
                    count: pages.filter(p => p.type === 'post').length,
                    bgClass: 'bg-gradient-to-br from-green-50 to-green-100',
                    hoverClass: 'hover:border-green-200',
                    textClass: 'text-green-700',
                    hoverTextClass: 'group-hover:text-green-800',
                    countClass: 'text-green-600'
                  },
                  { 
                    href: '/content/resources', 
                    name: 'Resources', 
                    icon: '📄', 
                    count: pages.filter(p => p.type === 'page').length,
                    bgClass: 'bg-gradient-to-br from-blue-50 to-blue-100',
                    hoverClass: 'hover:border-blue-200',
                    textClass: 'text-blue-700',
                    hoverTextClass: 'group-hover:text-blue-800',
                    countClass: 'text-blue-600'
                  }
                ].map((cat) => (
                  <Link key={cat.href} href={cat.href} className="group">
                    <div className={`p-3 rounded-lg border-2 border-transparent ${cat.hoverClass} ${cat.bgClass} transition-all duration-300 hover:shadow-md text-center`}>
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <div className={`text-sm font-medium ${cat.textClass} ${cat.hoverTextClass}`}>
                        {cat.name}
                      </div>
                      <div className={`text-xs ${cat.countClass} mt-1`}>
                        {cat.count} items
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
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
            
            <ContentFilters categories={categories} />
          </CardContent>
        </Card>

        {/* Quick Access Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { 
                type: 'help', 
                icon: '📚', 
                name: 'Help & Guides', 
                desc: 'Technical documentation', 
                bgClass: 'bg-gradient-to-br from-purple-50 to-purple-100',
                hoverBorderClass: 'hover:border-purple-200',
                textClass: 'text-purple-700',
                hoverTextClass: 'group-hover:text-purple-800',
                descClass: 'text-purple-600',
                count: pages.filter(page => page.type === 'help').length
              },
              { 
                type: 'news', 
                icon: '📰', 
                name: 'Industry News', 
                desc: 'Latest updates', 
                bgClass: 'bg-gradient-to-br from-orange-50 to-orange-100',
                hoverBorderClass: 'hover:border-orange-200',
                textClass: 'text-orange-700',
                hoverTextClass: 'group-hover:text-orange-800',
                descClass: 'text-orange-600',
                count: pages.filter(page => page.type === 'news').length
              },
              { 
                type: 'post', 
                icon: '✍️', 
                name: 'Articles', 
                desc: 'In-depth insights', 
                bgClass: 'bg-gradient-to-br from-green-50 to-green-100',
                hoverBorderClass: 'hover:border-green-200',
                textClass: 'text-green-700',
                hoverTextClass: 'group-hover:text-green-800',
                descClass: 'text-green-600',
                count: pages.filter(page => page.type === 'post').length
              },
              { 
                type: 'page', 
                icon: '📄', 
                name: 'Resources', 
                desc: 'Reference materials', 
                bgClass: 'bg-gradient-to-br from-blue-50 to-blue-100',
                hoverBorderClass: 'hover:border-blue-200',
                textClass: 'text-blue-700',
                hoverTextClass: 'group-hover:text-blue-800',
                descClass: 'text-blue-600',
                count: pages.filter(page => page.type === 'page').length
              }
            ].map((item) => (
              <Link key={item.type} href={`/content/${item.type === 'help' ? 'guides' : item.type === 'post' ? 'articles' : item.type === 'page' ? 'resources' : item.type}`} className="group block">
                <Card className={`hover:shadow-xl hover:shadow-black/10 hover:scale-105 active:scale-100 transition-all duration-300 border-2 border-transparent ${item.hoverBorderClass} ${item.bgClass} cursor-pointer relative overflow-hidden`}>
                  {/* Hover overlay effect */}
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Count badge */}
                  <div className="absolute top-3 right-3 z-20">
                    <Badge className={`${item.textClass} bg-white/90 text-xs font-bold px-2 py-1`}>
                      {item.count}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6 text-center relative z-10">
                    <div className="text-4xl mb-3 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      {item.icon}
                    </div>
                    <h3 className={`font-bold text-lg ${item.textClass} ${item.hoverTextClass} transition-colors duration-300`}>
                      {item.name}
                    </h3>
                    <p className={`text-sm ${item.descClass} mt-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300`}>
                      {item.desc}
                    </p>
                    
                    {/* Arrow indicator */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className={`inline-flex items-center text-xs ${item.textClass} font-medium`}>
                        Explore
                        <svg className="ml-1 w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
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
                          <div className="text-white text-6xl opacity-50 group-hover:scale-110 transition-transform duration-300">📄</div>
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-yellow-500 text-white shadow-lg">⭐ Featured</Badge>
                      </div>
                      
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {page.title}
                      </h3>
                      {page.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors">
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
                      
                      {/* Read more indicator */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="inline-flex items-center text-sm text-blue-600 font-medium">
                          Read Article
                          <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
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
                <Link key={page.id} href={`/content/${page.slug}`} className="group block">
                  <Card className="h-full hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer">
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
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                        {page.title}
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
                </Link>
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