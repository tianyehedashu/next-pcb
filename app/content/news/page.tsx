import React from 'react';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Eye, Newspaper, ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Industry News | PCB Manufacturing Updates',
  description: 'Latest PCB industry news, market trends, technology updates, and company announcements.',
  openGraph: {
    title: 'Industry News | PCB Manufacturing Updates',
    description: 'Latest PCB industry news, market trends, technology updates, and company announcements.',
    type: 'website',
  },
};

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface TagWrapper {
  tag: Tag;
}

async function getNews() {
  const supabase = await createSupabaseServerClient();
  
  const { data: news, error } = await supabase
    .from('content_pages')
    .select(`
      *,
      category:content_categories(id, name, slug),
      author:profiles(id, company_name),
      tags:content_page_tags(tag:content_tags(id, name, slug, color))
    `)
    .eq('status', 'published')
    .eq('type', 'news')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching news:', error);
    return [];
  }

  return news?.map(article => ({
    ...article,
    tags: article.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

async function getFeaturedNews() {
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
    .eq('type', 'news')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching featured news:', error);
    return [];
  }

  return featured?.map(article => ({
    ...article,
    tags: article.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

export default async function NewsPage() {
  const [news, featuredNews] = await Promise.all([
    getNews(),
    getFeaturedNews()
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return formatDate(dateString);
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const regularNews = news.filter(article => !article.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/content" 
            className="inline-flex items-center text-orange-600 hover:text-orange-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Center
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-6">
            <Newspaper className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Industry News
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Stay updated with the latest PCB industry trends, technology breakthroughs, 
            market insights, and SpeedXPCB company announcements.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {news.length} News Articles
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div>Updated Daily</div>
          </div>
        </div>

        {/* Featured News */}
        {featuredNews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-red-500">🔥</span>
              Breaking News
            </h2>
            {featuredNews.map((article) => (
              <Link key={article.id} href={`/content/${article.slug}`} className="group block">
                <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-orange-200">
                  <div className="md:flex">
                    <div className="md:w-1/2 relative">
                      {article.featured_image ? (
                        <div className="relative h-64 md:h-full overflow-hidden">
                          <Image
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={600}
                            height={400}
                          />
                        </div>
                      ) : (
                        <div className="h-64 md:h-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          <Newspaper className="text-white text-8xl opacity-50 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-red-500 text-white shadow-lg">🔥 Breaking</Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="md:w-1/2 p-8">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-orange-100 text-orange-800 text-sm">
                          Industry News
                        </Badge>
                        <span className="text-sm text-orange-600 font-medium">
                          {getTimeAgo(article.published_at || article.created_at)}
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 text-lg mb-6 group-hover:text-gray-700 transition-colors">
                          {truncateText(article.excerpt, 200)}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {article.view_count}
                          </div>
                          {article.author && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {article.author.company_name || 'SpeedXPCB'}
                            </div>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="inline-flex items-center text-orange-600 font-medium">
                            Read Full Story
                            <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Recent News */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent News</h2>
          {regularNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularNews.map((article) => (
                <Link key={article.id} href={`/content/${article.slug}`} className="group block">
                  <Card className="h-full hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      {article.featured_image ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={400}
                            height={192}
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                          <Newspaper className="text-white text-6xl opacity-50 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-orange-500 text-white shadow-lg text-xs">
                          {getTimeAgo(article.published_at || article.created_at)}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Industry News
                        </Badge>
                        {article.category && (
                          <Badge variant="outline" className="text-xs">
                            {article.category.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {truncateText(article.excerpt, 120)}
                        </p>
                      )}

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {article.tags.slice(0, 2).map((tag: { id: string; name: string; color: string }) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color, color: 'white' }}
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {article.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{article.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.view_count}
                        </div>
                        {article.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {article.author.company_name || 'SpeedXPCB'}
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
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500 text-lg mb-4">No news articles found</div>
              <p className="text-gray-400">
                Check back later for the latest industry updates and company news.
              </p>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Informed</h2>
            <p className="text-xl mb-8 opacity-90">
              Get the latest PCB industry news and SpeedXPCB updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Subscribe to Newsletter
              </Link>
              <Link
                href="/quote2"
                className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-orange-600 transition-colors font-semibold"
              >
                Get PCB Quote
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 