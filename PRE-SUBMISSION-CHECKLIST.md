# Pre-Submission Checklist

Complete this checklist before submitting to App Store and Google Play.

## Phase 1: Configuration & Setup

### App Configuration
- [ ] Bundle ID configured: `com.splitz.app`
- [ ] App version set to `1.0.0`
- [ ] iOS build number set (increment for each build)
- [ ] Android version code set (increment for each build)
- [ ] App name finalized: "Splitz"
- [ ] App icon created (1024x1024)
- [ ] Splash screen created (1242x2436)
- [ ] Notification icon created (96x96, Android)
- [ ] Adaptive icon created (1024x1024, Android)

### Environment Variables
- [ ] `.env` file created from `.env.example`
- [ ] Supabase URL configured
- [ ] Supabase anon key configured
- [ ] Sentry DSN configured (if using crash reporting)
- [ ] All API keys added
- [ ] No hardcoded secrets in code

### EAS Configuration
- [ ] EAS account created
- [ ] Project linked to EAS
- [ ] `eas.json` configured
- [ ] Production build profile ready
- [ ] iOS provisioning profile configured
- [ ] Android keystore configured

---

## Phase 2: Backend & Database

### Supabase Setup
- [ ] Database schema deployed (`supabase/complete-schema.sql`)
- [ ] All tables created
- [ ] Row Level Security (RLS) policies enabled
- [ ] Storage buckets created
- [ ] Storage policies configured
- [ ] Database functions deployed
- [ ] Triggers set up
- [ ] Indexes created
- [ ] Test database with sample data

### Authentication
- [ ] Email auth enabled
- [ ] Email templates customized (optional)
- [ ] Password reset works
- [ ] Email confirmation works (if enabled)
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test password reset

---

## Phase 3: Legal & Compliance

### Legal Documents
- [ ] Privacy Policy written and reviewed
- [ ] Terms of Service written and reviewed
- [ ] Legal docs hosted online (GitHub Pages, Netlify, etc.)
- [ ] Privacy Policy URL accessible
- [ ] Terms of Service URL accessible
- [ ] Privacy Policy linked in app (Settings)
- [ ] Terms displayed during signup
- [ ] Contact email address added to documents

### GDPR/Privacy Compliance
- [ ] Privacy Policy discloses data collection
- [ ] User can view their data
- [ ] User can export their data
- [ ] User can delete their account
- [ ] Data deletion actually deletes from database
- [ ] Analytics opt-out available
- [ ] Cookie consent (if using web)

### App Store Compliance
- [ ] Age rating appropriate (4+ for iOS, Everyone for Android)
- [ ] No prohibited content
- [ ] No misleading claims
- [ ] Complies with platform guidelines
- [ ] Third-party terms accepted (if using third-party SDKs)

---

## Phase 4: Testing

### Functional Testing
- [ ] Signup works (email)
- [ ] Login works (email)
- [ ] Logout works
- [ ] Password reset works
- [ ] Biometric auth works (if implemented)
- [ ] Create task works
- [ ] Edit task works
- [ ] Delete task works
- [ ] Task notifications work
- [ ] Create habit works
- [ ] Habit check-in works
- [ ] Habit streaks calculate correctly
- [ ] Create expense works
- [ ] Expense categorization works
- [ ] Create trip works
- [ ] Trip expense tracking works
- [ ] Search works
- [ ] Filters work
- [ ] Settings save correctly

### Platform Testing
- [ ] Tested on iOS (physical device)
- [ ] Tested on Android (physical device)
- [ ] Tested on iPhone (latest iOS)
- [ ] Tested on older iPhone (iOS 14+)
- [ ] Tested on Android phone (latest)
- [ ] Tested on older Android (API 21+)
- [ ] Tested on tablet (optional but recommended)
- [ ] All orientations work (portrait/landscape)

### Network Testing
- [ ] Works with WiFi
- [ ] Works with cellular data
- [ ] Works offline (offline mode)
- [ ] Syncs when back online
- [ ] Handles slow network gracefully
- [ ] Handles network errors properly
- [ ] No crashes when offline

### Performance Testing
- [ ] App loads in < 3 seconds
- [ ] Smooth scrolling (60 FPS)
- [ ] No memory leaks
- [ ] Battery usage acceptable
- [ ] App size < 50 MB (ideal)
- [ ] Images optimized
- [ ] Large lists paginated/virtualized

### Security Testing
- [ ] API keys not exposed in code
- [ ] No console.logs with sensitive data
- [ ] Secure token storage (SecureStore)
- [ ] HTTPS for all network requests
- [ ] No SQL injection vulnerabilities
- [ ] Input validation on all forms
- [ ] XSS protection

### Edge Cases
- [ ] Works with empty states
- [ ] Handles very long text
- [ ] Handles special characters
- [ ] Handles emoji input
- [ ] Handles date edge cases
- [ ] Handles rapid tapping/actions
- [ ] Handles app backgrounding
- [ ] Handles force quit and restart

---

## Phase 5: App Store Assets

