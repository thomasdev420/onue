import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getSupabase } from '../../../../supabaseClient';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Check if user has onboarding data (new integrated flow)
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_work')
      .select('work_data')
      .eq('user_id', session.user.email)
      .eq('page_type', 'onboarding')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Check if onboarding is complete by looking for required fields
    let hasCompleted = false;
    if (data?.work_data) {
      const onboardingData = data.work_data;
      
      // Check for the actual fields that are saved during onboarding
      // We consider onboarding complete if we have website data and business info
      hasCompleted = !!(onboardingData.websiteUrl && 
                       onboardingData.extractedData && 
                       onboardingData.businessInfo &&
                       onboardingData.completedAt);
      
      // Fallback: if we have any substantial onboarding data, consider it complete
      // This handles cases where users might have partial data from previous versions
      if (!hasCompleted && onboardingData.websiteUrl && onboardingData.extractedData) {
        console.log('🔍 Onboarding Status Check: Using fallback completion for user:', session.user.email);
        hasCompleted = true;
      }
      
      console.log('🔍 Onboarding Status Check:', {
        user: session.user.email,
        hasData: !!data?.work_data,
        fields: {
          websiteUrl: !!onboardingData.websiteUrl,
          extractedData: !!onboardingData.extractedData,
          businessInfo: !!onboardingData.businessInfo,
          tiktokSuggestions: !!onboardingData.tiktokSuggestions,
          completedAt: !!onboardingData.completedAt
        },
        hasCompleted
      });
    } else {
      console.log('🔍 Onboarding Status Check: No data found for user:', session.user.email);
    }
    
    return NextResponse.json({ hasCompleted });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 