export const CHATWOOT_CONFIG = {
  websiteToken: process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
  locale: 'en',
  position: 'right',
  type: 'standard',
  launcherTitle: 'Customer Support',
  hideMessageBubble: true,
  showPopoutButton: false, // 修复: 禁用弹出按钮以避免 X-Frame-Options 错误
  enabledFeatures: ['emoji_picker', 'file_upload', 'attachments'],
} as const;

export type ChatwootConfig = typeof CHATWOOT_CONFIG; 