import { getServerSession } from 'next-auth/next';
import { unifiedContentEngine } from '../../services/unifiedContentEngine.js';
import { 
  analyzePromptClarity, 
  generateClarificationResponse, 
  isClarificationResponse,
  extractClarifiedInformation,
  buildEnhancedPrompt
} from '../../utils/clarificationSystem.js';

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
    const { prompt, slideCount = 5, businessContext, userInfo, forceGenerate, isClarificationFollowup, originalAnalysis, existingSlidesContext, existingSlides = [] } = await req.json();

    // Validate required fields
    if (!prompt) {
      return Response.json({ 
        error: 'Prompt is required',
        code: 'MISSING_PROMPT'
      }, { status: 400 });
    }

    if (!slideCount || slideCount < 1 || slideCount > 20) {
      return Response.json({ 
        error: 'Slide count must be between 1 and 20',
        code: 'INVALID_SLIDE_COUNT'
      }, { status: 400 });
    }

    // Validate prompt length
    if (prompt.length > 2000) {
      return Response.json({ 
        error: 'Prompt too long. Maximum 2000 characters allowed.',
        code: 'PROMPT_TOO_LONG'
      }, { status: 400 });
    }

    // Check authentication in production
    const isDev = process.env.NODE_ENV === 'development';
    
    if (!isDev) {
      // Temporarily allow all requests in production until auth is properly configured
      // TODO: Implement proper authentication check when NEXTAUTH_SECRET is set
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

    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key not configured');
      return Response.json({ 
        error: 'AI service not configured',
        code: 'SERVICE_UNAVAILABLE'
      }, { status: 500 });
    }

    // If forceGenerate is true or this is a clarification followup, always generate slides
    if (forceGenerate || isClarificationFollowup) {
      try {
        console.log('Using unified content engine for slide generation');
        
        const slides = await unifiedContentEngine.generateCompleteSlides({
          prompt,
          slideCount,
          businessContext,
          userInfo,
          existingSlides
        });
        
        return Response.json({ slides });
      } catch (error) {
        console.error('Unified content engine error:', error);
        return Response.json({ 
          error: 'Failed to generate slides',
          details: error.message
        }, { status: 500 });
      }
    }

    // For ChatBar requests, use clarification system
    console.log('Analyzing prompt clarity for ChatBar request...');
    
    const analysis = await analyzePromptClarity(prompt, { businessContext, userInfo });
    
    if (analysis.needsClarification) {
      console.log('Prompt needs clarification, generating clarification response');
      const clarificationResponse = await generateClarificationResponse(analysis, { businessContext, userInfo });
      
      return Response.json({
        needsClarification: true,
        clarification: clarificationResponse,
        analysis
      });
    }

    // If no clarification needed, generate slides using unified content engine
    console.log('Prompt is clear, generating slides with unified content engine');
    
    try {
      const slides = await unifiedContentEngine.generateCompleteSlides({
        prompt,
        slideCount,
        businessContext,
        userInfo,
        existingSlides
      });
      
      return Response.json({ slides });
    } catch (error) {
      console.error('Unified content engine error:', error);
      return Response.json({ 
        error: 'Failed to generate slides',
        details: error.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in generate-slides API:', error);
    
    // Handle specific OpenAI errors
    if (error.message.includes('API key')) {
      return Response.json({ 
        error: 'AI service not configured',
        code: 'SERVICE_UNAVAILABLE'
      }, { status: 500 });
    }
    
    if (error.message.includes('rate limit')) {
      return Response.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT'
      }, { status: 429 });
    }
    
    if (error.message.includes('quota')) {
      return Response.json({ 
        error: 'Service quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED'
      }, { status: 429 });
    }
    
    return Response.json({ 
      error: 'Failed to generate slides. Please try again.',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
} 