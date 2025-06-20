-- Comments System Database Schema
-- 评论系统数据库架构

-- 1. Comments table (评论表)
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- 用于回复功能
  
  -- Content fields (内容字段)
  content TEXT NOT NULL,
  content_html TEXT, -- 富文本HTML版本
  
  -- User info for guest comments (游客评论用户信息)
  guest_name VARCHAR(100),
  guest_email VARCHAR(255),
  guest_website VARCHAR(255),
  
  -- Status and metadata (状态和元数据)
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  is_pinned BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Metrics (统计数据)
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  
  -- Technical fields (技术字段)
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps (时间戳)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id)
);

-- 2. Comment likes table (评论点赞表)
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address INET, -- 用于游客点赞去重
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  UNIQUE(comment_id, user_id), -- 防止重复点赞
  UNIQUE(comment_id, ip_address) -- 防止游客重复点赞
);

-- 3. Comment reports table (评论举报表)
CREATE TABLE IF NOT EXISTS comment_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  reporter_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_ip INET,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'off_topic', 'other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Comment settings table (评论设置表)
CREATE TABLE IF NOT EXISTS comment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES content_pages(id) ON DELETE CASCADE UNIQUE,
  
  -- Settings (设置)
  comments_enabled BOOLEAN DEFAULT TRUE,
  guest_comments_enabled BOOLEAN DEFAULT TRUE,
  moderation_required BOOLEAN DEFAULT TRUE,
  allow_replies BOOLEAN DEFAULT TRUE,
  max_reply_depth INTEGER DEFAULT 3,
  auto_close_after_days INTEGER, -- 自动关闭评论时间
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance (性能索引)
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_content_status ON comments(content_id, status);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);

-- Triggers to update counts (更新计数触发器)
CREATE OR REPLACE FUNCTION update_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update likes count
  IF TG_TABLE_NAME = 'comment_likes' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE comments 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE comments 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.comment_id;
    END IF;
  END IF;
  
  -- Update replies count
  IF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
      UPDATE comments 
      SET replies_count = replies_count + 1 
      WHERE id = NEW.parent_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
      UPDATE comments 
      SET replies_count = replies_count - 1 
      WHERE id = OLD.parent_id;
    END IF;
  END IF;
  
  -- Update content pages comment count
  IF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE content_pages 
      SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE content_id = NEW.content_id AND status = 'approved'
      ) 
      WHERE id = NEW.content_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE content_pages 
      SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE content_id = OLD.content_id AND status = 'approved'
      ) 
      WHERE id = OLD.content_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      UPDATE content_pages 
      SET comments_count = (
        SELECT COUNT(*) FROM comments 
        WHERE content_id = NEW.content_id AND status = 'approved'
      ) 
      WHERE id = NEW.content_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_comment_likes_count ON comment_likes;
CREATE TRIGGER trigger_comment_likes_count
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

DROP TRIGGER IF EXISTS trigger_comment_replies_count ON comments;
CREATE TRIGGER trigger_comment_replies_count
  AFTER INSERT OR DELETE OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_counts();

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comment_settings_updated_at ON comment_settings;
CREATE TRIGGER update_comment_settings_updated_at
    BEFORE UPDATE ON comment_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (行级安全策略)

-- Comments policies
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 所有人可以查看已批准的评论
CREATE POLICY "Anyone can view approved comments" ON comments
  FOR SELECT USING (status = 'approved');

-- 用户可以查看自己的评论
CREATE POLICY "Users can view their own comments" ON comments
  FOR SELECT USING (auth.uid() = user_id);

-- 管理员可以查看所有评论
CREATE POLICY "Admins can view all comments" ON comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 认证用户可以创建评论
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 游客可以创建评论（如果启用）
CREATE POLICY "Guests can create comments" ON comments
  FOR INSERT WITH CHECK (
    user_id IS NULL 
    AND guest_name IS NOT NULL 
    AND guest_email IS NOT NULL
  );

-- 用户可以编辑自己的评论（24小时内）
CREATE POLICY "Users can edit their own comments within 24h" ON comments
  FOR UPDATE USING (
    auth.uid() = user_id 
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Comment likes policies
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like comments" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can unlike their likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Comment reports policies  
ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON comment_reports
  FOR INSERT WITH CHECK (
    auth.uid() = reporter_user_id OR reporter_user_id IS NULL
  );

CREATE POLICY "Admins can view all reports" ON comment_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Comment settings policies
ALTER TABLE comment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment settings" ON comment_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage comment settings" ON comment_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Add comments_count column to content_pages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_pages' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE content_pages ADD COLUMN comments_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Initialize comment counts for existing content
UPDATE content_pages 
SET comments_count = (
  SELECT COUNT(*) FROM comments 
  WHERE comments.content_id = content_pages.id 
  AND comments.status = 'approved'
);

-- Insert default comment settings for existing content
INSERT INTO comment_settings (content_id, comments_enabled, guest_comments_enabled, moderation_required)
SELECT id, true, true, true
FROM content_pages
WHERE id NOT IN (SELECT content_id FROM comment_settings); 