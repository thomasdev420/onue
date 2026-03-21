import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import { creditService } from '../../../services/creditService';

export async function POST(req) {
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

    // Parse request body
    const { actionType } = await req.json();
    
    if (!actionType) {
      return Response.json({ error: 'Action type is required' }, { status: 400 });
    }

    // Check if user has enough credits for the action
    const creditCheck = await creditService.checkCreditsForAction(userEmail, actionType);
    
    return Response.json({
      success: true,
      data: creditCheck
    });

  } catch (error) {
    console.error('Error checking credits:', error);
    return Response.json({ 
      error: 'Failed to check credits',
      details: error.message 
    }, { status: 500 });
  }
} 