import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
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
    const { actionType, success = true, errorMessage = null } = await req.json();
    
    if (!actionType) {
      return Response.json({ error: 'Action type is required' }, { status: 400 });
    }

    // Consume credits for the action
    const result = await creditService.consumeCreditsForAction(userEmail, actionType, success, errorMessage);
    
    return Response.json({
      success: result.success,
      data: result,
      error: result.error || null
    });

  } catch (error) {
    console.error('Error consuming credits:', error);
    return Response.json({ 
      error: 'Failed to consume credits',
      details: error.message 
    }, { status: 500 });
  }
} 