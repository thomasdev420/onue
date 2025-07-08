import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Lazy validation function to avoid build-time issues
function validateRequiredEnvVars() {
  const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
  }
  
  return missingVars.length === 0;
}

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
];

export const authOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign in attempt:', { user: user?.email, provider: account?.provider });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl });
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (typeof url === 'string' && typeof baseUrl === 'string' && /^https?:\/\//.test(url) && /^https?:\/\//.test(baseUrl)) {
        try {
          const urlOrigin = new URL(url).origin;
          const baseUrlOrigin = new URL(baseUrl).origin;
          if (urlOrigin === baseUrlOrigin) return url;
        } catch (error) {
          console.warn('Invalid URL in redirect callback:', error);
        }
      }
      return baseUrl;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };