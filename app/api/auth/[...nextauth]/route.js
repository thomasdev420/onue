export const runtime = "nodejs";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Validate environment variables
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

// Validate on startup
validateRequiredEnvVars();

const providers = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code"
      }
    }
  }),
];

export const authOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
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
      console.log('🔐 Sign in attempt:', { 
        user: user?.email, 
        provider: account?.provider,
        account: account ? 'present' : 'missing'
      });
      
      // Allow all sign-ins for now
      return true;
    },
    async jwt({ token, user, account, profile }) {
      console.log('🔄 JWT callback:', { 
        token: token ? 'present' : 'missing',
        user: user ? 'present' : 'missing',
        account: account ? 'present' : 'missing'
      });
      
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('📋 Session callback:', { 
        session: session ? 'present' : 'missing',
        token: token ? 'present' : 'missing',
        userEmail: session?.user?.email
      });
      
      // Send properties to the client
      session.user.id = token.sub;
      session.accessToken = token.accessToken;
      session.provider = token.provider;
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl });
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      
      // Allows callback URLs on the same origin
      else if (typeof url === 'string' && typeof baseUrl === 'string' && /^https?:\/\//.test(url) && /^https?:\/\//.test(baseUrl)) {
        try {
          const urlOrigin = new URL(url).origin;
          const baseUrlOrigin = new URL(baseUrl).origin;
          if (urlOrigin === baseUrlOrigin) return url;
        } catch (error) {
          console.warn('⚠️ Invalid URL in redirect callback:', error);
        }
      }
      
      return baseUrl;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };