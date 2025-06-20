# CMS Quick Start Guide

## 🚀 Welcome to the Content Management System

This guide will help you get started with creating and managing content on the Next-PCB platform. Whether you're a content creator, administrator, or developer, this guide has everything you need to begin.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Creating Your First Content](#creating-your-first-content)
- [Using the Rich Text Editor](#using-the-rich-text-editor)
- [Managing Media Files](#managing-media-files)
- [SEO Best Practices](#seo-best-practices)
- [Content Organization](#content-organization)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## 🎯 Getting Started

### Accessing the CMS

1. **Admin Panel**: Navigate to `/admin/content`
2. **Login Required**: Ensure you have admin privileges
3. **Dashboard Overview**: Familiarize yourself with the interface

### Dashboard Overview

The main dashboard shows:
- **Statistics Cards**: Total content, published articles, drafts, and media files
- **Recent Content**: Latest articles and their status
- **Quick Actions**: Create new content, manage categories, and access media library
- **Search & Filters**: Find specific content quickly

## ✍️ Creating Your First Content

### Step 1: Start a New Article

1. Click the **"Create New Content"** button
2. Choose your content type:
   - **Page**: Static information pages
   - **Post**: Blog articles and news
   - **News**: Company announcements
   - **Help**: Documentation and tutorials

### Step 2: Basic Information

Fill in the essential details:

```typescript
// Example content structure
{
  title: "PCB Design Best Practices",
  excerpt: "Learn the fundamental principles of effective PCB design...",
  type: "help",
  status: "draft" // Start as draft
}
```

**Tips:**
- **Title**: Keep it clear and descriptive (50-60 characters for SEO)
- **Excerpt**: Write a compelling summary (150-200 characters)
- **Type**: Choose the most appropriate content type

### Step 3: Content Creation

Use the rich text editor to create your content:

1. **Write your content** using the WYSIWYG editor
2. **Format text** with the toolbar options
3. **Add images** by dragging and dropping
4. **Insert links** to related content
5. **Preview your work** using the Preview tab

### Step 4: Organization

Organize your content effectively:

- **Category**: Select from existing categories
- **Tags**: Add relevant tags for better discoverability
- **Featured**: Mark as featured for homepage display

### Step 5: SEO Optimization

Configure SEO settings:

- **Meta Title**: Optimize for search engines
- **Meta Description**: Write compelling descriptions
- **URL Slug**: Create clean, readable URLs

### Step 6: Publishing

When ready to publish:

1. **Review your content** one final time
2. **Change status** from "Draft" to "Published"
3. **Save changes** to make content live
4. **Verify** the content appears on the frontend

## 🎨 Using the Rich Text Editor

### Toolbar Features

The editor provides a comprehensive set of tools:

#### Text Formatting
- **Bold** (`Ctrl+B`): Make text stand out
- **Italic** (`Ctrl+I`): Emphasize words
- **Underline** (`Ctrl+U`): Underline important text
- **Strikethrough**: Cross out text

#### Headings
- **H1**: Main title (use sparingly)
- **H2**: Section headers
- **H3**: Subsection headers
- **H4-H6**: Additional hierarchy levels

#### Lists and Structure
- **Bullet Points**: Unordered lists
- **Numbered Lists**: Sequential information
- **Blockquotes**: Highlight important quotes
- **Code Blocks**: Technical content

#### Advanced Features
- **Tables**: Structured data presentation
- **Links**: Internal and external linking
- **Images**: Visual content enhancement
- **Horizontal Rules**: Section dividers

### Editor Modes

#### Rich Text Mode
- Visual editing with immediate formatting
- Drag-and-drop functionality
- Real-time preview

#### Markdown Mode
- Raw markdown editing
- Syntax highlighting
- Greater control over formatting

### Keyboard Shortcuts

| Function | Shortcut |
|----------|----------|
| Bold | `Ctrl+B` |
| Italic | `Ctrl+I` |
| Underline | `Ctrl+U` |
| Link | `Ctrl+K` |
| Save | `Ctrl+S` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |

## 📸 Managing Media Files

### Uploading Files

1. **Access Media Library**: Click the image icon in the editor
2. **Upload Methods**:
   - Drag and drop files
   - Click to browse and select
   - Paste from clipboard

3. **File Requirements**:
   - **Size Limit**: 5MB maximum
   - **Formats**: JPG, PNG, GIF, WebP
   - **Optimization**: Recommended 1200px width for articles

### Media Organization

#### File Management
- **Alt Text**: Always add descriptive alt text
- **File Names**: Use descriptive, SEO-friendly names
- **Organization**: Keep files organized by topic or date

#### Best Practices
```typescript
// Good file naming examples
"pcb-design-process-2024.jpg"
"component-placement-guide.png"
"solder-mask-colors-comparison.webp"

// Good alt text examples
"Close-up view of PCB component placement showing proper spacing"
"Comparison chart of different solder mask color options"
```

### Image Optimization Tips

1. **Compress images** before uploading
2. **Use appropriate formats**:
   - JPG for photos
   - PNG for graphics with transparency
   - WebP for modern browsers
3. **Optimize dimensions** for web display
4. **Add descriptive alt text** for accessibility

## 🔍 SEO Best Practices

### Title Optimization

```typescript
// Example: Good SEO titles
"PCB Design Guidelines: Best Practices for 2024"
"How to Choose the Right PCB Material for Your Project"
"Top 10 Common PCB Design Mistakes to Avoid"

// Length: 50-60 characters
// Include: Target keyword + compelling descriptor
```

### Meta Descriptions

```typescript
// Example: Effective meta descriptions
"Learn essential PCB design guidelines and best practices. Discover proven techniques for creating reliable, efficient printed circuit boards in 2024."

// Length: 150-160 characters
// Include: Primary keyword + value proposition + call to action
```

### URL Structure

```typescript
// Good URL examples
"/content/pcb-design-guidelines-2024"
"/content/choosing-pcb-materials-guide"
"/content/common-pcb-design-mistakes"

// Characteristics:
// - Lowercase letters
// - Hyphens instead of spaces
// - Include target keywords
// - Keep under 60 characters
```

### Content Structure

#### Heading Hierarchy
```html
<h1>Main Title (Only One Per Page)</h1>
  <h2>Major Section</h2>
    <h3>Subsection</h3>
    <h3>Another Subsection</h3>
  <h2>Another Major Section</h2>
    <h3>Subsection</h3>
```

#### Internal Linking
- Link to related articles on your site
- Use descriptive anchor text
- Create topic clusters for better SEO
- Include 2-4 internal links per article

### SEO Checklist

- [ ] Title includes target keyword
- [ ] Meta description is compelling and under 160 characters
- [ ] URL is clean and includes keywords
- [ ] At least one H2 heading
- [ ] Images have alt text
- [ ] Content is over 300 words
- [ ] Internal links to related content
- [ ] External links open in new tabs

## 🏷️ Content Organization

### Categories

Use categories to organize content by topic:

```typescript
// Example categories
{
  "PCB Design": { color: "#3B82F6", description: "Design tips and guidelines" },
  "Manufacturing": { color: "#10B981", description: "Production processes" },
  "Assembly": { color: "#F59E0B", description: "Component assembly guides" },
  "Quality Control": { color: "#EF4444", description: "Testing and validation" }
}
```

### Tags

Add specific tags for granular organization:

```typescript
// Example tags for a PCB design article
["beginner-friendly", "layout-tips", "component-placement", "routing", "DRC"]
```

### Featured Content

Mark important content as featured:
- Homepage highlights
- Popular articles
- New announcements
- Essential guides

## 📝 Common Tasks

### Editing Existing Content

1. **Navigate to Content List**: Go to `/admin/content`
2. **Find Your Article**: Use search or filters
3. **Click Edit**: Open the content editor
4. **Make Changes**: Edit content, update SEO, or change status
5. **Save**: Preserve your changes

### Bulk Operations

Select multiple articles to:
- Change status (draft ↔ published)
- Update categories
- Add tags
- Delete content

### Content Status Management

| Status | Description | Visibility |
|--------|-------------|------------|
| Draft | Work in progress | Admin only |
| Published | Live content | Public |
| Archived | Hidden but preserved | Admin only |

### Copying Content

To duplicate an article:
1. Open the original article
2. Copy the content
3. Create a new article
4. Paste and modify as needed
5. Update title, slug, and SEO settings

## 🛠️ Troubleshooting

### Common Issues

#### Editor Not Loading
**Problem**: Rich text editor doesn't appear
**Solutions**:
- Refresh the page
- Clear browser cache
- Check JavaScript console for errors
- Try a different browser

#### Upload Failures
**Problem**: Images won't upload
**Solutions**:
- Check file size (max 5MB)
- Verify file format (JPG, PNG, GIF, WebP)
- Ensure stable internet connection
- Try uploading one file at a time

#### Preview Not Updating
**Problem**: Changes don't show in preview
**Solutions**:
- Switch between editor tabs
- Save the article first
- Refresh the preview
- Clear browser cache

#### Formatting Issues
**Problem**: Content looks different in preview
**Solutions**:
- Check for unsupported HTML tags
- Verify image paths are correct
- Ensure consistent formatting
- Use the built-in styles

### Getting Help

#### Built-in Help
- Hover over question mark icons
- Check tooltips for guidance
- Use the preview feature extensively

#### Support Channels
- **Documentation**: Comprehensive guides available
- **GitHub Issues**: Report bugs and request features
- **Discord Community**: Real-time help from other users
- **Email Support**: Contact dev@speedxpcb.com

### Performance Tips

#### For Better Performance
1. **Optimize images** before uploading
2. **Use appropriate file formats**
3. **Keep content organized** with proper categories
4. **Regular cleanup** of unused media files
5. **Monitor content** performance and update accordingly

#### Browser Compatibility
- **Chrome**: Fully supported
- **Firefox**: Fully supported
- **Safari**: Fully supported
- **Edge**: Fully supported

## 🎓 Next Steps

### Mastering the CMS

1. **Practice regularly** with different content types
2. **Experiment with formatting** options
3. **Learn keyboard shortcuts** for efficiency
4. **Study SEO best practices** for better reach
5. **Organize content systematically** from the start

### Advanced Features

Once comfortable with basics, explore:
- **Custom templates** for consistent formatting
- **Bulk import/export** for content migration
- **API integration** for automated workflows
- **Analytics integration** for performance tracking

### Content Strategy

Develop a content strategy:
- **Content calendar** for regular publishing
- **Topic research** for relevant subjects
- **Audience analysis** for targeted content
- **Performance monitoring** for optimization

## 📞 Support & Community

### Resources
- **[Complete Documentation](./CONTENT_MANAGEMENT_SYSTEM.md)**: Technical details
- **[Architecture Guide](../README-CMS.md)**: System overview
- **Video Tutorials**: Coming soon

### Community
- **Discord**: Join our community server
- **GitHub**: Contribute to development
- **Newsletter**: Stay updated with new features

---

**Happy Content Creating! 🎉**

*Remember: Great content takes time. Focus on providing value to your readers, and the technical aspects will become second nature with practice.*

**Last Updated**: December 2024  
**Version**: 1.0.0 