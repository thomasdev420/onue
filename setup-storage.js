import { supabase } from './supabaseClient.js';

async function setupStorage() {
  try {
    console.log('Setting up Supabase storage buckets...');

    // Create user-content bucket for images
    const { data: contentBucket, error: contentError } = await supabase.storage.createBucket('user-content', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (contentError && contentError.message !== 'Bucket already exists') {
      console.error('Error creating user-content bucket:', contentError);
    } else {
      console.log('✅ user-content bucket ready');
    }

    // Create user-videos bucket for videos
    const { data: videosBucket, error: videosError } = await supabase.storage.createBucket('user-videos', {
      public: true,
      allowedMimeTypes: ['video/*'],
      fileSizeLimit: 52428800 // 50MB
    });

    if (videosError && videosError.message !== 'Bucket already exists') {
      console.error('Error creating user-videos bucket:', videosError);
    } else {
      console.log('✅ user-videos bucket ready');
    }

    console.log('Storage setup complete!');
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

setupStorage(); 