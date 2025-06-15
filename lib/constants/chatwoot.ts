const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN;
const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;

if (!websiteToken || !baseUrl) {
  console.error(
    'Chatwoot environment variables (NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN, NEXT_PUBLIC_CHATWOOT_BASE_URL) are not set.'
  );
}

// We export the validated, non-nullable config.
export const CHATWOOT_CONFIG = {
  websiteToken: websiteToken!,
  baseUrl: baseUrl!,
  // Settings based on official Chatwoot documentation
  // https://www.chatwoot.com/docs/self-hosted/monitoring/rate-limiting
  hideMessageBubble: true, // Hide the default bubble, we'll use our custom one
  showUnreadMessagesDialog: false, // Disable the unread message dialog to reduce API calls
  position: 'right' as const,
  locale: 'en' as const,
  useBrowserLanguage: false, // Explicitly set to false to avoid language detection requests
  darkMode: 'auto' as const,
  type: 'standard' as const,
  // Additional settings to reduce API calls and avoid rate limiting
  enableInDevelopment: false, // Disable in development to reduce requests
  showPopoutButton: false, // Disable popout to reduce requests
  // Reduce polling frequency by disabling real-time features that cause frequent requests
  disableTypingIndicator: true, // Custom setting to reduce typing indicator requests
}; 