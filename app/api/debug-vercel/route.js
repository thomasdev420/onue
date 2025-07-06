import { configValidator } from '../../utils/productionConfig';

export async function GET() {
  try {
    // Get comprehensive configuration status
    const configStatus = configValidator.getConfigurationStatus();
    
    // Test Supabase connection if configured
    if (configStatus.environmentVariables.isValid) {
      try {
        const { getSupabase } = await import('../../../supabaseClient.js');
        const supabase = getSupabase();
        const { data, error } = await supabase.from('user_work').select('count').limit(1);
        
        if (error) {
          configStatus.services = {
            ...configStatus.services,
            supabase: { status: 'error', message: error.message }
          };
        } else {
          configStatus.services = {
            ...configStatus.services,
            supabase: { status: 'connected' }
          };
        }
      } catch (error) {
        configStatus.services = {
          ...configStatus.services,
          supabase: { status: 'error', message: error.message }
        };
      }

      // Test OpenAI connection if configured
      if (process.env.OPENAI_API_KEY) {
        try {
          const OpenAI = await import('openai');
          const openai = new OpenAI.default({ apiKey: process.env.OPENAI_API_KEY });
          await openai.models.list();
          configStatus.services = {
            ...configStatus.services,
            openai: { status: 'connected' }
          };
        } catch (error) {
          configStatus.services = {
            ...configStatus.services,
            openai: { status: 'error', message: error.message }
          };
        }
      }
    }

    return Response.json(configStatus);
  } catch (error) {
    return Response.json({
      error: 'Debug endpoint failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 