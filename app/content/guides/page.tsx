import React from 'react';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Eye, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Technical Guides | PCB Manufacturing Knowledge Center',
  description: 'Comprehensive PCB design and manufacturing guides, tutorials, and best practices.',
  openGraph: {
    title: 'Technical Guides | PCB Manufacturing Knowledge Center',
    description: 'Comprehensive PCB design and manufacturing guides, tutorials, and best practices.',
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

async function getGuides() {
  const supabase = await createSupabaseServerClient();
  
  const { data: guides, error } = await supabase
    .from('content_pages')
    .select(`
      *,
      category:content_categories(id, name, slug),
      author:profiles(id, company_name),
      tags:content_page_tags(tag:content_tags(id, name, slug, color))
    `)
    .eq('status', 'published')
    .eq('type', 'help')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching guides:', error);
    return [];
  }

  return guides?.map(guide => ({
    ...guide,
    tags: guide.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

async function getFeaturedGuides() {
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
    .eq('type', 'help')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(2);

  if (error) {
    console.error('Error fetching featured guides:', error);
    return [];
  }

  return featured?.map(guide => ({
    ...guide,
    tags: guide.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

export default async function GuidesPage() {
  const [guides, featuredGuides] = await Promise.all([
    getGuides(),
    getFeaturedGuides()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/content" 
            className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Center
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Technical Guides
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Master PCB design and manufacturing with our comprehensive technical guides, 
            best practices, and step-by-step tutorials.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {guides.length} Guides Available
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div>Updated Regularly</div>
          </div>
        </div>

        {/* Featured Guides */}
        {featuredGuides.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-yellow-500">⭐</span>
              Featured Guides
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredGuides.map((guide) => (
                <Link key={guide.id} href={`/content/${guide.slug}`} className="group">
                  <Card className="h-full hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-purple-100">
                    <div className="relative">
                      {guide.featured_image ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={guide.featured_image}
                            alt={guide.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={400}
                            height={192}
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <BookOpen className="text-white text-6xl opacity-50 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-yellow-500 text-white shadow-lg">⭐ Featured</Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {guide.title}
                      </h3>
                      {guide.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors">
                          {guide.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(guide.published_at || guide.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {guide.view_count}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="inline-flex items-center text-sm text-purple-600 font-medium">
                          Read Guide
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

        {/* All Guides */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Technical Guides</h2>
          {guides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <Link key={guide.id} href={`/content/${guide.slug}`} className="group block">
                  <Card className="h-full hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          Technical Guide
                        </Badge>
                        {guide.category && (
                          <Badge variant="outline" className="text-xs">
                            {guide.category.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-purple-600 transition-colors">
                        {guide.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {guide.featured_image && (
                        <Image
                          src={guide.featured_image}
                          alt={guide.title}
                          className="w-full h-32 object-cover rounded mb-3"
                          width={400}
                          height={128}
                        />
                      )}
                      
                      {guide.excerpt && (
                        <p className="text-gray-600 text-sm mb-3">
                          {truncateText(guide.excerpt, 120)}
                        </p>
                      )}

                      {/* Tags */}
                      {guide.tags && guide.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {guide.tags.slice(0, 3).map((tag: { id: string; name: string; color: string }) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color, color: 'white' }}
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {guide.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{guide.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(guide.published_at || guide.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {guide.view_count}
                          </div>
                        </div>
                        {guide.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {guide.author.company_name || 'Admin'}
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
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500 text-lg mb-4">No guides found</div>
              <p className="text-gray-400">
                Check back later for new technical guides and tutorials.
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Need Custom PCB Solutions?</h2>
            <p className="text-xl mb-8 opacity-90">
              Our technical experts are ready to help you with complex PCB design challenges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/quote2"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Get Technical Quote
              </Link>
              <Link
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-purple-600 transition-colors font-semibold"
              >
                Contact Technical Team
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 