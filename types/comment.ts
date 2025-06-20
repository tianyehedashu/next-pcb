// 评论系统类型定义

export interface Comment {
  id: string;
  content_id: string;
  user_id?: string;
  parent_id?: string;
  
  // Content
  content: string;
  content_html?: string;
  
  // Guest user info
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
  
  // Status and metadata
  status: 'pending' | 'approved' | 'rejected' | 'spam';
  is_pinned: boolean;
  is_featured: boolean;
  
  // Metrics
  likes_count: number;
  replies_count: number;
  
  // Technical
  ip_address?: string;
  user_agent?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  
  // Relations (populated by joins)
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
    role: string;
  };
  replies?: Comment[];
  parent?: Comment;
  user_has_liked?: boolean;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id?: string;
  ip_address?: string;
  created_at: string;
}

export interface CommentReport {
  id: string;
  comment_id: string;
  reporter_user_id?: string;
  reporter_ip?: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'off_topic' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface CommentSettings {
  id: string;
  content_id: string;
  comments_enabled: boolean;
  guest_comments_enabled: boolean;
  moderation_required: boolean;
  allow_replies: boolean;
  max_reply_depth: number;
  auto_close_after_days?: number;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface CreateCommentRequest {
  content_id: string;
  content: string;
  parent_id?: string;
  
  // For guest comments
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  settings: CommentSettings;
}

export interface CommentStatsResponse {
  total_comments: number;
  approved_comments: number;
  pending_comments: number;
  spam_comments: number;
  total_likes: number;
  recent_comments: Comment[];
}

// Form types
export interface CommentFormData {
  content: string;
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
}

export interface CommentReportFormData {
  reason: CommentReport['reason'];
  description?: string;
}

// Filter and sort options
export interface CommentFilters {
  status?: Comment['status'];
  content_id?: string;
  user_id?: string;
  parent_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface CommentSortOptions {
  field: 'created_at' | 'likes_count' | 'replies_count' | 'updated_at';
  direction: 'asc' | 'desc';
}

// Admin management types
export interface CommentModerationAction {
  comment_id: string;
  action: 'approve' | 'reject' | 'spam' | 'feature' | 'pin';
  reason?: string;
}

export interface BulkCommentAction {
  comment_ids: string[];
  action: 'approve' | 'reject' | 'spam' | 'delete';
  reason?: string;
} 