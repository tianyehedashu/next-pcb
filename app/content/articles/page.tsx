import React from 'react';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Eye, FileText, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'In-Depth Articles | PCB Manufacturing Insights',
  description: 'Comprehensive analysis, research insights, and detailed explorations of PCB manufacturing topics.',
  openGraph: {
    title: 'In-Depth Articles | PCB Manufacturing Insights',
    description: 'Comprehensive analysis, research insights, and detailed explorations of PCB manufacturing topics.',
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

async function getArticles() {
  const supabase = await createSupabaseServerClient();
  
  const { data: articles, error } = await supabase
    .from('content_pages')
    .select(`
      *,
      category:content_categories(id, name, slug),
      author:profiles(id, company_name),
      tags:content_page_tags(tag:content_tags(id, name, slug, color))
    `)
    .eq('status', 'published')
    .eq('type', 'post')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }

  return articles?.map(article => ({
    ...article,
    tags: article.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

async function getFeaturedArticles() {
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
    .eq('type', 'post')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching featured articles:', error);
    return [];
  }

  return featured?.map(article => ({
    ...article,
    tags: article.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

export default async function ArticlesPage() {
  const [articles, featuredArticles] = await Promise.all([
    getArticles(),
    getFeaturedArticles()
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const readingTime = Math.ceil(wordCount / wordsPerMinute);
    return readingTime;
  };

  const regularArticles = articles.filter(article => !article.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/content" 
            className="inline-flex items-center text-green-600 hover:text-green-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Center
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            In-Depth Articles
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Explore comprehensive analysis, research insights, and detailed explorations 
            of advanced PCB manufacturing topics and industry trends.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {articles.length} Articles
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div>Expert Analysis</div>
          </div>
        </div>

        {/* Featured Article */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-green-500">⭐</span>
              Featured Article
            </h2>
            {featuredArticles.map((article) => (
              <Link key={article.id} href={`/content/${article.slug}`} className="group block">
                <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-green-200">
                  <div className="md:flex">
                    <div className="md:w-2/5 relative">
                      {article.featured_image ? (
                        <div className="relative h-64 md:h-full overflow-hidden">
                          <Image
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={500}
                            height={400}
                          />
                        </div>
                      ) : (
                        <div className="h-64 md:h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <FileText className="text-white text-8xl opacity-50 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-green-500 text-white shadow-lg">⭐ Featured</Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="md:w-3/5 p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-green-100 text-green-800">
                          In-Depth Analysis
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {estimateReadingTime(article.content || article.excerpt || '')} min read
                        </div>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 text-lg mb-6 group-hover:text-gray-700 transition-colors">
                          {truncateText(article.excerpt, 250)}
                        </p>
                      )}
                      
                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {article.tags.slice(0, 3).map((tag: { id: string; name: string; color: string }) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color, color: 'white' }}
                              className="text-sm"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(article.published_at || article.created_at)}
                          </div>
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
                          <div className="inline-flex items-center text-green-600 font-medium">
                            Read Article
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

        {/* All Articles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Articles</h2>
          {regularArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {regularArticles.map((article) => (
                <Link key={article.id} href={`/content/${article.slug}`} className="group block">
                  <Card className="h-full hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer">
                    <div className="relative">
                      {article.featured_image ? (
                        <div className="relative h-56 overflow-hidden">
                          <Image
                            src={article.featured_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={500}
                            height={224}
                          />
                        </div>
                      ) : (
                        <div className="h-56 bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                          <FileText className="text-white text-7xl opacity-50 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-green-100 text-green-800 text-sm">
                          Article
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {estimateReadingTime(article.content || article.excerpt || '')} min read
                        </div>
                        {article.category && (
                          <Badge variant="outline" className="text-sm">
                            {article.category.name}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-4">
                          {truncateText(article.excerpt, 180)}
                        </p>
                      )}

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {article.tags.slice(0, 3).map((tag: { id: string; name: string; color: string }) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color, color: 'white' }}
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{article.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(article.published_at || article.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {article.view_count}
                          </div>
                        </div>
                        {article.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
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
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500 text-lg mb-4">No articles found</div>
              <p className="text-gray-400">
                Check back later for new in-depth analysis and insights.
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Explore Advanced PCB Solutions</h2>
            <p className="text-xl mb-8 opacity-90">
              Ready to apply these insights to your next PCB project? Get expert consultation and custom solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote2"
                className="bg-white text-green-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Get Expert Quote
              </Link>
              <Link
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-green-600 transition-colors font-semibold"
              >
                Consult Our Experts
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 