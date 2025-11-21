# Splitz - Monorepo (Web + Mobile)

A productivity and expense management app available on both **web browsers** and **mobile devices** (iOS & Android).

---

## 📦 What is a Monorepo?

This project contains **TWO apps in ONE repository**:

```
splitz/
├── packages/
│   ├── web/          ← React web app (runs in browsers)
│   └── mobile/       ← React Native app (iOS & Android)
```

**Benefits:**
- ✅ Share code between web and mobile
- ✅ Update both apps at the same time
- ✅ Easier to manage and maintain
- ✅ Industry standard approach

---

## 🚀 Quick Start Guide (No Coding Experience)

### Step 1: Install Required Software

1. **Node.js** (version 18+)
   - Download: https://nodejs.org/
   - Choose "LTS" version
   - Install with default settings

2. **Git**
   - Download: https://git-scm.com/downloads
   - Install with default settings

3. **For Mobile Testing:**
   - Install **Expo Go** app on your phone (App Store or Google Play)

### Step 2: Clone and Install

Open Terminal (Mac) or Command Prompt (Windows):

```bash
# 1. Clone this repository
git clone <your-git-url>
cd splitz

# 2. Install all dependencies (takes 3-5 minutes)
npm install

# This installs packages for BOTH web and mobile
```

### Step 3: Set Up Supabase (Your Database)

1. Go to https://supabase.com/
2. Create a free account
3. Create a new project
4. Get your API keys from Settings → API

### Step 4: Configure Environment Variables

**For Web App:**
Create `packages/web/.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**For Mobile App:**
Create `packages/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## ▶️ Running the Apps

### Run Web App (Browser)

```bash
npm run web:dev
```

- Opens in browser at http://localhost:5173
- Hot reload enabled (changes update instantly)

### Run Mobile App (Phone)

```bash
npm run mobile
```

- Shows a QR code
- Open Expo Go app on your phone
- Scan the QR code
- App loads on your phone!

---

## 📱 What Each App Does

### Web App (`packages/web/`)
- **Technology:** React + Vite + Tailwind CSS
- **Runs on:** Chrome, Firefox, Safari, Edge
- **Best for:** Desktop users, detailed work
- **Features:** Full dashboard, all features

### Mobile App (`packages/mobile/`)
- **Technology:** React Native + Expo
- **Runs on:** iOS and Android
- **Best for:** On-the-go use
- **Features:**
  - Task management
  - Habit tracking
  - Expense tracking
  - Trip planning
  - Eisenhower Matrix (priority grid)
  - Onboarding flow
  - Settings & preferences

---

## 🛠️ Available Commands

### Root Commands (run from main folder):
```bash
npm run web:dev         # Start web dev server
npm run web:build       # Build web for production
npm run mobile          # Start mobile dev server
npm run mobile:android  # Run on Android emulator
npm run mobile:ios      # Run on iOS simulator (Mac only)
```

---

## 🔧 Common Issues & Solutions

### "npm not found"
→ Node.js not installed correctly. Reinstall from nodejs.org

### "Cannot connect to Supabase"
→ Check your `.env` files have correct API keys

### Mobile app won't load
→ Make sure phone and computer are on same WiFi

### Web app won't start
→ Port 5173 might be in use. Close other dev servers

---

## 🆘 Need Help?

### For Non-Developers:
1. **Hire a developer** for initial setup (1-2 hours)
2. **Use Fiverr or Upwork** to find help
3. **Join Expo Discord** for mobile questions

---

## 🎯 What's Included

### Features:
- ✅ User authentication (login/register)
- ✅ Task management with priorities
- ✅ Habit tracking with streaks
- ✅ Expense tracking and splitting
- ✅ Trip planning
- ✅ Eisenhower Matrix (mobile)
- ✅ Onboarding flow (mobile)
- ✅ Settings & preferences
- ✅ Multi-language support (i18n)

### Tech Stack:

**Web:**
- React 18 + Vite
- Tailwind CSS + shadcn/ui
- React Router
- Supabase

**Mobile:**
- React Native 0.74 + Expo SDK 51
- React Navigation
- NativeWind (Tailwind for RN)
- Expo SecureStore
- Supabase

---

**Questions?** Check the individual README files in each package folder for more specific instructions.
