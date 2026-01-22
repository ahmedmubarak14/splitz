# LinkUp - Project Development Status

## 📋 Project Overview

**Project Name:** LinkUp  
**Target Audience:** Gen Z / Gen Alpha  
**MVP Core Features:** 🔥 Habit Streaks, 🏆 Friend Challenges, 💸 Expense Splitter  
**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Supabase (via Lovable Cloud)  
**i18n Support:** Bilingual (English/Arabic) with RTL support  
**Deployment Status:** Development  
**Last Updated:** October 2, 2025

---

## 🎨 Design System

### Status: ✅ IMPLEMENTED

#### Color Palette (Custom Brand Colors)
- **Cheviot** (`#F6F2E8`) - Background (HSL: 45 38% 94%)
- **Grape Mist** (`#C5C0C9`) - Muted elements (HSL: 270 12% 90%)
- **Pacific Panorama** (`#C0D6EA`) - Secondary/Success (HSL: 206 49% 83%)
- **Isotonic Water** (`#DDFF55`) - Accent/Highlights (HSL: 68 100% 67%)
- **Neptune's Wrath** (`#11425D`) - Primary/Dark teal (HSL: 201 69% 22%)
- **Midnight Dreams** (`#002233`) - Foreground text (HSL: 200 100% 10%)

#### Design Tokens
✅ **Implemented:**
- HSL color system for all colors
- Semantic color tokens (primary, secondary, accent, muted)
- Custom gradient definitions
- Shadow system with branded colors
- Smooth transition utilities
- Dark mode support
- Border radius system (20px default)

#### Components
✅ **Implemented:**
- All shadcn/ui components installed and configured
- Custom gradient button variants
- Card hover effects
- Animated icons and loaders
- Custom styling applied to all UI primitives

**Files:**
- `src/index.css` - Design system definition
- `tailwind.config.ts` - Tailwind configuration
- `src/components/ui/*` - All UI components

---

## 🔐 Authentication System

### Status: ✅ IMPLEMENTED

#### Features
✅ **Completed:**
- Email/password authentication
- Sign up flow with full name collection
- Login flow
- Session management
- Auto-redirect for authenticated users
- Email redirect URL configuration
- Auth state change listeners
- Logout functionality

⚠️ **Missing/Issues:**
- Email confirmation is NOT disabled (users need to manually disable in Supabase settings for testing)
- No password reset flow
- No social authentication (Google, etc.)
- No email validation using zod
- Profile table integration incomplete

**Files:**
- `src/pages/Auth.tsx` - Auth page (✅ implemented)
- Auth redirects working on all protected pages

