# Next PCB Project

## SEO & Performance Optimizations

### 🚀 Performance Optimizations
- **Image Optimization**: 
  - WebP/AVIF format support
  - Lazy loading for non-critical images  
  - Priority loading for first carousel image only
  - Optimized image sizes and quality (85%)
  - 30-day cache TTL for images

- **Code Splitting & Bundling**:
  - SWC minification enabled
  - Package imports optimization
  - Modular imports for UI components
  - Gzip compression enabled

- **Resource Preloading**:
  - Preload critical carousel background image
  - Preload navbar logo
  - DNS prefetch for Google Fonts
  - Preconnect to font CDN

### 🔍 SEO Optimizations  
- **Meta Tags Enhancement**:
  - Expanded keyword list (20+ relevant terms)
  - Enhanced Open Graph data
  - Twitter Card optimization
  - Robots.txt directives

- **Structured Data**:
  - Organization schema in layout
  - Service schema on homepage
  - FAQ schema for common questions
  - Rich snippets optimization

- **Content Structure**:
  - Proper heading hierarchy (h1, h2, h3)
  - Semantic HTML5 elements
  - Descriptive alt text for images
  - Internal linking optimization

- **Technical SEO**:
  - Canonical URLs
  - XML sitemap ready
  - Mobile-first responsive design
  - Fast loading times

### 📊 Expected Improvements
- **Loading Speed**: 30-40% faster first contentful paint
- **SEO Score**: Improved search engine rankings
- **User Experience**: Better Core Web Vitals scores
- **Search Visibility**: Enhanced rich snippets appearance

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

[用户浏览器]
      |
      v
[Next.js 前端 (Vercel)] <----> [Supabase Auth & Database]
      |
      v
[Next.js API Route (Vercel)] (如需自定义后端逻辑)


