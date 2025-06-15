export interface ChatwootSDK {
  run: (config: { websiteToken: string; baseUrl: string }) => void;
  setUser: (identifier: string, user: { name?: string; email?: string; avatar_url?: string }) => void;
  setCustomAttributes: (attributes: Record<string, string | number>) => void;
  toggle: (state?: 'open' | 'close') => void;
  setLocale: (locale: string) => void;
  reset: () => void;
  [key: string]: unknown;
}

export interface ChatwootSettings {
  hideMessageBubble?: boolean;
  position?: 'left' | 'right';
  locale?: string;
  type?: 'standard' | 'expanded_bubble';
  launcherTitle?: string;
  showPopoutButton?: boolean;
}

export interface ChatwootUser {
  identifier?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  phone_number?: string;
}

declare global {
  interface Window {
    chatwootSDK?: ChatwootSDK;
    $chatwoot?: ChatwootSDK;
    chatwootSettings?: ChatwootSettings;
  }
}