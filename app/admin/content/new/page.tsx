"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContentCategory, ContentTag, ContentPageFormData, ContentMedia } from '@/types/content';
import { ArrowLeft, Save, Eye, Type, Code } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import MediaLibrary from '@/app/components/custom-ui/MediaLibrary';
import RichTextEditor from '@/app/components/custom-ui/RichTextEditor';
import Image from 'next/image';

export default function ContentCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  
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
    category_id: undefined,
    published_at: '',
    is_featured: false,
    tag_ids: []
  });

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
      slug: generateSlug(title),
      meta_title: title
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

      const response = await fetch('/api/admin/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save page');
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: `Page created successfully`,
      });

      router.push(`/admin/content/${data.page.id}`);
    } catch (error: unknown) {
      console.error('Error saving page:', error);
      let errorMessage = "Failed to save page";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Error",
        description: errorMessage,
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
    fetchCategories();
    fetchTags();
  }, []);

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
              Create Content
            </h1>
            <p className="text-gray-600 mt-1">
              Create a new page or post
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
            <Save className="w-4 h-4 mr-2" />
            Publish
          </Button>
          <Link href={`/content/${formData.slug}`} target="_blank">
            <Button variant="ghost" disabled={!formData.slug}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Main Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(p => ({ ...p, slug: e.target.value }))}
                    placeholder="page-url-slug"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Editor</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant={editorMode === 'rich' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setEditorMode('rich')}
                        >
                           <Type className="w-4 h-4 mr-2"/> Rich Text
                        </Button>
                        <Button 
                            variant={editorMode === 'markdown' ? 'secondary' : 'ghost'} 
                            size="sm"
                            onClick={() => setEditorMode('markdown')}
                        >
                            <Code className="w-4 h-4 mr-2"/> Markdown
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              {editorMode === 'rich' ? (
                <RichTextEditor
                  content={formData.content}
                  onChange={(newContent) => setFormData(p => ({...p, content: newContent}))}
                />
              ) : (
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                  placeholder="Write your content here using Markdown..."
                  rows={20}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Excerpt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(p => ({ ...p, excerpt: e.target.value }))}
                placeholder="Write a short summary..."
                rows={4}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="meta_title">Meta Title</Label>
                  <Input
                    id="meta_title"
                    value={formData.meta_title}
                    onChange={(e) => setFormData(p => ({ ...p, meta_title: e.target.value }))}
                    placeholder="Title for search engines"
                  />
                </div>
                <div>
                  <Label htmlFor="meta_description">Meta Description</Label>
                  <Textarea
                    id="meta_description"
                    value={formData.meta_description}
                    onChange={(e) => setFormData(p => ({ ...p, meta_description: e.target.value }))}
                    placeholder="Description for search engines"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(p => ({ ...p, status: value as 'draft' | 'published' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(p => ({ ...p, type: value as 'page' | 'post' | 'news' | 'help' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
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
                    <Select
                      value={formData.category_id || 'none'}
                      onValueChange={(value) => setFormData(p => ({ ...p, category_id: value === 'none' ? undefined : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => setFormData(p => ({ ...p, is_featured: checked }))}
                    />
                    <Label htmlFor="is_featured">Featured</Label>
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md min-h-[40px]">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                          onClick={() => handleTagToggle(tag.id)}
                          className="cursor-pointer"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="media">
                <Card>
                    <CardHeader>
                        <CardTitle>Featured Image</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {formData.featured_image && (
                            <div className="mb-4">
                                <Image
                                    src={formData.featured_image}
                                    alt="Featured"
                                    className="w-full h-auto rounded-md"
                                    width={800}
                                    height={450}
                                />
                                 <Button
                                    variant="link"
                                    className="text-red-500"
                                    onClick={() => setFormData(p => ({...p, featured_image: ''}))}
                                >
                                    Remove Image
                                </Button>
                            </div>
                        )}
                        <MediaLibrary onSelect={handleMediaSelect} />
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 