# Complete App Store Submission Checklist

This is your step-by-step guide to submitting your app to both Apple App Store and Google Play Store.

---

## 🎯 PRE-SUBMISSION CHECKLIST

### ✅ Phase 1: Supabase Setup (CRITICAL)

- [ ] Create Supabase account at https://supabase.com
- [ ] Create new project
- [ ] Run `supabase/complete-schema.sql` in SQL Editor
- [ ] Verify all tables exist (profiles, tasks, habits, expenses, trips)
- [ ] Get API keys from Settings → API
- [ ] Add API keys to `.env` files (both web and mobile)
- [ ] Test authentication works (try registering a user)

**Time:** 30-60 minutes

---

### ✅ Phase 2: App Assets

- [ ] Create app icon (1024x1024)
  - Save as `packages/mobile/assets/icon.png`
  - Hire on Fiverr ($20-50) or use https://appicon.co/

- [ ] Create splash screen (1242x2436)
  - Save as `packages/mobile/assets/splash.png`

- [ ] Create adaptive icon (1024x1024)
  - Save as `packages/mobile/assets/adaptive-icon.png`

- [ ] Create notification icon (96x96, white on transparent)
  - Save as `packages/mobile/assets/notification-icon.png`

- [ ] Create favicon (192x192)
  - Save as `packages/mobile/assets/favicon.png`

**Where to get help:**
- Fiverr: Search "app icon design" ($20-100)
- Canva: Use templates (Free)
- Icon8: Pre-made icons ($20)

**Time:** 2-4 hours (or 2-3 days if hiring designer)

---

### ✅ Phase 3: Testing

- [ ] Test on real iPhone (not simulator)
- [ ] Test on real Android device
- [ ] Test registration/login
- [ ] Test creating tasks
- [ ] Test creating habits
- [ ] Test creating expenses
- [ ] Test navigation (all screens)
- [ ] Test push notifications
- [ ] Check for crashes
- [ ] Test offline behavior

**Time:** 3-5 hours

---

### ✅ Phase 4: Developer Accounts

#### Apple Developer Account
- [ ] Go to https://developer.apple.com/programs/
- [ ] Click "Enroll"
- [ ] Pay $99/year
- [ ] Wait 24-48 hours for approval
- [ ] Enable Two-Factor Authentication
- [ ] Accept agreements in App Store Connect

#### Google Play Developer Account
- [ ] Go to https://play.google.com/console/signup
- [ ] Pay $25 one-time fee
- [ ] Fill out developer profile
- [ ] Verify email and phone
- [ ] Usually approved within 48 hours

**Cost:** $124 total
**Time:** 1 hour setup + 1-2 days approval

---

### ✅ Phase 5: Legal Documents

- [ ] Update `PRIVACY-POLICY.md`:
  - Replace "privacy@splitz.app" with your email
  - Replace "https://splitz.app" with your website
  - Add your business address

- [ ] Update `TERMS-OF-SERVICE.md`:
  - Replace "legal@splitz.app" with your email
  - Replace "[Your Country/State]" with your jurisdiction
  - Add effective date

- [ ] Host privacy policy online:
  - Option 1: Create page on your website
  - Option 2: Use GitHub Pages (free)
  - Option 3: Use https://www.termsfeed.com/ ($30-50)

- [ ] Get privacy policy URL (required for submission)
- [ ] Get terms of service URL (required for submission)

**Time:** 1-2 hours

---

### ✅ Phase 6: App Store Screenshots

You need screenshots for BOTH platforms:

#### iOS Screenshots (5-8 screenshots)

**Required sizes:**
1. iPhone 6.7" (1290 x 2796) - iPhone 14 Pro Max
2. iPhone 6.5" (1242 x 2688) - iPhone 11 Pro Max
3. iPhone 5.5" (1242 x 2208) - iPhone 8 Plus

**Suggested screenshots:**
1. Login/Welcome screen
2. Dashboard with sample data
3. Tasks list
4. Habits tracking
5. Expense management
6. Trip planning
7. Matrix priority view
8. Settings screen

#### Android Screenshots (2-8 screenshots)
**Size:** 1080 x 1920 pixels minimum

