# Supabase Auth Integration Setup Guide

## Overview
This application now uses Supabase Auth for authentication instead of the custom login system. Supabase provides Magic Link and Google OAuth authentication.

## Setup Steps

### 1. Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be fully provisioned

### 2. Get Your Supabase Credentials
1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 3. Configure Environment Variables
Add these to your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configure Supabase Auth Providers

#### Enable Magic Link (Email)
1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Email** provider
3. Configure email templates if needed

#### Enable Google OAuth
1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### 5. Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration** in Supabase
2. Add your site URLs:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: 
     - `http://localhost:3000/dashboard`
     - `https://your-production-domain.com/dashboard`

### 6. Backend Configuration
The backend has a `/auth/sync-user` endpoint that syncs Supabase users to your database. Make sure your backend is running and accessible at the `NEXT_PUBLIC_API_URL`.

## Features Implemented

### Frontend
- ✅ Supabase client initialization (`lib/supabase.ts`)
- ✅ Supabase Auth UI on login page with Magic Link and Google providers
- ✅ Updated AuthContext to use Supabase sessions
- ✅ Protected routes using Supabase session checks
- ✅ User sync to backend database on login
- ✅ API requests use Supabase JWT tokens

### Backend
- ✅ `/auth/sync-user` endpoint to sync Supabase users to database
- ✅ User model supports Supabase authentication

## Usage

### Login Flow
1. User visits `/login`
2. User can sign in with:
   - **Magic Link**: Enter email, receive magic link via email
   - **Google OAuth**: Click "Continue with Google"
3. After authentication, user is redirected to `/dashboard`
4. User is automatically synced to backend database

### Protected Routes
All routes under `/dashboard` are protected by the `ProtectedRoute` component, which:
- Checks for Supabase session
- Redirects to `/login` if not authenticated
- Shows loading state while checking

## Migration Notes

### Breaking Changes
- Old login/register endpoints are no longer used
- `localStorage` tokens are replaced with Supabase sessions
- Auth context API changed (removed `login` and `register` methods)

### User Migration
Existing users will need to:
1. Sign up again using Supabase Auth
2. Their data will be synced to the backend automatically

## Troubleshooting

### "Missing Supabase environment variables" error
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your Next.js dev server after adding env variables

### Google OAuth not working
- Verify redirect URI is correctly configured in Google Cloud Console
- Ensure redirect URI matches exactly: `https://your-project-ref.supabase.co/auth/v1/callback`

### User sync failing
- Check backend is running and accessible
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend logs for sync errors

## Next Steps

1. Set up email templates in Supabase for Magic Link
2. Configure additional OAuth providers if needed (GitHub, etc.)
3. Add user profile management
4. Implement password reset flow using Supabase
