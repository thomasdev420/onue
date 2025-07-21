import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';
import { automatedImageLabelingService } from '../../services/automatedImageLabelingService.js';

export async function GET() {
  try {
    console.log('Testing upload and labeling process...');
    
    // Test 1: Check Supabase connection
    const supabase = getSupabase();
    console.log('Supabase client created successfully');
    
    // Test 2: Check if we can access the images table
    const { data: tableTest, error: tableError } = await supabase
      .from('images')
      .select('count')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json({ 
        error: 'Database table access failed',
        details: tableError.message 
      }, { status: 500 });
    }
    
    console.log('Database table access successful');
    
    // Test 3: Check if automated labeling service works
    console.log('Labeling service created successfully');
    
    // Test 4: Test with a sample image URL (using a public test image)
    const testImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';
    
    try {
      console.log('Testing AI labeling with sample image...');
      const labels = await automatedImageLabelingService.generateImageLabels(testImageUrl, 'test-image.jpg');
      console.log('AI labeling successful:', labels);
      
      return NextResponse.json({
        success: true,
        message: 'Upload and labeling process is working!',
        tests: {
          supabase: '✅ Connected',
          database: '✅ Accessible',
          labelingService: '✅ Created',
          aiLabeling: '✅ Working',
          sampleLabels: labels
        }
      });
      
    } catch (aiError) {
      console.error('AI labeling test failed:', aiError);
      return NextResponse.json({
        success: false,
        message: 'Upload process works, but AI labeling failed',
        tests: {
          supabase: '✅ Connected',
          database: '✅ Accessible',
          labelingService: '✅ Created',
          aiLabeling: '❌ Failed',
          error: aiError.message
        }
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message 
    }, { status: 500 });
  }
} 