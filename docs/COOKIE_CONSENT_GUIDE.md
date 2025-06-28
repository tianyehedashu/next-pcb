# Cookie Consent System Guide

## 🍪 Overview

The Cookie Consent System provides GDPR-compliant cookie management for SpeedXPCB website. It allows users to control which types of cookies they accept and ensures analytics tools only run with proper consent.

## 📋 Features

### ✅ **Compliance Features**
- GDPR compliant cookie consent banner
- Granular cookie category controls
- Persistent user preferences storage
- Consent versioning for re-validation
- Analytics integration with consent checks

### 🎯 **Cookie Categories**
1. **Necessary** - Always enabled (login, security, cart)
2. **Analytics** - Google Analytics, Clarity, performance tracking
3. **Marketing** - Ad targeting, conversion tracking, pixels  
4. **Functional** - Language settings, chat widgets, personalization

## 🚀 Implementation

### Components Included

```typescript
// Core Components
- CookieConsentBanner     // First-time consent banner
- CookieSettingsButton    // Floating settings button
- cookieConsent          // Management service
```

### Auto-Integration
The system is automatically integrated into:
- `app/layout.tsx` - Banner and settings button
- `lib/analytics/analytics-manager.ts` - Consent checks
- All analytics tracking methods

## 🔧 Configuration

### Environment Variables
No additional environment variables needed. Uses existing analytics configurations.

### Customization
Edit `lib/analytics/cookie-consent.ts` to modify:
- Consent storage key
- Version numbers
- Cookie categories
- Default preferences

## 📖 User Experience

### First Visit Flow
1. **Banner Appears** - Bottom of screen with clear messaging
2. **Three Options**:
   - "Accept All" - Enable all cookie categories
   - "Reject All" - Only necessary cookies
   - "Customize" - Granular control dialog

### Returning Users
- **Settings Button** - Bottom-left floating button (only shows after initial consent)
- **Persistent Preferences** - Stored in localStorage
- **Re-consent** - When version changes or manual clear

## 🔒 Privacy & Compliance

### GDPR Compliance
✅ Clear consent mechanism  
✅ Granular controls  
✅ Easy withdrawal of consent  
✅ Transparent information  
✅ Consent before processing  

### Data Storage
- **Location**: Browser localStorage
- **Key**: `speedx_cookie_consent`
- **Data**: Preferences, timestamp, version
- **Expiration**: Manual or version change

## 🧪 Testing

### Test Cookie Consent
1. Visit any page in incognito mode
2. Verify banner appears
3. Test all three consent options
4. Check localStorage for saved preferences
5. Verify analytics tools respect consent

### Development Testing
```typescript
// Check current consent status
cookieConsent.hasUserConsented()
cookieConsent.isAnalyticsAllowed()
cookieConsent.getCurrentPreferences()

// Reset for testing
cookieConsent.clearConsent()
```

## 🛠️ Analytics Integration

### Automatic Consent Checks
All analytics methods now include consent verification:
```typescript
// Before tracking
if (!this.checkAnalyticsAllowed()) return;

// Track only if allowed
analytics.trackPageView(url)
analytics.trackEvent(name, data)
```

### Google Analytics Consent Mode
```typescript
// Automatically set based on user preferences
gtag('consent', 'update', {
  analytics_storage: 'granted|denied',
  ad_storage: 'granted|denied'
});
```

## 📱 Mobile Responsiveness

- **Banner**: Responsive layout for mobile/desktop
- **Dialog**: Scrollable on small screens
- **Button**: Positioned to avoid mobile UI conflicts

## 🎨 Styling

### Customization
Edit components to match brand:
- Colors: Blue theme with customizable accent colors
- Typography: Follows existing design system
- Icons: Lucide React icons (replaceable)
- Layout: Tailwind CSS classes

### Accessibility
✅ Keyboard navigation  
✅ Screen reader friendly  
✅ High contrast support  
✅ Focus indicators  

## 🔄 Maintenance

### Version Updates
When privacy policy changes:
1. Update `CONSENT_VERSION` in `cookie-consent.ts`
2. Users will see banner again for re-consent
3. Old preferences automatically cleared

### Analytics Changes
When adding new analytics tools:
1. Add consent checks to initialization
2. Update cookie category descriptions
3. Test consent flow with new tools

## 📊 Monitoring

### Analytics Console
Monitor consent rates:
- Check conversion from banner interactions
- Track preference distribution
- Monitor consent withdrawal rates

### Debug Mode
Enable detailed logging:
```typescript
// Console logs show:
// 🍪 Cookie preferences saved
// 📊 Analytics tracking skipped: cookies not consented
// ✅ Analytics enabled with consent
```

## 🌍 International Considerations

### Multi-Region Support
- **EU/EEA**: Full GDPR compliance
- **California**: CCPA compliance features
- **Other regions**: Best practice implementation

### Language Support
Currently English-only. For multilingual:
1. Extract text to translation files
2. Add language detection
3. Update component text dynamically

## 🚨 Legal Disclaimer

This implementation provides technical compliance tools but:
- **Legal review recommended** for specific jurisdictions
- **Privacy policy must be updated** to reflect cookie usage
- **Regular compliance audits** recommended
- **Local legal counsel** should validate implementation

## 📞 Support

For technical issues:
1. Check browser console for error messages
2. Verify localStorage data structure
3. Test in incognite mode
4. Check analytics network requests

## 🔮 Future Enhancements

Planned improvements:
- [ ] Multi-language support
- [ ] Enhanced analytics dashboard
- [ ] A/B testing for consent rates
- [ ] Advanced consent APIs
- [ ] Integration with more analytics platforms 