#!/usr/bin/env node

/**
 * Cleanup script to remove duplicate files after refactoring
 * Run with: node cleanup-duplicates.js
 */

const fs = require('fs');
const path = require('path');

const filesToRemove = [
  'app/dashboard/slides/constants.js',
  'app/dashboard/meme/constants.js',
  'app/dashboard/slides/hooks/useSlideCanvas.js',
  'app/dashboard/meme/hooks/useSlideCanvas.js',
  'app/dashboard/slides/hooks/useSlideNavigation.js',
  'app/dashboard/meme/hooks/useSlideNavigation.js',
  'app/dashboard/slides/hooks/useSlideManagement.js',
  'app/dashboard/meme/hooks/useSlideManagement.js'
];

console.log('🧹 Cleaning up duplicate files...\n');

filesToRemove.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`✅ Removed: ${filePath}`);
    } catch (error) {
      console.log(`❌ Failed to remove ${filePath}:`, error.message);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n🎉 Cleanup completed!');
console.log('\n📝 Next steps:');
console.log('1. Update any remaining imports to use the shared components');
console.log('2. Test the application to ensure everything works correctly');
console.log('3. Remove this cleanup script when done'); 