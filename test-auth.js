// Simple test script to verify authentication
const fetch = require('node-fetch');

async function testAuth() {
  console.log('Testing authentication...\n');

  // Test 1: Access protected API without authentication
  console.log('1. Testing /api/user/context without authentication...');
  try {
    const response = await fetch('http://localhost:3000/api/user/context');
    console.log(`   Status: ${response.status}`);
    if (response.status === 401) {
      console.log('   ✅ Correctly returns 401 for unauthenticated requests');
    } else {
      console.log('   ❌ Should return 401 for unauthenticated requests');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 2: Access dashboard without authentication
  console.log('\n2. Testing /dashboard without authentication...');
  try {
    const response = await fetch('http://localhost:3000/dashboard');
    console.log(`   Status: ${response.status}`);
    if (response.status === 401 || response.status === 302) {
      console.log('   ✅ Correctly redirects or blocks unauthenticated access');
    } else {
      console.log('   ❌ Should redirect or block unauthenticated access');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 3: Access public page
  console.log('\n3. Testing public page access...');
  try {
    const response = await fetch('http://localhost:3000/');
    console.log(`   Status: ${response.status}`);
    if (response.status === 200) {
      console.log('   ✅ Public page accessible');
    } else {
      console.log('   ❌ Public page should be accessible');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\nTest completed!');
}

testAuth().catch(console.error); 