# Vercel Deployment Setup

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### Essential Variables (Required for AI functionality)
```
OPENAI_API_KEY=your_openai_api_key_here
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### Supabase Configuration (Required for data persistence)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Variables (For full functionality)
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/auth/tiktok/callback
```

## How to Add Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the correct name and value
5. Redeploy your project

## Common Issues:

1. **AI not working**: Missing `OPENAI_API_KEY`
2. **Authentication errors**: Missing `NEXTAUTH_SECRET` or incorrect `NEXTAUTH_URL`
3. **Data not saving**: Missing Supabase credentials
4. **Web scraping failing**: Missing OpenAI API key (used for content analysis)

## Testing:

After setting environment variables, test these endpoints:
- `/api/ai-chat` - Should return AI responses
- `/api/scrape-website` - Should scrape and analyze websites
- `/api/generate-slides` - Should generate slide content 