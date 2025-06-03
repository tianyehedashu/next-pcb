export interface ChatwootSettings {
    hideMessageBubble?: boolean;
    position?: 'left' | 'right';
    locale?: string;
    type?: 'standard' | 'expanded_bubble';
    launcherTitle?: string;
    showPopoutButton?: boolean;
  }
  
  export interface ChatwootSDK {
    run: (config: { websiteToken: string; baseUrl: string }) => void;
    toggle: (state?: 'open' | 'close') => void;
    popoutChatWindow: () => void;
    setUser: (user: ChatwootUser) => void;
    setCustomAttributes: (attributes: Record<string, any>) => void;
    deleteCustomAttribute: (key: string) => void;
    setLabel: (label: string) => void;
    removeLabel: (label: string) => void;
    setLocale: (locale: string) => void;
    reset: () => void;
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
      chatwootSettings?: ChatwootSettings;
      chatwootSDK?: ChatwootSDK;
      $chatwoot?: ChatwootSDK;
    }
  }