import { NextResponse } from 'next/server';
import { AutomatedImageLabelingService } from '../../services/automatedImageLabelingService.js';

export async function POST() {
  console.log('🧪 Testing Automated Image Labeling Service...');
  
  const results = {
    success: false,
    tests: [],
    errors: []
  };
  
  try {
    // Test 1: Service initialization
    console.log('1. Testing service initialization...');
    try {
      const service = new AutomatedImageLabelingService();
      results.tests.push('✅ Service initialized successfully');
    } catch (error) {
      results.errors.push(`Service initialization failed: ${error.message}`);
    }
    
    // Test 2: Test with a sample image URL (using a placeholder)
    console.log('2. Testing image analysis with sample image...');
    try {
      const service = new AutomatedImageLabelingService();
      
      // Use a sample image URL for testing
      const sampleImageUrl = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop';
      
      const analysis = await service.generateImageLabels(sampleImageUrl);
      
      if (analysis && analysis.title && analysis.category && analysis.keywords) {
        results.tests.push('✅ Image analysis completed successfully');
        results.tests.push(`   - Title: ${analysis.title}`);
        results.tests.push(`   - Category: ${analysis.category}`);
        results.tests.push(`   - Keywords: ${analysis.keywords.slice(0, 5).join(', ')}...`);
        results.tests.push(`   - Quality Score: ${analysis.qualityScore}`);
      } else {
        results.errors.push('Image analysis returned incomplete data');
      }
    } catch (error) {
      results.errors.push(`Image analysis failed: ${error.message}`);
    }
    
    // Test 3: Test category validation
    console.log('3. Testing category validation...');
    try {
      const service = new AutomatedImageLabelingService();
      const testCategories = ['business', 'technology', 'lifestyle', 'health', 'education'];
      
      for (const category of testCategories) {
        const isValid = service.validateCategory(category);
        if (isValid) {
          results.tests.push(`✅ Category validation: ${category} is valid`);
        } else {
          results.errors.push(`Category validation failed for: ${category}`);
        }
      }
    } catch (error) {
      results.errors.push(`Category validation test failed: ${error.message}`);
    }
    
    // Test 4: Test fallback labels
    console.log('4. Testing fallback labels...');
    try {
      const service = new AutomatedImageLabelingService();
      const fallbackLabels = service.getFallbackLabels('https://example.com/test.jpg', 'Test Image');
      
      if (fallbackLabels && fallbackLabels.title && fallbackLabels.category) {
        results.tests.push(`✅ Fallback labels: ${fallbackLabels.title} (${fallbackLabels.category})`);
      } else {
        results.errors.push('Fallback labels returned incomplete data');
      }
    } catch (error) {
      results.errors.push(`Fallback labels test failed: ${error.message}`);
    }
    
    results.success = results.errors.length === 0;
    
    if (results.success) {
      console.log('🎉 Image labeling service test completed successfully!');
    } else {
      console.log('⚠️ Image labeling service test completed with errors');
    }
    
    return NextResponse.json({
      success: results.success,
      tests: results.tests,
      errors: results.errors,
      summary: {
        totalTests: results.tests.length,
        errorCount: results.errors.length,
        status: results.success ? '✅ All Tests Passed' : '⚠️ Tests with Errors'
      }
    });
    
  } catch (error) {
    console.error('❌ Image labeling service test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      tests: results.tests,
      errors: [...results.errors, error.message]
    }, { status: 500 });
  }
} 