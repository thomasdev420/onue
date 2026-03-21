import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import { getSupabase } from '../../../../supabaseClient';

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

    // Fetch user's onboarding data from Supabase
    let onboardingData = null;
    let error = null;
    
    try {
      // Check if Supabase is properly configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.warn('Supabase environment variables not configured, using default context');
        throw new Error('Supabase not configured');
      }
      
      const supabase = getSupabase();
      const result = await supabase
        .from('user_work')
        .select('work_data')
        .eq('user_id', userEmail)
        .eq('page_type', 'onboarding')
        .single();
      
      onboardingData = result.data;
      error = result.error;
    } catch (dbError) {
      console.error('Database error:', dbError);
      // If table doesn't exist or other database issues, continue with default context
    }

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Supabase error:', error);
      // Don't return error, just use default context
    }

    // If no onboarding data found or database issues, return default context
    if (!onboardingData?.work_data) {
      return Response.json({
        businessContext: {
          companyName: 'Your Business',
          businessType: 'General',
          productInfo: 'Your products and services'
        }
      });
    }

    // Extract business context from work_data
    const workData = onboardingData.work_data;
    const businessContext = {
      companyName: workData.extractedData?.companyName || 'Your Business',
      businessType: workData.extractedData?.productType || 'General',
      productInfo: workData.extractedData?.productInfo || 'Your products and services',
      websiteUrl: workData.websiteUrl,
      personalization: workData.personalizationAnswers || {}
    };

    return Response.json({ businessContext });

  } catch (error) {
    console.error('Error in business-context API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 