import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '../../../../supabaseClient';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Check if user has onboarding data (new integrated flow)
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
      // Check for both website data and personalization data
      hasCompleted = !!(onboardingData.websiteUrl && 
                       onboardingData.extractedData && 
                       onboardingData.personalizationAnswers &&
                       onboardingData.selectedVideoFormat);
    }
    
    return NextResponse.json({ hasCompleted });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 