### iOS App Store
- [ ] 5+ screenshots (6.7" display)
- [ ] 5+ screenshots (6.5" display)
- [ ] 5+ screenshots (5.5" display)
- [ ] iPad screenshots (optional)
- [ ] App preview video (optional)
- [ ] App name (30 chars)
- [ ] Subtitle (30 chars)
- [ ] Keywords (100 chars)
- [ ] Promotional text (170 chars)
- [ ] Description (4000 chars)
- [ ] What's New (4000 chars)
- [ ] Support URL
- [ ] Marketing URL (optional)

### Google Play Store
- [ ] 5-8 phone screenshots
- [ ] Tablet screenshots (optional)
- [ ] Feature graphic (1024x500) - REQUIRED
- [ ] Promo video (optional)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App category selected
- [ ] Content rating questionnaire completed
- [ ] Contact email
- [ ] Privacy Policy URL

### Both Stores
- [ ] App icon looks good
- [ ] Screenshots have text overlays
- [ ] Screenshots show key features
- [ ] Description highlights benefits
- [ ] Keywords researched and optimized
- [ ] All text proofread (no typos)
- [ ] Contact information correct

---

## Phase 6: Build & Release

### Pre-Build
- [ ] Run `node scripts/pre-build-check.js`
- [ ] Fix all errors from pre-build check
- [ ] Version numbers incremented
- [ ] Build numbers incremented
- [ ] Git committed and pushed
- [ ] Tagged release in git

### iOS Build
- [ ] Run `eas build --platform ios --profile production`
- [ ] Build completes successfully
- [ ] Download IPA
- [ ] Test IPA on device via TestFlight
- [ ] No crashes in TestFlight
- [ ] Provisioning profile valid
- [ ] Certificates valid

### Android Build
- [ ] Run `eas build --platform android --profile production`
- [ ] Build completes successfully
- [ ] Download AAB
- [ ] Test AAB on device
- [ ] No crashes in test
- [ ] Keystore backed up
- [ ] Signing configured correctly

---

## Phase 7: Submission

### Apple App Store Connect
- [ ] App created in App Store Connect
- [ ] IPA uploaded
- [ ] Version information filled
- [ ] Screenshots uploaded
- [ ] App description added
- [ ] Keywords added
- [ ] Privacy policy URL added
- [ ] Support URL added
- [ ] App Privacy section completed
- [ ] Pricing set (free or paid)
- [ ] Availability/regions selected
- [ ] Age rating set
- [ ] Submit for review

### Google Play Console
- [ ] App created in Play Console
- [ ] AAB uploaded to production track
- [ ] Store listing completed
- [ ] Graphics uploaded
- [ ] Content rating completed
- [ ] Pricing set
- [ ] Countries selected
- [ ] Privacy Policy URL added
- [ ] Data Safety section completed
- [ ] App category selected
- [ ] Submit for review

---

## Phase 8: Post-Submission

### Monitoring
- [ ] Check submission status daily
- [ ] Monitor crash reports (Sentry)
- [ ] Monitor analytics
- [ ] Check reviews
- [ ] Respond to reviews within 24 hours

### Marketing Preparation
- [ ] Prepare launch announcement
- [ ] Social media posts ready
- [ ] Email to beta testers
- [ ] Product Hunt post prepared
- [ ] Reddit posts planned
- [ ] Press kit created

### Support Setup
- [ ] Support email monitored
- [ ] FAQ document created
- [ ] Common issues documented
- [ ] Troubleshooting guide ready
- [ ] Response templates prepared

---

## Quick Commands

```bash
# Check if ready to build
npm run precheck

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Build both
eas build --platform all --profile production

# Submit iOS to App Store
eas submit --platform ios

# Submit Android to Play Store
eas submit --platform android

# Update OTA (minor fixes without review)
eas update --branch production --message "Bug fixes"
```

---

## Timeline Estimate

| Phase | Time Required |
|-------|---------------|
| Configuration & Setup | 2-4 hours |
| Backend & Database | 1-2 hours |
| Legal & Compliance | 2-3 hours |
| Testing | 8-12 hours |
| App Store Assets | 4-8 hours |
| Build & Release | 2-3 hours |
| Submission | 1-2 hours |
| **Total** | **20-34 hours** |

Plus review time:
- iOS: 24 hours - 7 days (average: 1-2 days)
- Android: 1-3 days (average: 1 day)

---

## Common Rejection Reasons

### iOS
1. Missing privacy policy
2. Incomplete app functionality
3. Crashes or bugs
4. Misleading screenshots
5. Missing required device features
6. Data privacy issues
7. Minimum functionality not met

### Android
1. Privacy policy not accessible
2. Missing content rating
3. Incomplete data safety section
4. Crashes or bugs
5. Violates Google Play policies
6. Inappropriate content
7. Misleading information

---

## Emergency Contacts

- **Apple Developer Support**: https://developer.apple.com/contact/
- **Google Play Support**: https://support.google.com/googleplay/android-developer
- **Expo Support**: https://expo.dev/support
- **Supabase Support**: https://supabase.com/support

---

## Success Criteria

Before submitting, answer YES to all:

- [ ] **Does the app work perfectly without crashes?**
- [ ] **Have you tested on real devices?**
- [ ] **Are all required features complete?**
- [ ] **Is the user experience smooth and intuitive?**
- [ ] **Are all assets high quality and professional?**
- [ ] **Is all content accurate and proofread?**
- [ ] **Do you have legal documents hosted?**
- [ ] **Can you provide support to users?**
- [ ] **Have you backed up all credentials?**
- [ ] **Are you ready for user feedback?**

If you answered YES to all, you're ready to submit! 🚀

---

**Last updated**: November 2024
**App Version**: 1.0.0
