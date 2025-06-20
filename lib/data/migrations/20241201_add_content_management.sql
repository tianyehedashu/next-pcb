-- Content Management System Tables
-- Created: 2024-12-01

-- 1. Content Categories Table
CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Content Pages Table
CREATE TABLE IF NOT EXISTS content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_title VARCHAR(200),
  meta_description TEXT,
  featured_image TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  type VARCHAR(50) DEFAULT 'page' CHECK (type IN ('page', 'post', 'news', 'help')),
  category_id UUID REFERENCES content_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Content Media Table
CREATE TABLE IF NOT EXISTS content_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Content Tags Table (for better content organization)
CREATE TABLE IF NOT EXISTS content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Content Page Tags Junction Table
CREATE TABLE IF NOT EXISTS content_page_tags (
  page_id UUID REFERENCES content_pages(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, tag_id)
);

-- Enable RLS
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_page_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categories: Public read, admin write
CREATE POLICY "Categories are viewable by everyone" ON content_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage categories" ON content_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Pages: Public read for published, admin full access
CREATE POLICY "Published pages are viewable by everyone" ON content_pages
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all content" ON content_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Media: Public read, admin write
CREATE POLICY "Media files are viewable by everyone" ON content_media
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage media" ON content_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Tags: Public read, admin write
CREATE POLICY "Tags are viewable by everyone" ON content_tags
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage tags" ON content_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Page Tags: Follow page permissions
CREATE POLICY "Page tags follow page permissions" ON content_page_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_pages 
      WHERE content_pages.id = page_id 
      AND content_pages.status = 'published'
    )
  );

CREATE POLICY "Only admins can manage page tags" ON content_page_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_categories_updated_at
    BEFORE UPDATE ON content_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_pages_updated_at
    BEFORE UPDATE ON content_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO content_categories (name, slug, description, sort_order) VALUES
  ('Pages', 'pages', 'Static pages like About Us, Contact, etc.', 1),
  ('News', 'news', 'Company news and announcements', 2),
  ('Blog', 'blog', 'Technical articles and insights', 3),
  ('Help', 'help', 'Help documentation and guides', 4),
  ('Legal', 'legal', 'Legal documents and policies', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO content_tags (name, slug, color) VALUES
  ('PCB Manufacturing', 'pcb-manufacturing', '#10B981'),
  ('Quality Control', 'quality-control', '#3B82F6'),
  ('Technical Guide', 'technical-guide', '#8B5CF6'),
  ('Company News', 'company-news', '#F59E0B'),
  ('Product Update', 'product-update', '#EF4444')
ON CONFLICT (slug) DO NOTHING; 