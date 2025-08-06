import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';

export async function POST(request) {
  try {
    const { userId, contentType, data } = await request.json();
    
    if (!userId || !contentType || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabase();
    
    // Save user content to database
    const { data: savedContent, error } = await supabase
      .from('user_content')
      .insert({
        user_id: userId,
        content_type: contentType,
        content_data: data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving user content:', error);
      return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      content: savedContent[0]
    });

  } catch (error) {
    console.error('Error in save-user-content API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'dev-user@example.com';
    const contentType = searchParams.get('contentType') || 'slides';
    
    const supabase = getSupabase();
    
    // Fetch user content from database
    const { data: content, error } = await supabase
      .from('user_content')
      .select('*')
      .eq('user_id', userEmail)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user content:', error);
      return NextResponse.json({ error: 'Failed to fetch user content' }, { status: 500 });
    }

    return NextResponse.json({ 
      content: content || [],
      count: content?.length || 0
    });

  } catch (error) {
    console.error('Error in save-user-content API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 