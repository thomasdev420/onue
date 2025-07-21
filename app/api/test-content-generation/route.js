import { NextResponse } from 'next/server';
import { getSupabase } from '../../../supabaseClient';

export async function POST() {
  console.log('🧪 Testing Content Generation & Image Selection...');
  
  const results = {
    success: false,
    tests: [],
    errors: []
  };
  
  try {
    const supabase = getSupabase();
    
    // Test 1: Check if we have any images to work with
    console.log('1. Checking available images...');
    try {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .limit(5);
      
      if (imagesError) {
        results.errors.push(`Image retrieval failed: ${imagesError.message}`);
      } else {
        results.tests.push(`✅ Found ${images.length} images in database`);
        
        if (images.length > 0) {
          const sampleImage = images[0];
          results.tests.push(`   - Sample: ${sampleImage.title} (${sampleImage.category})`);
        }
      }
    } catch (error) {
      results.errors.push(`Image check failed: ${error.message}`);
    }
    
    // Test 2: Test image search by category
    console.log('2. Testing category-based image search...');
    try {
      const { data: businessImages, error: businessError } = await supabase
        .from('images')
        .select('*')
        .eq('category', 'business')
        .limit(3);
      
      if (businessError) {
        results.errors.push(`Business image search failed: ${businessError.message}`);
      } else {
        results.tests.push(`✅ Business category search: ${businessImages.length} images found`);
      }
    } catch (error) {
      results.errors.push(`Category search failed: ${error.message}`);
    }
    
    // Test 3: Test keyword-based search
    console.log('3. Testing keyword-based image search...');
    try {
      const { data: keywordImages, error: keywordError } = await supabase
        .from('images')
        .select('*')
        .contains('keywords', ['business'])
        .limit(3);
      
      if (keywordError) {
        results.errors.push(`Keyword search failed: ${keywordError.message}`);
      } else {
        results.tests.push(`✅ Keyword search: ${keywordImages.length} images found`);
      }
    } catch (error) {
      results.errors.push(`Keyword search test failed: ${error.message}`);
    }
    
    // Test 4: Test quality-based filtering
    console.log('4. Testing quality-based image filtering...');
    try {
      const { data: qualityImages, error: qualityError } = await supabase
        .from('images')
        .select('*')
        .gte('quality_score', 80)
        .order('quality_score', { ascending: false })
        .limit(3);
      
      if (qualityError) {
        results.errors.push(`Quality filtering failed: ${qualityError.message}`);
      } else {
        results.tests.push(`✅ Quality filtering: ${qualityImages.length} high-quality images found`);
        if (qualityImages.length > 0) {
          results.tests.push(`   - Highest quality: ${qualityImages[0].quality_score}`);
        }
      }
    } catch (error) {
      results.errors.push(`Quality filtering test failed: ${error.message}`);
    }
    
    // Test 5: Test content generation API
    console.log('5. Testing content generation API...');
    try {
      const response = await fetch('http://localhost:3000/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Create 3 slides about business productivity',
          slideCount: 3,
          userId: 'test-user'
        })
      });
      
      if (response.ok) {
        results.tests.push('✅ Content generation API accessible');
      } else {
        const errorData = await response.json();
        results.errors.push(`Content generation API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      results.errors.push(`Content generation API test failed: ${error.message}`);
    }
    
    // Test 6: Test image selection algorithm simulation
    console.log('6. Testing image selection algorithm...');
    try {
      // Simulate the image selection process
      const searchQuery = 'business productivity';
      const category = 'business';
      
      // Multi-layered search
      let candidates = [];
      
      // Primary search: Category + Keywords
      const { data: primaryCandidates } = await supabase
        .from('images')
        .select('*')
        .eq('category', category)
        .gte('quality_score', 70)
        .limit(10);
      
      if (primaryCandidates) {
        candidates = [...candidates, ...primaryCandidates];
      }
      
      // Secondary search: Title/Description contains search terms
      const { data: secondaryCandidates } = await supabase
        .from('images')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .gte('quality_score', 60)
        .limit(5);
      
      if (secondaryCandidates) {
        candidates = [...candidates, ...secondaryCandidates];
      }
      
      // Remove duplicates
      const uniqueCandidates = candidates.filter((candidate, index, self) => 
        index === self.findIndex(c => c.id === candidate.id)
      );
      
      results.tests.push(`✅ Image selection algorithm: ${uniqueCandidates.length} candidates found`);
      
      if (uniqueCandidates.length > 0) {
        // Simulate relevance scoring
        const scoredCandidates = uniqueCandidates.map(image => ({
          ...image,
          relevanceScore: calculateRelevanceScore(image, { category, keywords: ['business', 'productivity'] })
        }));
        
        const bestMatch = scoredCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore)[0];
        results.tests.push(`   - Best match: ${bestMatch.title} (Score: ${bestMatch.relevanceScore})`);
      }
    } catch (error) {
      results.errors.push(`Image selection test failed: ${error.message}`);
    }
    
    results.success = results.errors.length === 0;
    
    if (results.success) {
      console.log('🎉 Content generation test completed successfully!');
    } else {
      console.log('⚠️ Content generation test completed with errors');
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
    console.error('❌ Content generation test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      tests: results.tests,
      errors: [...results.errors, error.message]
    }, { status: 500 });
  }
}

// Helper function to calculate relevance score
function calculateRelevanceScore(image, requirements) {
  let score = 0;
  
  // Category match: +50 points
  if (image.category === requirements.category) score += 50;
  
  // Keyword matches: +10 points each
  const keywordMatches = requirements.keywords.filter(k => 
    image.keywords && image.keywords.includes(k)
  ).length;
  score += keywordMatches * 10;
  
  // Quality bonus: +1 point per quality point
  score += image.quality_score || 0;
  
  // Usage penalty: -1 point per previous use
  score -= image.usage_count || 0;
  
  return score;
} 