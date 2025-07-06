import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
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