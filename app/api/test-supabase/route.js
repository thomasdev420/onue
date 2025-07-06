import { getSupabase } from '../../../supabaseClient';

export async function GET() {
  try {
    // Test Supabase connection
    const supabase = getSupabase();
    
    // Test basic connection by trying to access the user_work table
    const { data, error } = await supabase
      .from('user_work')
      .select('count')
      .limit(1);
    
    const connectionStatus = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
      connection: error ? 'failed' : 'success',
      error: error ? error.message : null
    };

    return Response.json({
      message: 'Supabase connection test',
      timestamp: new Date().toISOString(),
      status: connectionStatus,
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing'
      }
    });
  } catch (error) {
    return Response.json({
      error: 'Supabase test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 