**How to capture:**
1. Run `npm run mobile`
2. Open app on phone
3. Take screenshots (Power + Volume Down)
4. Transfer to computer
5. Upload during submission

**Time:** 2-3 hours

---

### ✅ Phase 7: App Store Metadata

Prepare this information (you'll need it during submission):

#### App Information
- **App Name:** Splitz - Task & Expense Manager
- **Subtitle:** Stay organized and split costs (30 chars max)
- **Category:** Productivity
- **Age Rating:** 4+ (no objectionable content)

#### Description (4000 chars max)
```
Splitz helps you manage your daily tasks, build better habits, and track expenses all in one place.

KEY FEATURES:
✓ Task Management - Prioritize with Eisenhower Matrix
✓ Habit Tracking - Build streaks and stay motivated
✓ Expense Tracking - Split costs with friends
✓ Trip Planning - Organize travel expenses and tasks
✓ Multi-language Support
✓ Secure & Private - Your data is encrypted

Perfect for:
• Students managing assignments
• Professionals tracking projects
• Friends sharing expenses
• Travelers planning trips
• Anyone building better habits

Download now and get organized!
```

#### Keywords (iOS only, 100 chars max)
```
tasks,habits,expenses,split,organize,productivity,tracker,planner
```

#### Support Information
- **Support URL:** Your website or GitHub page
- **Marketing URL:** Your website (optional)
- **Privacy Policy URL:** Where you hosted it
- **Support Email:** your-support@email.com

**Time:** 1 hour

---

## 📱 iOS APP STORE SUBMISSION

### Step 1: Install Expo CLI and EAS

```bash
npm install -g eas-cli
```

### Step 2: Log in to Expo

```bash
eas login
```

### Step 3: Configure EAS Project

```bash
cd packages/mobile
eas init
```

This creates a project ID. Copy it to `app.json` under `extra.eas.projectId`.

### Step 4: Configure iOS Build

Update `eas.json` with your Apple credentials:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "get-this-from-app-store-connect",
        "appleTeamId": "get-this-from-developer-portal"
      }
    }
  }
}
```

### Step 5: Create App in App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: Splitz
   - Primary Language: English
   - Bundle ID: com.splitz.app
   - SKU: com.splitz.app (can be anything)
4. Click "Create"
5. Copy the Apple ID number (you need this for eas.json)

### Step 6: Build for iOS

```bash
cd packages/mobile
eas build --platform ios --profile production
```

**Wait time:** 15-30 minutes

### Step 7: Submit to App Store

```bash
eas submit --platform ios --latest
```

Or manually:
1. Download IPA file from build
2. Upload via Transporter app or Xcode

### Step 8: Fill Out App Store Connect

1. Go to App Store Connect → Your App
2. Fill in:
   - App Information (name, category, etc.)
   - Pricing: Free (or set price)
   - Screenshots: Upload all sizes
   - Description: Copy from metadata above
   - Keywords: Add keywords
   - Support URL: Your website
   - Privacy Policy URL: Your hosted policy
3. Click "Add for Review"
4. Wait 1-7 days for review

---

## 🤖 GOOGLE PLAY STORE SUBMISSION

### Step 1: Create App in Google Play Console

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: Splitz
   - Default language: English
   - App or game: App
   - Free or paid: Free
4. Accept declarations
5. Click "Create app"

### Step 2: Complete Store Listing

1. Go to "Store presence" → "Main store listing"
2. Fill in:
   - **Short description** (80 chars):
     ```
     Manage tasks, build habits, track expenses. Stay organized with Splitz!
     ```

   - **Full description** (4000 chars):
     ```
     Copy the iOS description from above
     ```

   - **App icon:** Upload icon.png (512x512)
   - **Feature graphic:** Create 1024x500 banner
   - **Screenshots:** Upload 2-8 screenshots
   - **App category:** Productivity
   - **Contact details:** Email and website
   - **Privacy policy:** URL to your hosted policy

### Step 3: Build Android App

```bash
cd packages/mobile
eas build --platform android --profile production
```

**Wait time:** 15-30 minutes

This creates an AAB (Android App Bundle) file.

### Step 4: Upload to Google Play

1. In Play Console, go to "Release" → "Production"
2. Click "Create new release"
3. Upload the AAB file
4. Fill in release notes:
   ```
   Initial release of Splitz!

   Features:
   - Task management
   - Habit tracking
   - Expense tracking
   - Trip planning
   - Secure data encryption
   ```
5. Click "Review release"
6. Click "Start rollout to Production"

### Step 5: Complete Remaining Sections

- **Content rating:** Fill out questionnaire (takes 5 min)
- **Target audience:** Select age groups
- **News apps:** Select "No" (not a news app)
- **COVID-19 contact tracing:** Select "No"
- **Data safety:** Fill out form about data collection
- **App access:** If all features are accessible without login, select "All"
- **Ads:** Select "No" (if you don't have ads)

### Step 6: Pricing & Distribution

- **Countries:** Select all countries or specific ones
- **Pricing:** Free
- **Consent:** Check all boxes

### Step 7: Submit for Review

1. Go back to dashboard
2. Check all sections are complete (green checkmarks)
3. Click "Send for review"
4. Wait 1-7 days for review

---

## ⏰ TIMELINE

| Task | Time |
|------|------|
| Supabase setup | 1-2 hours |
| Create assets (or hire designer) | 2-4 hours (2-3 days if hiring) |
| Testing | 3-5 hours |
| Create developer accounts | 1 hour + 1-2 days approval |
| Prepare legal docs | 1-2 hours |
| Screenshots | 2-3 hours |
| Metadata writing | 1 hour |
| iOS build & submit | 1 hour + 30 min build |
| Android build & submit | 1 hour + 30 min build |
| **Total work time** | **15-25 hours** |
| **Total calendar time** | **1-2 weeks** |

---

## 💰 TOTAL COSTS

| Item | Cost |
|------|------|
| Apple Developer Account | $99/year |
| Google Play Developer Account | $25 one-time |
| App Icon Design (optional) | $20-100 |
| Privacy Policy Hosting (optional) | Free-$50 |
| EAS Build (optional, if no Mac) | $29/month |
| **Minimum Total** | **$124** |
| **With services** | **$250-350** |

---

## 🚨 COMMON REJECTION REASONS

### iOS Rejections:
- ❌ Missing privacy policy
- ❌ Crashes on launch
- ❌ Placeholder content/lorem ipsum
- ❌ Incomplete app information
- ❌ Missing required permissions descriptions

### Android Rejections:
- ❌ Privacy policy not accessible
- ❌ Inappropriate content rating
- ❌ Missing required permissions
- ❌ Data safety form incomplete

---

## ✅ FINAL CHECKLIST

Before submitting, verify:

- [ ] App doesn't crash
- [ ] All features work
- [ ] Privacy policy is live and accessible
- [ ] Screenshots show real content (not placeholder)
- [ ] App icon looks good
- [ ] Description is complete and accurate
- [ ] Support email works
- [ ] Test account credentials provided (if needed)
- [ ] All store listing sections complete
- [ ] Age rating is appropriate
- [ ] Copyright information is correct

---

## 🎉 AFTER APPROVAL

Once approved (1-7 days):

1. **Celebrate!** 🎊
2. Share app store links
3. Monitor reviews and ratings
4. Respond to user feedback
5. Track crashes with analytics
6. Plan updates and improvements

### App Store URLs:
- **iOS:** https://apps.apple.com/app/idYOUR_APP_ID
- **Android:** https://play.google.com/store/apps/details?id=com.splitz.app

---

## 🆘 NEED HELP?

### If You Get Stuck:

1. **Expo Forums:** https://forums.expo.dev/
2. **Expo Discord:** https://chat.expo.dev/
3. **Hire a developer:** Fiverr or Upwork ($100-500)
4. **Email me:** (add your contact info)

### Helpful Resources:

- **iOS Review Guidelines:** https://developer.apple.com/app-store/review/guidelines/
- **Google Play Policies:** https://play.google.com/about/developer-content-policy/
- **Expo Documentation:** https://docs.expo.dev/
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/

---

## 📝 NOTES

- **Approval time varies:** iOS usually 1-3 days, Android 1-7 days
- **Resubmit if rejected:** Fix issues and resubmit immediately
- **Updates:** Use same process for app updates
- **Version numbers:** Increment for each new build

Good luck with your submission! 🚀
