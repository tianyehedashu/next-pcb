import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://speedxpcb.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
          '/payment/',
          '/test-*',
          '/debug-*',
          '/ultimate-chatwoot-debug/',
          '/verify-chatwoot-fix/',
          '/clean-chatwoot-iframe/',
          '/chatwoot-emergency/',
          '/chatwoot-cors-fix/',
          '/*?*', // Disallow URL parameters for cleaner indexing
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/profile/',
          '/payment/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
} 