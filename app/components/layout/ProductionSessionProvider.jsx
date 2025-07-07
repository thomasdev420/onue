import { getServerSession } from "next-auth/next";
import SessionProviderWrapper from "../../SessionProviderWrapper";

// Define authOptions inline to avoid import issues
const authOptions = {
  providers: [
    {
      id: "google",
      name: "Google",
      type: "oauth",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
        },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://www.googleapis.com/oauth2/v2/userinfo",
    },
  ],
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
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  }
};

export default async function ProductionSessionProvider({ children }) {
  try {
    const session = await getServerSession(authOptions);
    return (
      <SessionProviderWrapper session={session}>
        {children}
      </SessionProviderWrapper>
    );
  } catch (error) {
    console.error('Error getting server session:', error);
    // Fallback to no session if there's an error
    return (
      <SessionProviderWrapper session={null}>
        {children}
      </SessionProviderWrapper>
    );
  }
} 