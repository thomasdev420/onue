import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
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

    // Fetch TikTok accounts from database
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('tiktok_connections')
        .select('*')
        .eq('user_id', userEmail);

      if (error) {
        console.error('Database error fetching TikTok accounts:', error);
        return Response.json({ error: 'Database error' }, { status: 500 });
      }

      // Transform the data to match the analytics page format
      const tiktokAccounts = (data || []).map(account => ({
        avatar: account.avatar_url || '/default-profile.png',
        name: account.display_name || 'TikTok Account',
        handle: `@${account.username || 'tiktokuser'}`,
        platform: 'tiktok',
        type: 'Connected',
        status: 'Active',
        statusType: 'ready',
        followers: null, // Will be fetched from TikTok API if needed
        trend: null,
        views: null, // Will be fetched from TikTok API if needed
        access_token: account.access_token,
        open_id: account.open_id,
        connected_at: account.connected_at
      }));

      return Response.json({ accounts: tiktokAccounts });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return Response.json({ accounts: [] });
    }

  } catch (error) {
    console.error('Error in tiktok-accounts API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
