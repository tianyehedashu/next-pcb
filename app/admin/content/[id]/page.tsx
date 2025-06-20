"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentPage, ContentCategory, ContentTag, ContentPageFormData, ContentMedia } from '@/types/content';
import { ArrowLeft, Save, Eye, X, Type, Code, Monitor } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import MediaLibrary from '@/app/components/custom-ui/MediaLibrary';
import Tiptap from '@/components/custom-ui/Tiptap';

export default function ContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const isNew = params.id === 'new';
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich');
  const [activeTab, setActiveTab] = useState('editor');
  
  const [formData, setFormData] = useState<ContentPageFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    featured_image: '',
    status: 'draft',
    type: 'page',
    category_id: '',
    published_at: '',
    is_featured: false,
    tag_ids: []
  });

  const fetchPage = async () => {
    if (isNew) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/content/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch page');
      
      const data = await response.json();
      const page: ContentPage = data.page;
      
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content,
        excerpt: page.excerpt || '',
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
        featured_image: page.featured_image || '',
        status: page.status,
        type: page.type,
        category_id: page.category_id || '',
        published_at: page.published_at || '',
        is_featured: page.is_featured,
        tag_ids: page.tags?.map(tag => tag.id) || []
      });
      
      setSelectedTags(page.tags?.map(tag => tag.id) || []);
    } catch (error) {
      console.error('Error fetching page:', error);
      toast({
        title: "Error",
        description: "Failed to fetch page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/content/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/content/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      
      const data = await response.json();
      setTags(data.tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      meta_title: prev.meta_title || title
    }));
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      
      setFormData(current => ({
        ...current,
        tag_ids: newTags
      }));
      
      return newTags;
    });
  };

  const handleSave = async (publishStatus?: 'draft' | 'published') => {
    try {
      setSaving(true);
      
      const saveData = {
        ...formData,
        status: publishStatus || formData.status,
        tag_ids: selectedTags
      };

      const url = isNew ? '/api/admin/content' : `/api/admin/content/${params.id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) throw new Error('Failed to save page');
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Page ${isNew ? 'created' : 'updated'} successfully`,
      });

      if (isNew) {
        router.push(`/admin/content/${data.page.id}`);
      }
    } catch (error) {
      console.error('Error saving page:', error);
      toast({
        title: "Error",
        description: "Failed to save page",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMediaSelect = (media: ContentMedia) => {
    setFormData(prev => ({
      ...prev,
      featured_image: media.file_path
    }));
  };

  useEffect(() => {
    fetchPage();
    fetchCategories();
    fetchTags();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/content">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'Create Content' : 'Edit Content'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNew ? 'Create a new page or post' : 'Edit existing content'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            <Eye className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter page title"
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="page-url-slug"
                />
                <p className="text-sm text-gray-500 mt-1">
                  URL: /content/{formData.slug}
                </p>
              </div>
              
              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of the content"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={editorMode === 'rich' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('rich')}
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Rich Text
                  </Button>
                  <Button
                    variant={editorMode === 'markdown' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('markdown')}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Markdown
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="editor" className="mt-0 p-6">
                  {editorMode === 'rich' ? (
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                      placeholder="Start writing your content..."
                    />
                  ) : (
                    <div className="border rounded-lg">
                      <Textarea
                        value={formData.content}
                        onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Write your content here using Markdown..."
                        rows={20}
                        className="font-mono border-0 resize-none focus:ring-0"
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="preview" className="mt-0 p-6">
                  <MarkdownPreview
                    content={formData.content}
                    title={formData.title}
                    excerpt={formData.excerpt}
                    type={formData.type}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO optimized title"
                />
              </div>
              
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description for search engines"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Publishing */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Content Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="page">Page</SelectItem>
                    <SelectItem value="post">Post</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="help">Help</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                />
                <Label htmlFor="featured">Featured Content</Label>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`p-2 border rounded cursor-pointer transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleTagToggle(tag.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{tag.name}</span>
                      {selectedTags.includes(tag.id) && (
                        <Badge style={{ backgroundColor: tag.color, color: 'white' }}>
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.featured_image && (
                <div className="relative">
                  <img
                    src={formData.featured_image}
                    alt="Featured image preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <MediaLibrary
                  onSelect={handleMediaSelect}
                  trigger={
                    <Button variant="outline" className="w-full">
                      <Monitor className="w-4 h-4 mr-2" />
                      Select from Media Library
                    </Button>
                  }
                />
                
                <div className="text-center text-sm text-gray-500">or</div>
                
                <div>
                  <Label htmlFor="featured_image">Image URL</Label>
                  <Input
                    id="featured_image"
                    value={formData.featured_image}
                    onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 