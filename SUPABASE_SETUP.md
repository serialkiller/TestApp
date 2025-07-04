# Supabase Setup Guide

## Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" and sign up
3. Create a new organization (free)

## Step 2: Create New Project
1. Click "New Project"
2. Choose your organization
3. Enter project name (e.g., "chat-app")
4. Enter database password (save this!)
5. Choose region closest to you
6. Click "Create new project"

## Step 3: Set Up Database
1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the contents of `supabase-setup.sql`
4. Click **Run** to execute the SQL

## Step 4: Get Your Keys
1. Go to **Settings** → **API** in your Supabase dashboard
2. You'll see two important sections:

### Project URL
- Copy the **Project URL** (looks like: `https://your-project.supabase.co`)
- This goes in: `NEXT_PUBLIC_SUPABASE_URL`

### API Keys
- **anon public** key: This is for client-side (we don't use this)
- **service_role secret** key: This is for server-side (we use this)
- Copy the **service_role secret** key
- This goes in: `SUPABASE_SERVICE_ROLE_KEY`

## Step 5: Add Environment Variables
In your Vercel dashboard:
1. Go to your project settings
2. Click **Environment Variables**
3. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key-here
```

## Step 6: Deploy
1. Push your code to GitHub
2. Deploy to Vercel
3. Your app will now use Supabase for storage!

## 🔒 Security Notes
- **NEVER** expose the `service_role` key in client-side code
- The `service_role` key has full database access
- Only use it in API routes (server-side)
- The `anon` key is safe for client-side but we don't need it

## 🆓 Free Tier Limits
- 500MB database storage
- 50,000 monthly active users
- 2GB bandwidth
- Perfect for personal chat apps! 