import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { guardInternalToolsRoute } from '@/app/lib/internalSetupAuth';

export async function GET(request) {
  const denied = guardInternalToolsRoute(request);
  if (denied) return denied;

  try {
    // Use service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase URL or Service Role Key',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Testing Supabase connection with service role...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Key length:', supabaseServiceKey?.length);
    
    // Test if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    console.log('Buckets response:', { buckets, bucketsError });
    
    if (bucketsError) {
      return NextResponse.json({ 
        error: 'Failed to list buckets',
        details: bucketsError.message 
      }, { status: 500 });
    }
    
    // Check if user-images bucket exists
    const userImagesBucket = buckets.find(bucket => bucket.name === 'user-images');
    
    if (!userImagesBucket) {
      return NextResponse.json({ 
        error: 'user-images bucket does not exist',
        availableBuckets: buckets.map(b => b.name),
        message: 'Please create the user-images bucket in your Supabase dashboard'
      }, { status: 404 });
    }
    
    // Test if we can list files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('user-images')
      .list();
    
    console.log('Files in bucket:', { files, filesError });
    
    return NextResponse.json({
      success: true,
      bucket: userImagesBucket,
      fileCount: files?.length || 0,
      message: 'Storage bucket is accessible'
    });
    
  } catch (error) {
    console.error('Storage test error:', error);
    return NextResponse.json({ 
      error: 'Storage test failed',
      details: error.message 
    }, { status: 500 });
  }
} 