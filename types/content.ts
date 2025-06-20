export interface ContentCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentTag {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface ContentPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  type: 'page' | 'post' | 'news' | 'help';
  category_id?: string;
  author_id?: string;
  published_at?: string;
  view_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  category?: ContentCategory;
  author?: {
    id: string;
    company_name?: string;
  };
  tags?: ContentTag[];
}

export interface ContentMedia {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  alt_text?: string;
  width?: number;
  height?: number;
  uploaded_by?: string;
  created_at: string;
}

export interface ContentPageFormData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  meta_title?: string;
  meta_description?: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  type: 'page' | 'post' | 'news' | 'help';
  category_id?: string;
  published_at?: string;
  is_featured: boolean;
  tag_ids?: string[];
}

export interface ContentCategoryFormData {
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ContentTagFormData {
  name: string;
  slug: string;
  color: string;
} 