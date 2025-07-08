export async function GET() {
  try {
    const { getSupabase } = await import('../../../supabaseClient');
    const supabase = getSupabase();
    
    // Test if the user_work table exists
    const { data, error } = await supabase
      .from('user_work')
      .select('*')
      .limit(1);
    
    if (error) {
      // Check if it's a table not found error
      if (error.code === '42P01') {
        return Response.json({
          status: 'error',
          message: 'Supabase connected but user_work table is missing',
          error: error.message,
          code: error.code,
          solution: 'Run the database setup SQL in Supabase SQL Editor'
        }, { status: 500 });
      }
      
      return Response.json({
        status: 'error',
        message: 'Supabase connection failed',
        error: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    return Response.json({
      status: 'success',
      message: 'Supabase connection working and user_work table exists',
      tableExists: true,
      environment: process.env.NODE_ENV,
      autoSaveReady: true
    });
    
  } catch (error) {
    return Response.json({
      status: 'error',
      message: 'Failed to connect to Supabase',
      error: error.message,
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
} 