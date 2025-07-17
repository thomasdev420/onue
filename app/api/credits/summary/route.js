import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { creditService } from '../../../services/creditService';

export async function GET(req) {
  try {
    // In development mode, bypass authentication
    const isDev = process.env.NODE_ENV === 'development';
    
    let userEmail;
    if (isDev) {
      userEmail = 'dev@local.com';
    } else {
      try {
        // Get the current session
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
          return Response.json({ error: 'Unauthorised' }, { status: 401 });
        }
        userEmail = session.user.email;
      } catch (authError) {
        console.error('Auth error:', authError);
        return Response.json({ error: 'Authentication error' }, { status: 401 });
      }
    }

    // Get user's credit summary
    const creditSummary = await creditService.getUserCreditSummary(userEmail);
    
    return Response.json({
      success: true,
      data: creditSummary
    });

  } catch (error) {
    console.error('Error getting credit summary:', error);
    return Response.json({ 
      error: 'Failed to get credit summary',
      details: error.message 
    }, { status: 500 });
  }
} 