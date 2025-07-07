#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Generating secure NEXTAUTH_SECRET...\n');

// Generate a secure random secret
const secret = crypto.randomBytes(32).toString('base64');

console.log('✅ Generated NEXTAUTH_SECRET:');
console.log('='.repeat(50));
console.log(secret);
console.log('='.repeat(50));

console.log('\n📋 Copy this value and add it to your Vercel environment variables:');
console.log('NEXTAUTH_SECRET=' + secret);

console.log('\n🚨 IMPORTANT:');
console.log('- This secret is required for authentication to work');
console.log('- Keep it secure and don\'t share it publicly');
console.log('- Add it to Vercel dashboard → Environment Variables');
console.log('- Redeploy your app after adding the variable');

console.log('\n🔍 To check if your auth is working, visit:');
console.log('https://your-vercel-domain.vercel.app/api/debug-auth'); 