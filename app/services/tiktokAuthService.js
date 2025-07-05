// TikTok OAuth URL generator
export function getTikTokAuthUrl() {
  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI;
  const scope = 'user.info.basic';
  const state = Math.random().toString(36).substring(2, 15); // random string for CSRF protection
  return `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
} 