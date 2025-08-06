import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('userEmail') || 'dev-user@example.com';
    
    const supabase = getSupabase();
    
    // Fetch user images from database
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user images:', error);
      return NextResponse.json({ error: 'Failed to fetch user images' }, { status: 500 });
    }

    return NextResponse.json({ 
      images: images || [],
      count: images?.length || 0
    });

  } catch (error) {
    console.error('Error in user-images API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 