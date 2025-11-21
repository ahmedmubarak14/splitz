# Quick Start Guide - Get Your App Running in 30 Minutes

This guide will get your app running locally for testing.

## What You Need (Install First)

1. **Node.js** - Download from https://nodejs.org/ (get LTS version)
2. **Expo Go app** - On your phone (App Store or Google Play)

That's it! Let's go 🚀

---

## Step 1: Clone & Install (5 minutes)

Open Terminal (Mac) or Command Prompt (Windows):

```bash
# Navigate to your project folder
cd /path/to/splitz

# Install everything
npm install
```

Wait 3-5 minutes for installation to complete.

---

## Step 2: Set Up Supabase (10 minutes)

### 2a. Create Supabase Account
1. Go to https://supabase.com
2. Sign up (free)
3. Click "New Project"
4. Choose:
   - **Name:** splitz-app (or whatever you want)
   - **Database Password:** (save this somewhere!)
   - **Region:** Choose closest to you
5. Wait 2 minutes for setup

### 2b. Create Database Tables
1. In your Supabase dashboard, click **"SQL Editor"**
2. Click **"New Query"**
3. Open the file `supabase/complete-schema.sql` from this project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"**
7. You should see "Success" message

### 2c. Get Your API Keys
1. Click **"Settings"** (gear icon) in Supabase
2. Click **"API"**
3. Copy two things:
   - **Project URL** (looks like: https://xxx.supabase.co)
   - **anon public key** (long text starting with eyJ...)

---

## Step 3: Add API Keys (2 minutes)

### For Mobile App:
1. Go to `packages/mobile/` folder
2. Copy `.env.example` and rename to `.env`
3. Open `.env` and replace:
```
EXPO_PUBLIC_SUPABASE_URL=paste_your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

### For Web App:
1. Go to `packages/web/` folder
2. Copy `.env.example` and rename to `.env`
3. Open `.env` and replace:
```
VITE_SUPABASE_URL=paste_your_project_url_here
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
```

---

## Step 4: Run the Apps! (1 minute)

### Run Mobile App:

```bash
npm run mobile
```

You'll see:
- A QR code in terminal
- A QR code in browser

**On your phone:**
1. Open Expo Go app
2. Scan the QR code
3. App loads on your phone! 🎉

### Run Web App:

```bash
npm run web:dev
```

Opens in your browser at http://localhost:5173

---

## Step 5: Test It Works (5 minutes)

1. **Register a new account** (use any email)
2. **Create a task**
3. **Create a habit**
4. **Add an expense**

If everything works, you're ready! ✅

---

## Troubleshooting

### "npm not found"
→ Install Node.js from https://nodejs.org/

### "Can't connect to Supabase"
→ Check your `.env` files have the correct keys

### Mobile app won't load
→ Make sure phone and computer are on same WiFi

### Web app won't start
→ Try `npm run web:dev` again (port might be in use)

### "Database error"
→ Make sure you ran the SQL schema in Supabase

---

## What's Next?

Now that your app is running:

1. **Read `APP-STORE-SUBMISSION.md`** for publishing steps
2. **Create app icons** (see `packages/mobile/ASSETS-NEEDED.md`)
3. **Test thoroughly** on real devices
4. **Prepare for submission** to app stores

---

## Commands Reference

```bash
# Mobile app
npm run mobile              # Start mobile dev server
npm run mobile:android      # Run on Android emulator
npm run mobile:ios          # Run on iOS simulator (Mac only)

# Web app
npm run web:dev            # Start web dev server
npm run web:build          # Build for production

# Both
npm install                # Install dependencies
```

---

## Getting Help

### App won't work?
1. Check Supabase is running (green light in dashboard)
2. Verify `.env` files exist and have correct keys
3. Try deleting `node_modules` and running `npm install` again

### Need a developer?
- Fiverr: Search "expo react native" ($50-200)
- Upwork: Post a job
- Reddit: r/forhire or r/reactnative

### Documentation:
- Expo: https://docs.expo.dev/
- Supabase: https://supabase.com/docs
- React Native: https://reactnative.dev/

---

## Success! 🎉

Your app is now running locally. You're ready to:
- ✅ Test all features
- ✅ Make changes and see them instantly
- ✅ Prepare for app store submission

Good luck! 🚀
