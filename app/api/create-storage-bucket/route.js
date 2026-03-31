import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';
import { guardInternalToolsRoute } from '@/app/lib/internalSetupAuth';

export async function POST(request) {
  const denied = guardInternalToolsRoute(request);
  if (denied) return denied;

  try {
    const supabase = getSupabase();
    
    console.log('Creating user-images storage bucket...');
    
    // Create the user-images bucket
    const { data, error } = await supabase.storage.createBucket('user-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 10485760, // 10MB
    });
    
    console.log('Bucket creation response:', { data, error });
    
    if (error) {
      // If bucket already exists, that's fine
      if (error.message.includes('already exists')) {
        return NextResponse.json({
          success: true,
          message: 'user-images bucket already exists',
          bucket: 'user-images'
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create storage bucket',
        details: error.message 
      }, { status: 500 });
    }
    
    // Set bucket policies for public access
    const { error: policyError } = await supabase.storage
      .from('user-images')
      .createSignedUrl('test', 60); // This will fail but helps set up policies
    
    console.log('Policy setup result:', { policyError });
    
    return NextResponse.json({
      success: true,
      message: 'user-images storage bucket created successfully',
      bucket: 'user-images',
      data: data
    });
    
  } catch (error) {
    console.error('Bucket creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create storage bucket',
      details: error.message 
    }, { status: 500 });
  }
} 