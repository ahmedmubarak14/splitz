# Supabase Database Setup Instructions

## Step 1: Access Your Supabase Dashboard

1. Go to https://supabase.com
2. Sign in to your account
3. Select your project

## Step 2: Run the Database Schema

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase/complete-schema.sql` in this repository
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** button

This will create:
- ✅ All database tables (profiles, tasks, habits, expenses, trips)
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Automatic triggers for timestamps
- ✅ User profile creation on signup
- ✅ Storage bucket for avatars

## Step 3: Verify Tables Were Created

1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - profiles
   - tasks
   - habits
   - habit_checkins
   - expenses
   - trips
   - trip_expenses
   - trip_tasks

## Step 4: Get Your API Keys

1. Click **"Settings"** (gear icon) in left sidebar
2. Click **"API"**
3. Copy these two values:
   - **Project URL** (looks like: https://xxx.supabase.co)
   - **anon public key** (long string starting with eyJ...)

## Step 5: Add API Keys to Your Apps

### For Web App:
Create/update `packages/web/.env`:
```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### For Mobile App:
Create/update `packages/mobile/.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 6: Test the Connection

### Test Web:
```bash
npm run web:dev
```
Try to register a new user. If successful, check Supabase Table Editor → profiles table.

### Test Mobile:
```bash
npm run mobile
```
Scan QR code and try to register. Check profiles table again.

## Troubleshooting

### Error: "relation does not exist"
→ The SQL script didn't run completely. Run it again.

### Error: "new row violates row-level security"
→ RLS policies not set up. Make sure you ran the complete schema.

### Users can't sign up
→ Check that the `handle_new_user()` function and trigger exist:
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

### Can't upload avatars
→ Storage bucket not created. Run the storage section of the schema again.

## What Each Table Does

| Table | Purpose |
|-------|---------|
| **profiles** | User information (name, email, avatar) |
| **tasks** | User's tasks with priority and due dates |
| **habits** | User's habits with frequency and streaks |
| **habit_checkins** | Daily/weekly check-ins for habits |
| **expenses** | Personal expenses with categories |
| **trips** | User's trip plans |
| **trip_expenses** | Expenses associated with trips |
| **trip_tasks** | Tasks/todos for specific trips |

## Security Features

✅ **Row Level Security (RLS)** - Users can only see their own data
✅ **Automatic timestamps** - created_at and updated_at are automatic
✅ **Cascading deletes** - Delete user → all their data deleted
✅ **Input validation** - Check constraints on data
✅ **Secure storage** - Avatar images with proper policies

## Need Help?

If you encounter issues:
1. Check Supabase logs (Dashboard → Logs)
2. Verify RLS is enabled (Table Editor → Select table → Settings)
3. Test with SQL Editor:
```sql
-- Test if you can insert a task
INSERT INTO tasks (user_id, title, description)
VALUES (auth.uid(), 'Test Task', 'Testing');
```

Your database is now ready! 🎉
