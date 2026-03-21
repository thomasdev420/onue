import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
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

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const actionType = searchParams.get('actionType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get credit usage history
    const usageHistory = await creditService.getCreditUsageHistory(userEmail, {
      limit,
      actionType,
      startDate,
      endDate
    });
    
    return Response.json({
      success: true,
      data: usageHistory
    });

  } catch (error) {
    console.error('Error getting credit usage:', error);
    return Response.json({ 
      error: 'Failed to get credit usage',
      details: error.message 
    }, { status: 500 });
  }
} 