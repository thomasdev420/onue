import { getServerSession } from 'next-auth/next';

// Define authOptions inline to match the ProductionSessionProvider
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
import { getCurrentUserBusinessContext } from '../../../app/services/businessContextService';

export async function GET() {
  try {
    // In development mode, bypass authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    let userEmail;
    let userName;
    
    if (isDev) {
      userEmail = 'dev@local.com';
      userName = 'Dev User';
    } else {
      try {
        // Get the current session
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
          return Response.json({ error: 'Unauthorised' }, { status: 401 });
        }
        userEmail = session.user.email;
        userName = session.user.name;
      } catch (authError) {
        console.error('Auth error:', authError);
        return Response.json({ error: 'Authentication error' }, { status: 401 });
      }
    }

    // Get business context
    const businessContext = await getCurrentUserBusinessContext();

    return Response.json({
      user: {
        name: userName,
        email: userEmail
      },
      businessContext: businessContext,
      hasCompleteContext: !!(businessContext?.companyName && businessContext?.personalization),
      contextSummary: {
        companyName: businessContext?.companyName || 'Not set',
        businessType: businessContext?.businessType || 'Not set',
        productInfo: businessContext?.productInfo || 'Not set',
        websiteUrl: businessContext?.websiteUrl || 'Not set',
        hasPersonalization: !!(businessContext?.personalization),
        personalizationFields: businessContext?.personalization ? Object.keys(businessContext.personalization) : []
      }
    });

  } catch (error) {
    console.error('Error in test-context API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 