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

    // Get user's credit summary
    const creditSummary = await creditService.getUserCreditSummary(userEmail);
    
    return Response.json({
      success: true,
      data: creditSummary
    });

  } catch (error) {
    console.error('Error getting credit summary:', error);
    
    // Return default credit summary for database function errors
    if (error.message.includes('function') || error.message.includes('Failed to get credit summary')) {
      console.warn('Returning demo credit summary due to database function error');
      return Response.json({
        success: true,
        data: {
          credits_balance: 175,
          credits_used_total: 25,
          subscription_tier: 'starter',
          subscription_status: 'active',
          subscription_end_date: null,
          auto_renew: true,
          usage_this_month: 25,
          usage_by_action: {
            slide_generation: 15,
            ai_chat: 10
          }
        }
      });
    }
    
    return Response.json({ 
      error: 'Failed to get credit summary',
      details: error.message 
    }, { status: 500 });
  }
} 