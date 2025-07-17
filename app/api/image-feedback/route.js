import { getServerSession } from 'next-auth/next';
import { imageFeedbackService } from '../../services/imageFeedbackService.js';
import { apiLogger } from '../../utils/logger.js';

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

export async function POST(req) {
  try {
    const { imageId, imageUrl, prompt, feedback, reason } = await req.json();

    // Validate required fields
    if (!imageId || !imageUrl || !prompt || !feedback) {
      return Response.json({ 
        error: 'Missing required fields: imageId, imageUrl, prompt, feedback',
        code: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    // Validate feedback type
    const validFeedbackTypes = ['relevant', 'irrelevant', 'perfect'];
    if (!validFeedbackTypes.includes(feedback)) {
      return Response.json({ 
        error: 'Invalid feedback type. Must be one of: relevant, irrelevant, perfect',
        code: 'INVALID_FEEDBACK_TYPE'
      }, { status: 400 });
    }

    // Check authentication
    const isDev = process.env.NODE_ENV === 'development';
    let userEmail = null;
    
    if (!isDev) {
      if (!process.env.NEXTAUTH_SECRET) {
        console.warn('NEXTAUTH_SECRET not set - allowing all requests');
      } else {
        const session = await getServerSession(authOptions);
        if (!session) {
          return Response.json({ 
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          }, { status: 401 });
        }
        userEmail = session.user?.email;
      }
    } else {
      userEmail = 'dev@local.com';
    }

    if (!userEmail) {
      return Response.json({ 
        error: 'User email not found',
        code: 'USER_NOT_FOUND'
      }, { status: 400 });
    }

    // Store the feedback
    const success = await imageFeedbackService.storeImageFeedback({
      imageId,
      imageUrl,
      prompt,
      feedback,
      userEmail,
      reason
    });

    if (!success) {
      return Response.json({ 
        error: 'Failed to store feedback',
        code: 'STORAGE_ERROR'
      }, { status: 500 });
    }

    apiLogger.info(`Image feedback stored: ${feedback} for image ${imageId} by ${userEmail}`);

    return Response.json({ 
      success: true,
      message: 'Feedback stored successfully'
    });

  } catch (error) {
    apiLogger.error('Error in image feedback API:', error);
    
    return Response.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get('imageId');
    const userEmail = searchParams.get('userEmail');

    // Check authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev) {
      if (!process.env.NEXTAUTH_SECRET) {
        console.warn('NEXTAUTH_SECRET not set - allowing all requests');
      } else {
        const session = await getServerSession(authOptions);
        if (!session) {
          return Response.json({ 
            error: 'Authentication required',
            code: 'UNAUTHORIZED'
          }, { status: 401 });
        }
      }
    }

    if (imageId) {
      // Get feedback statistics for a specific image
      const stats = await imageFeedbackService.getImageFeedbackStats(imageId);
      return Response.json({ stats });
    }

    if (userEmail) {
      // Get user's feedback patterns
      const patterns = await imageFeedbackService.getSimilarPromptFeedback('', userEmail);
      return Response.json({ patterns });
    }

    return Response.json({ 
      error: 'Missing query parameters: imageId or userEmail',
      code: 'MISSING_PARAMS'
    }, { status: 400 });

  } catch (error) {
    apiLogger.error('Error in image feedback GET API:', error);
    
    return Response.json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
} 