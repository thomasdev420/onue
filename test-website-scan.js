// Simple test for website scanning service and integrated onboarding
const { scanWebsite, validateWebsiteUrl } = require('./app/services/websiteScanService.js');

async function testWebsiteScanning() {
  console.log('Testing Website Scanning Service\n');

  // Test URL validation
  console.log('1. Testing URL validation:');
  const testUrls = [
    'https://example.com',
    'http://mycompany.com',
    'https://saas-tool.app',
    'https://ecommerce-store.com/shop',
    'invalid-url',
    ''
  ];

  testUrls.forEach(url => {
    const result = validateWebsiteUrl(url);
    console.log(`   ${url}: ${result.valid ? '✅ Valid' : '❌ Invalid - ' + result.error}`);
  });

  console.log('\n2. Testing website scanning:');
  
  const testScans = [
    'https://saas-tool.app',
    'https://ecommerce-store.com',
    'https://consulting-agency.com',
    'https://blog-platform.com'
  ];

  for (const url of testScans) {
    console.log(`\n   Scanning: ${url}`);
    try {
      const result = await scanWebsite(url);
      if (result.success) {
        console.log(`   ✅ Success:`);
        console.log(`      Company: ${result.data.companyName}`);
        console.log(`      Type: ${result.data.productType}`);
        console.log(`      Info: ${result.data.productInfo}`);
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n3. Testing integrated onboarding data structure:');
  
  // Simulate complete onboarding data
  const mockOnboardingData = {
    websiteUrl: 'https://example-saas.app',
    extractedData: {
      companyName: 'Example SaaS',
      productType: 'SaaS Platform',
      productInfo: 'A modern SaaS platform for businesses',
      companyUrl: 'https://example-saas.app'
    },
    personalizationAnswers: {
      interests: 'marketing, AI, automation',
      goals: 'Grow my TikTok following and increase brand awareness',
      role: 'Founder',
      experienceLevel: 'Intermediate',
      timeCommitment: '5-10 hours',
      targetAudience: 'small business owners and entrepreneurs'
    },
    selectedVideoFormat: 'ugc',
    completedAt: new Date().toISOString()
  };

  console.log('   ✅ Complete onboarding data structure:');
  console.log(`      Website: ${mockOnboardingData.websiteUrl}`);
  console.log(`      Company: ${mockOnboardingData.extractedData.companyName}`);
  console.log(`      Role: ${mockOnboardingData.personalizationAnswers.role}`);
  console.log(`      Video Format: ${mockOnboardingData.selectedVideoFormat}`);
}

// Run the test
testWebsiteScanning().catch(console.error); 