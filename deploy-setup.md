# Deployment Setup Guide

## Environment Variables Required

To deploy successfully, you need to add these environment variables to your Vercel project:

### Required Variables:
1. **OPENAI_API_KEY** - Your OpenAI API key
2. **NEXT_PUBLIC_SUPABASE_URL** - Your Supabase project URL
3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Your Supabase anonymous key
4. **NEXTAUTH_SECRET** - A random string for NextAuth (generate one)
5. **NEXTAUTH_URL** - Your production URL (e.g., https://your-app.vercel.app)

### Optional Variables (for full functionality):
6. **GOOGLE_CLIENT_ID** - Google OAuth client ID
7. **GOOGLE_CLIENT_SECRET** - Google OAuth client secret
8. **TIKTOK_CLIENT_KEY** - TikTok API client key
9. **TIKTOK_CLIENT_SECRET** - TikTok API client secret

## How to Add Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Add each variable:
   - **Name**: The variable name (e.g., `OPENAI_API_KEY`)
   - **Value**: The actual value
   - **Environment**: Select "Production" (and "Preview" if needed)
5. Click "Save"

## Generate NEXTAUTH_SECRET:

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

Or use an online generator and copy a random string.

## Test Deployment:

After adding the environment variables, your deployment should work. The build will now succeed because:

1. ✅ OpenAI client is initialized lazily (only when needed)
2. ✅ Environment variables are properly configured
3. ✅ All API routes handle missing environment variables gracefully

## Troubleshooting:

If you still get build errors:
1. Check that all required environment variables are set
2. Ensure the variable names match exactly (case-sensitive)
3. Verify the values are correct
4. Check the Vercel build logs for specific error messages 