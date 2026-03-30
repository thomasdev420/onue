# 🚨 URGENT: Google Sign-In Fix for Vercel Deployment

## **IMMEDIATE STEPS TO FIX:**

### 1. **Check Your Vercel Environment Variables**
Go to your Vercel dashboard, then Project Settings, then Environment Variables, and ensure you have:

```
NEXTAUTH_SECRET=your_32_character_secret_key_here
NEXTAUTH_URL=https://your-actual-vercel-domain.vercel.app
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 2. **Generate a New NEXTAUTH_SECRET**
If you don't have one or it's too short, generate a new one:
```bash
openssl rand -base64 32
```

### 3. **Update Google OAuth Redirect URIs**
In your Google Cloud Console:
1. Go to APIs & Services, then Credentials
2. Edit your OAuth 2.0 Client ID
3. Add these Authorized redirect URIs:
   ```
   https://your-actual-vercel-domain.vercel.app/api/auth/callback/google
   ```

### 4. **Test the Fix**
After updating environment variables, visit:
```
https://your-actual-vercel-domain.vercel.app/api/debug-auth
```

This will show you exactly what's wrong.

## **Common Issues & Solutions:**

### ❌ **Issue: "Invalid redirect_uri"**
**Solution:** Update Google OAuth redirect URIs to match your Vercel domain

### ❌ **Issue: "Missing NEXTAUTH_SECRET"**
**Solution:** Generate and add a 32+ character secret to Vercel

### ❌ **Issue: "NEXTAUTH_URL mismatch"**
**Solution:** Ensure NEXTAUTH_URL matches your exact Vercel domain

### ❌ **Issue: "Google client credentials missing"**
**Solution:** Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel

## **Verification Steps:**

1. **Deploy the updated code** (I've added debugging)
2. **Visit `/api/debug-auth`** to see the exact issue
3. **Check Vercel logs** for authentication errors
4. **Test sign-in** after fixing environment variables

## **Emergency Fallback:**

If Google auth still fails, the app will work in development mode, but you need to fix the production environment variables for live deployment.

**Priority:** Fix environment variables in Vercel dashboard immediately! 