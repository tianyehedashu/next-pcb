import React from 'react';
import { Metadata } from 'next';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User, Eye, FolderOpen, ArrowLeft, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'PCB Resources | Reference Materials & Tools',
  description: 'Essential PCB manufacturing resources, reference materials, templates, and downloadable tools.',
  openGraph: {
    title: 'PCB Resources | Reference Materials & Tools',
    description: 'Essential PCB manufacturing resources, reference materials, templates, and downloadable tools.',
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

async function getResources() {
  const supabase = await createSupabaseServerClient();
  
  const { data: resources, error } = await supabase
    .from('content_pages')
    .select(`
      *,
      category:content_categories(id, name, slug),
      author:profiles(id, company_name),
      tags:content_page_tags(tag:content_tags(id, name, slug, color))
    `)
    .eq('status', 'published')
    .eq('type', 'page')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error);
    return [];
  }

  return resources?.map(resource => ({
    ...resource,
    tags: resource.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

async function getFeaturedResources() {
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
    .eq('type', 'page')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(2);

  if (error) {
    console.error('Error fetching featured resources:', error);
    return [];
  }

  return featured?.map(resource => ({
    ...resource,
    tags: resource.tags?.map((tag: TagWrapper) => tag.tag) || []
  })) || [];
}

export default async function ResourcesPage() {
  const [resources, featuredResources] = await Promise.all([
    getResources(),
    getFeaturedResources()
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

  const getResourceType = (title: string, content: string) => {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerTitle.includes('template') || lowerContent.includes('template')) return 'Template';
    if (lowerTitle.includes('calculator') || lowerContent.includes('calculator')) return 'Calculator';
    if (lowerTitle.includes('guide') || lowerContent.includes('guide')) return 'Guide';
    if (lowerTitle.includes('spec') || lowerContent.includes('specification')) return 'Specification';
    if (lowerTitle.includes('terms') || lowerContent.includes('terms')) return 'Legal';
    return 'Resource';
  };

  const regularResources = resources.filter(resource => !resource.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link 
            href="/content" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Knowledge Center
          </Link>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <FolderOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            PCB Resources
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Access essential reference materials, templates, calculators, and tools 
            to streamline your PCB design and manufacturing process.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FolderOpen className="w-4 h-4" />
              {resources.length} Resources Available
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div>Free Downloads</div>
          </div>
        </div>

        {/* Resource Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Resource Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'Templates', icon: '📄', desc: 'Design templates', color: 'blue' },
              { type: 'Calculators', icon: '🧮', desc: 'Engineering tools', color: 'green' },
              { type: 'Specifications', icon: '📋', desc: 'Technical specs', color: 'purple' },
              { type: 'Legal', icon: '⚖️', desc: 'Terms & policies', color: 'gray' }
            ].map((category) => (
              <Card key={category.type} className={`hover:shadow-lg transition-shadow cursor-pointer border-2 border-${category.color}-100 bg-gradient-to-br from-${category.color}-50 to-${category.color}-100`}>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <h3 className={`font-semibold text-${category.color}-700`}>{category.type}</h3>
                  <p className={`text-xs text-${category.color}-600 mt-1`}>{category.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Resources */}
        {featuredResources.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-blue-500">⭐</span>
              Featured Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredResources.map((resource) => (
                <Link key={resource.id} href={`/content/${resource.slug}`} className="group">
                  <Card className="h-full hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-blue-200">
                    <div className="relative">
                      {resource.featured_image ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={resource.featured_image}
                            alt={resource.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            width={400}
                            height={192}
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                          <FolderOpen className="text-white text-6xl opacity-50 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-blue-500 text-white shadow-lg">⭐ Featured</Badge>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 text-blue-600 shadow-lg">
                          {getResourceType(resource.title, resource.content || '')}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {resource.title}
                      </h3>
                      {resource.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3 group-hover:text-gray-700 transition-colors">
                          {resource.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(resource.published_at || resource.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {resource.view_count}
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="inline-flex items-center text-sm text-blue-600 font-medium">
                          Access Resource
                          <ExternalLink className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Resources</h2>
          {regularResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularResources.map((resource) => (
                <Link key={resource.id} href={`/content/${resource.slug}`} className="group block">
                  <Card className="h-full hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {getResourceType(resource.title, resource.content || '')}
                        </Badge>
                        {resource.category && (
                          <Badge variant="outline" className="text-xs">
                            {resource.category.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-2">
                        {resource.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {resource.featured_image && (
                        <Image
                          src={resource.featured_image}
                          alt={resource.title}
                          className="w-full h-32 object-cover rounded mb-3"
                          width={400}
                          height={128}
                        />
                      )}
                      
                      {resource.excerpt && (
                        <p className="text-gray-600 text-sm mb-3">
                          {truncateText(resource.excerpt, 120)}
                        </p>
                      )}

                      {/* Tags */}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {resource.tags.slice(0, 3).map((tag: { id: string; name: string; color: string }) => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color, color: 'white' }}
                              className="text-xs"
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {resource.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{resource.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(resource.published_at || resource.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {resource.view_count}
                          </div>
                        </div>
                        {resource.author && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {resource.author.company_name || 'SpeedXPCB'}
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
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <div className="text-gray-500 text-lg mb-4">No resources found</div>
              <p className="text-gray-400">
                Check back later for new templates, tools, and reference materials.
              </p>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Need Custom Resources?</h2>
            <p className="text-xl mb-8 opacity-90">
              Can't find what you're looking for? Our team can create custom templates and tools for your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Request Custom Resource
              </Link>
              <Link
                href="/quote2"
                className="border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold"
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