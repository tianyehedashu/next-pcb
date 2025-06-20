 # Phase 2: Advanced Content Editor

## New Features Added

### 1. Rich Text Editor
- **Tiptap-based rich text editor** with full formatting support
- **Toolbar** with text formatting, headings, lists, quotes, links, images, and tables  
- **Dual mode**: Switch between Rich Text and Markdown editing
- **Live preview** with real-time content rendering

### 2. Image Upload & Media Library
- **Drag & drop image upload** directly into the editor
- **Media library** for browsing and selecting uploaded images
- **Featured image selector** using the media library
- **File validation** (type, size limits)
- **Supabase Storage integration** with proper security policies

### 3. Enhanced Preview System
- **Live preview** with proper content rendering
- **Markdown support** for both editors
- **HTML content detection** for rich text vs markdown
- **Professional styling** with proper typography

## Setup Instructions

### 1. Install Dependencies

```bash
# Navigate to your project directory
cd next-pcb

# Install the new packages (already added to package.json)
pnpm install
```

### 2. Database Setup

Run the new migration files:

```sql
-- 1. First, run the content management migration (if not already done)
\i lib/data/migrations/20241201_add_content_management.sql

-- 2. Then, create the media storage bucket
\i lib/data/migrations/20241201_create_media_bucket.sql
```

### 3. Supabase Storage Configuration

In your Supabase dashboard:

1. **Go to Storage** section
2. **Verify the 'media' bucket** was created
3. **Check the storage policies** are properly set
4. **Test upload** by trying to upload an image through the admin interface

### 4. Environment Variables

Make sure your Supabase configuration supports storage:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How to Use

### Admin Content Editor

1. **Navigate to** `/admin/content`
2. **Create or edit** a content page
3. **Choose editor mode**:
   - **Rich Text**: Full WYSIWYG editing with toolbar
   - **Markdown**: Traditional markdown editing

### Rich Text Features

**Text Formatting**:
- Bold, Italic, Strikethrough, Code
- Headers (H1, H2, H3)
- Lists (bullet, ordered)
- Blockquotes

**Media**:
- Click image button to upload directly
- Drag & drop images into editor
- Select from media library

**Advanced**:
- Insert tables with resizable columns
- Add links with URL input
- Undo/Redo functionality

### Media Library

**Access**: Click "Select from Media Library" button anywhere

**Upload**: 
- Drag & drop files onto upload area
- Click to browse and select files
- Supports: PNG, JPG, GIF, WebP (max 5MB)

**Browse**:
- Grid or list view
- Search by filename
- Click to select for use

### Live Preview

**Switch between**:
- **Editor**: Make your changes
- **Preview**: See how it will look to users

**Preview shows**:
- Proper typography and spacing
- Image rendering
- Table formatting
- Link styling

## Technical Details

### File Structure

```
app/
├── components/custom-ui/
│   ├── RichTextEditor.tsx      # Main rich text editor
│   ├── MarkdownPreview.tsx     # Live preview component  
│   └── MediaLibrary.tsx        # Media browsing/upload
├── api/admin/content/
│   └── media/
│       └── route.ts            # Media upload API
└── globals.css                 # Enhanced styles

lib/data/migrations/
├── 20241201_add_content_management.sql
└── 20241201_create_media_bucket.sql
```

### Security

- **Admin-only access** to content management
- **Media upload restricted** to admin users
- **File type validation** on upload
- **File size limits** (5MB max)
- **Supabase RLS policies** for storage access

### Browser Compatibility

- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **JavaScript required** for rich text editing
- **Fallback to textarea** if JavaScript disabled

## Troubleshooting

### Upload Issues

1. **Check Supabase storage quota**
2. **Verify bucket permissions**
3. **Test file size** (must be under 5MB)
4. **Check file type** (images only)

### Editor Problems

1. **Clear browser cache**
2. **Check console** for JavaScript errors
3. **Try markdown mode** as fallback
4. **Refresh the page**

### Preview Not Working

1. **Check content format** (HTML vs Markdown)
2. **Verify image URLs** are accessible
3. **Test in incognito mode**

## What's Next (Phase 3)

- **Version control** for content
- **Scheduled publishing** 
- **Multi-language support**
- **SEO analysis tools**
- **Content templates**
- **Collaborative editing**