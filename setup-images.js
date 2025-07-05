import { supabase } from './supabaseClient.js';

async function setupSampleImages() {
  try {
    console.log('Setting up sample images...');

    // Check if images table exists and has data
    const { data: existingImages, error: checkError } = await supabase
      .from('images')
      .select('id, title')
      .limit(5);

    if (checkError) {
      console.error('Error checking images table:', checkError);
      return;
    }

    if (existingImages && existingImages.length > 0) {
      console.log(`Found ${existingImages.length} existing images in database`);
      return;
    }

    console.log('No images found, adding sample images...');

    // Sample images data
    const sampleImages = [
      {
        title: 'Business Meeting',
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        category: 'business'
      },
      {
        title: 'Technology Innovation',
        image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
        category: 'technology'
      },
      {
        title: 'Success Achievement',
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        category: 'success'
      },
      {
        title: 'Motivation Inspiration',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
        category: 'motivation'
      },
      {
        title: 'Creative Design',
        image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
        category: 'creativity'
      },
      {
        title: 'Social Media Network',
        image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=600&fit=crop',
        category: 'social_media'
      },
      {
        title: 'Entrepreneur Startup',
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        category: 'entrepreneurship'
      },
      {
        title: 'Marketing Campaign',
        image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
        category: 'marketing'
      },
      {
        title: 'Lifestyle Daily',
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
        category: 'lifestyle'
      },
      {
        title: 'Growth Development',
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
        category: 'growth'
      }
    ];

    // Insert sample images
    const { data, error } = await supabase
      .from('images')
      .insert(sampleImages);

    if (error) {
      console.error('Error inserting sample images:', error);
      return;
    }

    console.log(`✅ Successfully added ${sampleImages.length} sample images to database`);
    console.log('Sample images added:', sampleImages.map(img => img.title));

  } catch (error) {
    console.error('Error setting up sample images:', error);
  }
}

// Run the setup
setupSampleImages(); 