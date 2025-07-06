import { NextResponse } from 'next/server';
import { getSupabase } from '../../../../../supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      console.error('No authorization code received from TikTok');
      return NextResponse.redirect(new URL('/dashboard?error=no_code', request.url));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, open_id, scope } = tokenData;

    // Get user info using the access token
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      console.error('Failed to get user info:', await userResponse.text());
      return NextResponse.redirect(new URL('/dashboard?error=user_info_failed', request.url));
    }

    const userData = await userResponse.json();
    const { display_name, username, avatar_url } = userData.data.user;

    // Save access_token and user info to database
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('tiktok_connections')
        .upsert({
          user_id: state, // Use state as user identifier
          access_token: access_token,
          refresh_token: refresh_token,
          open_id: open_id,
          scope: scope,
          display_name: display_name,
          username: username,
          avatar_url: avatar_url,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to save TikTok connection:', error);
        return NextResponse.redirect(new URL('/dashboard?error=save_failed', request.url));
      }

      console.log('TikTok connection saved successfully for user:', state);
      
      // Redirect back to dashboard with success
      return NextResponse.redirect(new URL('/dashboard?success=tiktok_connected', request.url));

    } catch (dbError) {
      console.error('Database error saving TikTok connection:', dbError);
      return NextResponse.redirect(new URL('/dashboard?error=database_error', request.url));
    }

  } catch (error) {
    console.error('TikTok callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=callback_error', request.url));
  }
} 