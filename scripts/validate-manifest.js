#!/usr/bin/env node

/**
 * Photo Manifest Validation Script
 * 
 * Validates that the photo manifest is properly generated and contains expected data
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MANIFEST_PATH = path.join(__dirname, '../public/spurs-women/photo-gallery.manifest.json');

function validateManifest() {
  console.log('🔍 Validating photo manifest...');
  
  // Check if manifest exists
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Error: Photo manifest file not found!');
    console.error('   Run: npm run generate-external-manifest');
    process.exit(1);
  }
  
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    console.error('❌ Error: Photo manifest is invalid JSON!');
    console.error('   Details:', error.message);
    process.exit(1);
  }
  
  // Check manifest structure
  const folderCount = Object.keys(manifest).length;
  const totalImages = Object.values(manifest).reduce((sum, images) => sum + images.length, 0);
  
  console.log(`📁 Found ${folderCount} folder(s) with ${totalImages} total image(s)`);
  
  if (folderCount === 0) {
    console.warn('⚠️  Warning: No folders found in manifest');
    console.warn('   This may indicate:');
    console.warn('   - No folders in external repository');
    console.warn('   - GitHub token not working');
    console.warn('   - Repository not accessible');
  }
  
  // Validate each folder
  let validFolders = 0;
  for (const [folderKey, images] of Object.entries(manifest)) {
    if (!Array.isArray(images)) {
      console.warn(`⚠️  Warning: Folder "${folderKey}" is not an array`);
      continue;
    }
    
    let validImages = 0;
    for (const imageUrl of images) {
      if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
        console.warn(`⚠️  Warning: Invalid image URL in "${folderKey}": ${imageUrl}`);
        continue;
      }
      validImages++;
    }
    
    if (validImages > 0) {
      console.log(`✅ Folder "${folderKey}": ${validImages} valid images`);
      validFolders++;
    }
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`   Valid folders: ${validFolders}/${folderCount}`);
  console.log(`   Total images: ${totalImages}`);
  
  if (validFolders === 0 && folderCount > 0) {
    console.error('❌ Error: No valid folders found!');
    process.exit(1);
  }
  
  if (totalImages === 0) {
    console.warn('⚠️  Warning: No images found in any folder');
  }
  
  console.log('✅ Photo manifest validation completed successfully!');
  
  return {
    isValid: validFolders > 0,
    folderCount,
    totalImages,
    validFolders
  };
}

// Run validation
if (require.main === module) {
  const result = validateManifest();
  process.exit(result.isValid ? 0 : 1);
}

module.exports = { validateManifest };
