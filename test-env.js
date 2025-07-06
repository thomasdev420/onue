// Test script to verify environment variables
console.log('🔍 Testing Environment Variables...\n');

// Check OpenAI API Key
const openaiKey = process.env.OPENAI_API_KEY;
console.log('OpenAI API Key:');
console.log(`  - Present: ${openaiKey ? '✅ Yes' : '❌ No'}`);
if (openaiKey) {
  console.log(`  - Length: ${openaiKey.length} characters`);
  console.log(`  - Starts with: ${openaiKey.substring(0, 7)}...`);
  console.log(`  - Valid format: ${openaiKey.startsWith('sk-') ? '✅ Yes' : '❌ No (should start with sk-)'}`);
} else {
  console.log('  - ❌ OPENAI_API_KEY is required for AI functionality');
}

console.log('\nNextAuth Configuration:');
console.log(`  - NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Present' : '❌ Missing'}`);
console.log(`  - NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || '❌ Missing'}`);

console.log('\nSupabase Configuration:');
console.log(`  - NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Present' : '❌ Missing'}`);
console.log(`  - NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing'}`);

console.log('\nEnvironment:');
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

console.log('\n📋 Summary:');
if (!openaiKey) {
  console.log('❌ CRITICAL: OPENAI_API_KEY is missing. AI features will not work.');
  console.log('   To fix: Add OPENAI_API_KEY to your Vercel environment variables');
} else if (!openaiKey.startsWith('sk-')) {
  console.log('❌ WARNING: OPENAI_API_KEY format appears invalid (should start with sk-)');
} else {
  console.log('✅ OpenAI API Key is configured correctly');
}

if (!process.env.NEXTAUTH_SECRET) {
  console.log('⚠️  WARNING: NEXTAUTH_SECRET is missing. Authentication may not work properly.');
}

console.log('\n🔧 Next Steps:');
console.log('1. If OPENAI_API_KEY is missing, add it to Vercel environment variables');
console.log('2. Redeploy your project after adding environment variables');
console.log('3. Test the AI chat functionality at /api/ai-chat'); 