**Database Tables:**
- `auth.users` - Managed by Supabase ✅
- `public.profiles` - ⚠️ NOT CREATED (mentioned in code but doesn't exist)

---

## 🗄️ Database Schema

### Status: ⚠️ PARTIALLY IMPLEMENTED

#### Tables Created

**1. habits**
```sql
✅ CREATED
Columns:
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- name (TEXT)
- description (TEXT)
- streak_count (INTEGER, default 0)
- last_completed_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

RLS Policies: ✅ Enabled
- Users can view their own habits
- Users can create their own habits
- Users can update their own habits
- Users can delete their own habits
```

**2. expenses**
```sql
✅ CREATED
Columns:
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- name (TEXT)
- total_amount (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

RLS Policies: ✅ Enabled
- Users can view expenses they created or are members of
- Users can create expenses
- Users can update their own expenses
- Users can delete their own expenses
```

**3. expense_members**
```sql
✅ CREATED
Columns:
- id (UUID, PK)
- expense_id (UUID, FK to expenses)
- user_id (UUID)
- amount_owed (DECIMAL)
- is_settled (BOOLEAN, default false)
- created_at (TIMESTAMP)

RLS Policies: ✅ Enabled
- Users can view members for their expenses
- Expense creators can add members
- Members can update their settlement status
```

**4. challenges**
```sql
✅ CREATED
Columns:
- id (UUID, PK)
- creator_id (UUID, FK to auth.users)
- name (TEXT)
- description (TEXT)
- start_date (DATE)
- end_date (DATE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

RLS Policies: ✅ Enabled
- Users can view challenges they created or participate in
- Users can create challenges
- Users can update their own challenges
- Users can delete their own challenges
```

**5. challenge_participants**
```sql
✅ CREATED
Columns:
- id (UUID, PK)
- challenge_id (UUID, FK to challenges)
- user_id (UUID)
- progress (INTEGER, default 0)
- joined_at (TIMESTAMP)

RLS Policies: ✅ Enabled
- Users can view participants for their challenges
- Challenge creators can add participants
- Participants can update their own progress
```

#### Database Functions & Triggers

✅ **Implemented:**
- `update_updated_at_column()` - Auto-updates timestamps
- Triggers on habits, expenses, challenges for auto-timestamp updates

⚠️ **Missing Tables:**
- `public.profiles` - User profile data (referenced in Profile.tsx but not created)
- `habit_check_ins` - Check-in tracking (referenced in Habits.tsx but not created)

#### Missing Functionality
❌ **Not Implemented:**
- Habit check-in table and logic
- Realtime subscriptions
- Database indexes for performance
- Cascade delete policies verification
- Storage buckets for user avatars

---

## 📱 Pages & Routing

### Status: ✅ MOSTLY IMPLEMENTED

#### Landing Page (`/`)
**File:** `src/pages/Index.tsx`  
**Status:** ✅ FULLY IMPLEMENTED

**Features:**
- ✅ Modern glassy hero section
- ✅ Gradient blobs background
- ✅ Toggle showcase (Users vs Friends tabs with auto-switch)
- ✅ Trust statistics cards
- ✅ Live streaks & splits cards (with dummy data)
- ✅ Features grid (4 items)
- ✅ How It Works (3 steps)
- ✅ Pricing teaser
- ✅ Final CTA section
- ✅ Fixed translucent header
- ✅ Bilingual support (EN/AR)
- ✅ Auto-redirect if logged in

**Issues:**
- No actual data integration (uses placeholder content)

---

#### Auth Page (`/auth`)
**File:** `src/pages/Auth.tsx`  
**Status:** ✅ FULLY IMPLEMENTED

**Features:**
- ✅ Login form
- ✅ Signup form
- ✅ Toggle between login/signup
- ✅ Email/password fields
- ✅ Full name field (signup)
- ✅ Form validation (basic HTML5)
- ✅ Error handling with toast notifications
- ✅ Auto-redirect on successful auth
- ✅ Auth state listener

**Issues:**
- ❌ No zod validation for email/password
- ❌ No password strength indicator
- ❌ No password reset functionality

---

#### Dashboard Page (`/dashboard`)
**File:** `src/pages/Dashboard.tsx`  
**Status:** ✅ FULLY IMPLEMENTED

**Features:**
- ✅ Authentication check
- ✅ Stats overview cards:
  - Active Habits count
  - Longest Streak
  - Active Challenges count
  - Pending Expenses count & total owed
- ✅ Quick Actions (3 gradient buttons to navigate to features)
- ✅ Pending Check-ins card
- ✅ Pending Settlements card
- ✅ Real-time data fetching from Supabase
- ✅ Loading states
- ✅ Error handling

**Issues:**
- ⚠️ Query uses `or()` filter which may not work correctly for challenges
- ⚠️ No realtime updates (data doesn't auto-refresh)

---

#### Habits Page (`/habits`)
**File:** `src/pages/Habits.tsx`  
**Status:** ⚠️ PARTIALLY IMPLEMENTED

**Features:**
✅ **Implemented:**
- Authentication check
- Habit list display
- Create habit dialog
- Emoji selector
- Habit name input
- Beautiful card UI with animations
- Bilingual support
- Loading states

❌ **Missing/Broken:**
- Check-in functionality (references non-existent `habit_check_ins` table)
- Streak calculation logic
- Best streak tracking
- Last check-in display
- Habit deletion
- Habit editing
- Empty state working but no data shown

**Critical Issues:**
- `habit_check_ins` table doesn't exist in database
- Fields mismatch: code uses `title`, `icon`, `current_streak`, `best_streak` but DB has `name`, `description`, `streak_count`

**Required Fixes:**
1. Create `habit_check_ins` table
2. Fix column name mismatches
3. Implement streak calculation logic
4. Add edit/delete functionality

---

#### Expenses Page (`/expenses`)
**File:** `src/pages/Expenses.tsx`  
**Status:** ❌ PLACEHOLDER ONLY

**Features:**
✅ **Implemented:**
- Authentication check
- Page layout with header
- Language toggle
- Navigation
- Empty state card

❌ **Not Implemented:**
- Create expense group functionality
- List expense groups
- Add expenses to groups
- Add members to expenses
- Calculate splits
- Mark as settled
- Payment tracking
- Settlement links

**Required Implementation:**
1. Create expense group dialog
2. Expense list view
3. Member management
4. Split calculation logic
5. Settlement tracking
6. WhatsApp share links

---

#### Challenges Page (`/challenges`)
**File:** `src/pages/Challenges.tsx`  
**Status:** ❌ PLACEHOLDER ONLY

**Features:**
✅ **Implemented:**
- Authentication check
- Page layout with header
- Language toggle
- Navigation
- Empty state card

❌ **Not Implemented:**
- Create challenge functionality
- List challenges
- Join challenge flow
- Challenge participants list
- Leaderboard
- Progress tracking
- Challenge completion logic

**Required Implementation:**
1. Create challenge dialog (name, description, dates)
2. Challenge list view (active/completed)
3. Join challenge flow
4. Progress tracking UI
5. Leaderboard component
6. Invite friends functionality

---

#### Profile Page (`/profile`)
**File:** `src/pages/Profile.tsx`  
**Status:** ⚠️ PARTIALLY IMPLEMENTED

**Features:**
✅ **Implemented:**
- Authentication check
- User data display (email, created date)
- Logout functionality
- Member since display
- Language preference display
- Account type display
- Beautiful gradient UI

❌ **Not Implemented:**
- Profile editing
- Avatar upload
- Full name editing
- Language preference saving
- Notification preferences
- Privacy settings

**Issues:**
- References `profiles` table which doesn't exist
- `full_name` comes from auth metadata, not profiles table
- No profile creation trigger

**Required Fixes:**
1. Create `profiles` table with trigger on user signup
2. Implement profile editing
3. Add avatar storage bucket
4. Add settings management

---

## 🧩 Components

### Status: ✅ IMPLEMENTED

#### Navigation Components
✅ **Mobile Navigation** (`src/components/Navigation.tsx`)
- Bottom tab bar (mobile only)
- 5 nav items with icons
- Active state highlighting
- Bounce animation on active
- Bilingual labels

✅ **Sidebar** (`src/components/AppSidebar.tsx`)
- Desktop sidebar navigation
- Collapsible state
- Active route highlighting
- Icon-only collapsed mode
- Bilingual labels

✅ **Language Toggle** (`src/components/LanguageToggle.tsx`)
- Language switcher component
- Existing in project

#### Layout
✅ **Dual Navigation System:**
- Desktop: Sidebar (left) + header with trigger
- Mobile: Bottom navigation
- Conditional rendering based on route
- Landing & Auth pages: no sidebar
- App pages: sidebar + mobile nav

---

## 🌐 Internationalization (i18n)

### Status: ✅ IMPLEMENTED

**Library:** `react-i18next`  
**Configuration:** `src/i18n/config.ts`

#### Features
✅ **Implemented:**
- English (EN) translations
- Arabic (AR) translations
- RTL support for Arabic
- Browser language detection
- localStorage persistence
- Namespace organization

#### Translation Coverage
✅ **Complete:**
- Navigation labels
- Hero section
- CTA buttons
- Features
- How It Works
- Pricing
- Habits page
- Expenses page
- Challenges page
- Dashboard page
- Common words (save, cancel, delete, etc.)

⚠️ **Incomplete:**
- Error messages (using hardcoded English)
- Form validation messages
- Toast notifications (mixed)

---

## 🔔 Reminders & Notifications

### Status: ❌ NOT IMPLEMENTED

**Requirement:** Push + WhatsApp reminders only (NO email, NO SMS)

#### Missing Features
❌ **Not Implemented:**
- Push notification integration
- WhatsApp notification integration
- Notification preferences
- Reminder scheduling
- Notification history
- In-app notification center

**Required Implementation:**
1. Set up push notification service (e.g., Firebase Cloud Messaging)
2. WhatsApp Business API integration or wa.me links
3. Notification preferences in profile
4. Reminder scheduling logic
5. Background jobs for sending reminders

---

## 🔗 Integrations

### Supabase (Lovable Cloud)
**Status:** ✅ CONNECTED

✅ **Features Enabled:**
- Database (PostgreSQL)
- Authentication
- Row Level Security
- Real-time (available but not used)

❌ **Not Used:**
- Storage (for avatars/files)
- Edge Functions
- Realtime subscriptions

### Third-Party Services
❌ **Required but Not Integrated:**
- Push notification service
- WhatsApp notification service
- Analytics (optional)

---

## 🎯 MVP Feature Completion Status

### 🔥 Habit Streaks
**Status:** ⚠️ 40% COMPLETE

✅ **Implemented:**
- Database table structure
- Create habit UI
- Habit list display
- Basic RLS policies

❌ **Missing:**
- `habit_check_ins` table
- Check-in functionality
- Streak calculation
- Best streak tracking
- Reminder integration
- Edit/delete habits
- Column name mismatches in code vs DB

**Blockers:**
- Database schema mismatch
- Missing check-in table

---

### 🏆 Friend Challenges
**Status:** ❌ 20% COMPLETE

✅ **Implemented:**
- Database tables (challenges, challenge_participants)
- RLS policies
- Dashboard integration (displays count)

❌ **Missing:**
- Complete UI implementation
- Create challenge flow
- Join challenge flow
- Progress tracking
- Leaderboard
- Invite friends
- Challenge completion logic

**Blockers:**
- No UI beyond placeholder

---

### 💸 Expense Splitter
**Status:** ❌ 30% COMPLETE

✅ **Implemented:**
- Database tables (expenses, expense_members)
- RLS policies
- Dashboard integration (shows pending count & amount)

❌ **Missing:**
- Complete UI implementation
- Create group/expense flow
- Add members functionality
- Split calculation display
- Settlement tracking
- Mark as settled
- Share settlement links

**Blockers:**
- No UI beyond placeholder

---

### 🔔 Reminders (Push + WhatsApp)
**Status:** ❌ 0% COMPLETE

❌ **Not Started:**
- Push notification setup
- WhatsApp integration
- Reminder scheduling
- Notification preferences
- Background jobs

**Blockers:**
- Requires external service integration
- No notification infrastructure

---

## 📊 Overall MVP Progress

### Summary
| Feature | Database | Backend Logic | UI/UX | Integration | Overall |
|---------|----------|---------------|-------|-------------|---------|
| **Authentication** | ✅ 100% | ✅ 90% | ✅ 100% | ✅ 100% | **✅ 95%** |
| **Habit Streaks** | ⚠️ 70% | ❌ 20% | ✅ 80% | ❌ 0% | **⚠️ 40%** |
| **Challenges** | ✅ 100% | ❌ 0% | ❌ 10% | ❌ 0% | **❌ 20%** |
| **Expense Splitter** | ✅ 100% | ❌ 0% | ❌ 10% | ❌ 0% | **❌ 30%** |
| **Reminders** | ❌ 0% | ❌ 0% | ❌ 0% | ❌ 0% | **❌ 0%** |
| **Dashboard** | ✅ 100% | ✅ 80% | ✅ 100% | ✅ 80% | **✅ 90%** |
| **Profile** | ❌ 0% | ⚠️ 50% | ✅ 90% | ⚠️ 50% | **⚠️ 50%** |
| **i18n** | N/A | N/A | ✅ 95% | ✅ 100% | **✅ 95%** |
| **Design System** | N/A | N/A | ✅ 100% | ✅ 100% | **✅ 100%** |

### **Overall Project Completion: ~45%**

---

## 🚧 Critical Issues & Blockers

### 🔴 High Priority (Blockers)

1. **Database Schema Mismatches**
   - `habits` table: Code uses `title`, `icon`, `current_streak`, `best_streak` but DB has `name`, `description`, `streak_count`
   - **Impact:** Habits page completely broken
   - **Fix:** Migrate DB or update code to match schema

2. **Missing `habit_check_ins` Table**
   - Code references this table but it doesn't exist
   - **Impact:** Check-in functionality non-functional
   - **Fix:** Create table with proper schema + RLS

3. **Missing `profiles` Table**
   - Profile page queries this table but it doesn't exist
   - **Impact:** Profile display partially broken
   - **Fix:** Create profiles table + trigger on user signup

4. **No Reminder System**
   - Core MVP feature completely missing
   - **Impact:** Cannot fulfill MVP promise
   - **Fix:** Integrate push notifications + WhatsApp

### ⚠️ Medium Priority

5. **Expenses & Challenges UI Not Implemented**
   - Only placeholder pages exist
   - **Impact:** 2/3 core features non-functional
   - **Fix:** Build complete CRUD interfaces

6. **No Realtime Updates**
   - Dashboard doesn't auto-refresh
   - **Impact:** Stale data display
   - **Fix:** Implement Supabase realtime subscriptions

7. **Email Confirmation Not Disabled**
   - Slows down testing
   - **Impact:** Poor developer experience
   - **Fix:** User needs to manually disable in Supabase settings

### 🟡 Low Priority

8. **No Form Validation**
   - Using basic HTML5 validation only
   - **Impact:** Poor UX, potential bad data
   - **Fix:** Implement zod validation

9. **No Error Boundaries**
   - App could crash on errors
   - **Impact:** Poor error handling
   - **Fix:** Add React error boundaries

10. **No Analytics**
    - No tracking of user behavior
    - **Impact:** No insights for improvement
    - **Fix:** Add analytics service

---

## ✅ Next Steps to MVP (Priority Order)

### Phase 1: Fix Critical Issues (Week 1)
1. ✅ Fix `habits` table schema mismatch
   - Option A: Migrate DB columns
   - Option B: Update code to use `name` instead of `title`
2. ✅ Create `habit_check_ins` table with RLS
3. ✅ Create `profiles` table with auto-creation trigger
4. ✅ Implement habit check-in logic
5. ✅ Fix habit streak calculation

### Phase 2: Complete Core Features (Week 2-3)
6. ✅ Build Expense Splitter UI
   - Create group dialog
   - Add expenses
   - Member management
   - Split calculation display
   - Settlement tracking
7. ✅ Build Challenges UI
   - Create challenge dialog
   - Challenge list
   - Join flow
   - Progress tracking
   - Leaderboard

### Phase 3: Notifications (Week 4)
8. ✅ Integrate Push Notifications
   - Set up FCM or similar
   - Request permissions
   - Send test notifications
9. ✅ Integrate WhatsApp Notifications
   - WhatsApp Business API or wa.me links
   - Template messages
10. ✅ Build reminder scheduling system

### Phase 4: Polish (Week 5)
11. ✅ Add form validation (zod)
12. ✅ Implement realtime subscriptions
13. ✅ Add error boundaries
14. ✅ Complete profile editing
15. ✅ Test all flows end-to-end
16. ✅ Fix remaining bugs

---

## 📝 Technical Debt

### Code Quality
⚠️ **Issues:**
- Type casting with `(supabase as any)` throughout codebase
- Missing TypeScript types for database entities
- No custom hooks for repeated logic
- Large component files (Habits.tsx = 261 lines)

### Performance
⚠️ **Issues:**
- No code splitting
- No lazy loading of routes
- All images loaded upfront on landing page
- No service worker/PWA features

### Security
⚠️ **Issues:**
- Auth credentials logged to console
- No rate limiting on auth endpoints
- No CSRF protection
- No input sanitization

### Testing
❌ **Missing:**
- No unit tests
- No integration tests
- No E2E tests
- No test coverage reports

---

## 🗂️ File Structure

```
linkup-sa-hub/
├── public/
│   ├── robots.txt
│   └── (favicon, placeholder images)
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components ✅
│   │   ├── Navigation.tsx   # Mobile nav ✅
│   │   ├── AppSidebar.tsx   # Desktop sidebar ✅
│   │   └── LanguageToggle.tsx ✅
│   ├── hooks/
│   │   └── use-mobile.tsx   ✅
│   ├── i18n/
│   │   └── config.ts        # i18n setup ✅
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts    # Supabase client ✅
│   │       └── types.ts     # Auto-generated types ✅
│   ├── lib/
│   │   └── utils.ts         # Utilities ✅
│   ├── pages/
│   │   ├── Index.tsx        # Landing ✅
│   │   ├── Auth.tsx         # Login/Signup ✅
│   │   ├── Dashboard.tsx    # Dashboard ✅
│   │   ├── Habits.tsx       # Habits ⚠️
│   │   ├── Expenses.tsx     # Expenses ❌
│   │   ├── Challenges.tsx   # Challenges ❌
│   │   ├── Profile.tsx      # Profile ⚠️
│   │   └── NotFound.tsx     # 404 ✅
│   ├── App.tsx              # App routing ✅
│   ├── index.css            # Design system ✅
│   └── main.tsx             # Entry point ✅
├── supabase/
│   └── config.toml          # Supabase config ✅
├── tailwind.config.ts       ✅
├── vite.config.ts           ✅
└── package.json             ✅
```

---

## 🎯 Definition of Done for MVP

To reach fully functional MVP stage, the following must be TRUE:

### Core Functionality
- [ ] Users can create and track habits with check-ins
- [ ] Streak calculations work correctly
- [ ] Users can create and join challenges
- [ ] Challenge leaderboards display correctly
- [ ] Users can create expense groups and add expenses
- [ ] Expense splits calculate correctly
- [ ] Users can mark expenses as settled
- [ ] Push notifications work for reminders
- [ ] WhatsApp notifications work for reminders

### Data Integrity
- [ ] All database tables exist and match code expectations
- [ ] RLS policies prevent unauthorized access
- [ ] No schema mismatches
- [ ] Proper cascade deletes

### User Experience
- [ ] All pages have loading states
- [ ] All errors show user-friendly messages
- [ ] Forms have proper validation
- [ ] Realtime updates work on dashboard
- [ ] Bilingual support works on all pages
- [ ] RTL layout works correctly for Arabic

### Authentication
- [ ] Users can sign up and log in
- [ ] Sessions persist correctly
- [ ] Logout works
- [ ] Protected routes redirect properly
- [ ] Profile data saves correctly

### Performance
- [ ] Pages load in < 3 seconds
- [ ] No console errors
- [ ] Mobile responsive on all pages
- [ ] Animations are smooth (60 FPS)

### Polish
- [ ] All copy is finalized
- [ ] All translations are complete
- [ ] Design is consistent across pages
- [ ] No placeholder content visible

---

## 🔐 Security Checklist

### Authentication
- [x] Email/password authentication enabled
- [ ] Email confirmation flow (currently NOT enforced)
- [ ] Password reset flow
- [ ] Session expiry handling
- [ ] Rate limiting on auth endpoints

### Database
- [x] RLS enabled on all tables
- [x] User-specific policies
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] Proper indexing

### Application
- [ ] HTTPS only
- [ ] CORS properly configured
- [ ] XSS prevention
- [ ] CSRF tokens
- [ ] Secure headers

---

## 📈 Metrics to Track

### User Engagement
- Daily active users
- Habit check-in rate
- Challenge completion rate
- Expense splits created

### Performance
- Page load times
- API response times
- Error rates
- Session duration

### Business
- User signups
- User retention (Day 1, Day 7, Day 30)
- Feature usage breakdown
- NPS score

---

## 🎓 Learning Resources & Documentation

### Project Dependencies
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **Vite:** https://vitejs.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Supabase:** https://supabase.com/docs
- **react-i18next:** https://react.i18next.com

### Internal Documentation
- Design system: `src/index.css`
- i18n keys: `src/i18n/config.ts`
- Database schema: Supabase dashboard or migration files
- Component library: `src/components/ui/`

---

## 🎉 Conclusion

**Current State:** The project has a solid foundation with a beautiful design system, authentication, and database structure in place. The landing page and dashboard are fully functional. However, **critical issues with schema mismatches and missing tables prevent the core MVP features from working.**

**Priority:** Fix database issues FIRST, then implement missing UI for Expenses and Challenges, then add notifications.

**Timeline to MVP:** Estimated **4-5 weeks** of focused development following the phased approach outlined above.

**Recommended Next Action:** Start with Phase 1, fixing the `habits` table schema mismatch and creating the missing `habit_check_ins` and `profiles` tables.

---

*Document generated: October 2, 2025*  
*Next review: After Phase 1 completion*
