import { creditService } from '../../../services/creditService';

export async function GET(req) {
  try {
    // Get available subscription tiers
    const tiers = await creditService.getSubscriptionTiers();
    
    return Response.json({
      success: true,
      data: tiers
    });

  } catch (error) {
    console.error('Error getting subscription tiers:', error);
    return Response.json({ 
      error: 'Failed to get subscription tiers',
      details: error.message 
    }, { status: 500 });
  }
} 