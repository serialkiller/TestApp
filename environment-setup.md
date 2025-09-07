# Environment Setup for Husains App

## Quick Start

Create a `.env.local` file in the root directory with the following content:

```bash
# Copy the content below and save as .env.local

# ==============================================
# SUPABASE CONFIGURATION (Optional but Recommended)
# ==============================================
# The app works with local storage if these are not provided
# Get these from your Supabase project: Settings > API

# Your Supabase project URL (looks like: https://your-project.supabase.co)
NEXT_PUBLIC_SUPABASE_URL=

# Your Supabase service role key (NOT the anon key!)
# This is a SECRET key with full database access - only use server-side
SUPABASE_SERVICE_ROLE_KEY=

# ==============================================
# API KEY STORAGE (Optional)
# ==============================================
# If you want to store an API key server-side instead of using Supabase configs
# This is a fallback option if Supabase is not configured

# Your OpenAI API key (or other AI service API key)
API_KEY=
```

## How It Works

### Option 1: Local Storage Only (Simplest)
- Leave all environment variables empty
- The app will work entirely with browser local storage
- Conversations are stored locally on each device

### Option 2: Server-side API Key (Simple)
- Set the `API_KEY` environment variable with your OpenAI API key
- Leave Supabase variables empty
- API key is stored securely server-side
- Conversations still use local storage

### Option 3: Full Supabase Integration (Recommended)
- Set up a free Supabase account at [supabase.com](https://supabase.com)
- Follow the setup instructions in `SUPABASE_SETUP.md`
- Set both `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Conversations sync across devices
- API keys managed through the config UI

## Security Notes

- **NEVER** commit `.env.local` to version control
- The service role key has full database access - keep it secret
- For production, set these variables in your deployment platform (Vercel, etc.)

## Build and Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
