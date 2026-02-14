#!/usr/bin/env node

/**
 * External Repository Photo Manifest Generator
 * 
 * This script generates a photo manifest from an external GitHub repository
 * using GitHub API, enabling CDN-based image hosting.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Configuration - update these for your setup
const CONFIG = {
  // External repository details
  externalRepo: {
    owner: process.env.EXTERNAL_REPO_OWNER || 'EllieAtWHL',
    repo: process.env.EXTERNAL_REPO_NAME || 'spurs-women-photo-gallery',
    branch: process.env.EXTERNAL_REPO_BRANCH || 'main'
  },
  
  // CDN configuration
  cdn: {
    provider: process.env.CDN_PROVIDER || 'jsdelivr', // 'jsdelivr' | 'unpkg' | 'statically'
    baseUrl: process.env.CDN_BASE_URL || 'https://cdn.jsdelivr.net'
  },
  
  // Local paths
  localPaths: {
    manifest: path.join(__dirname, '../public/spurs-women/photo-gallery.manifest.json'),
    photoGallery: path.join(__dirname, '../public/spurs-women/photo-gallery')
  }
};

/**
 * GitHub API client for fetching repository contents
 */
class GitHubAPI {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
  }
  
  /**
   * Fetch repository contents using GitHub API
   */
  async fetchRepositoryContents(repoPath = '') {
    const url = `${this.baseUrl}/repos/${CONFIG.externalRepo.owner}/${CONFIG.externalRepo.repo}/contents/${repoPath}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching repository contents:', error);
      throw error;
    }
  }
  
  /**
   * Get download URL for a file from GitHub
   */
  getFileDownloadUrl(filePath, sha) {
    return `https://raw.githubusercontent.com/${CONFIG.externalRepo.owner}/${CONFIG.externalRepo.repo}/${CONFIG.externalRepo.branch}/${filePath}`;
  }
  
  /**
   * Get CDN URL for a file
   */
  getCdnUrl(filePath) {
    switch (CONFIG.cdn.provider) {
      case 'jsdelivr':
        return `${CONFIG.cdn.baseUrl}/gh/${CONFIG.externalRepo.owner}/${CONFIG.externalRepo.repo}@${CONFIG.externalRepo.branch}/${filePath}`;
      case 'unpkg':
        return `https://unpkg.com/${CONFIG.externalRepo.repo}@${CONFIG.externalRepo.branch}/${filePath}`;
      case 'statically':
        return `https://cdn.statically.io/gh/${CONFIG.externalRepo.owner}/${CONFIG.externalRepo.repo}/${CONFIG.externalRepo.branch}/${filePath}`;
      default:
        return this.getFileDownloadUrl(filePath);
    }
  }
}

/**
 * Generate CDN URLs for image files in a folder
 */
async function generateCdnUrls(folderContents, folderPath, api) {
  const imageUrls = [];
  
  // Filter for image files
  const imageFiles = folderContents.filter(item => {
    const ext = path.extname(item.name).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
  });
  
  // Sort files for deterministic output
  imageFiles.sort((a, b) => a.name.localeCompare(b.name));
  
  for (const file of imageFiles) {
    const filePath = `${folderPath}/${file.name}`;
    const cdnUrl = CONFIG.cdn.provider === 'github' 
      ? api.getFileDownloadUrl(filePath)
      : api.getCdnUrl(filePath);
    
    imageUrls.push(cdnUrl);
  }
  
  return imageUrls;
}

/**
 * Main manifest generation function
 */
async function generateExternalManifest() {
  console.log('🖼️  Generating external photo gallery manifest...');
  
  // Initialize GitHub API (move outside try block for broader scope)
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.warn('⚠️  GITHUB_TOKEN not found. Using direct GitHub URLs.');
    console.warn('Set GITHUB_TOKEN environment variable for API access.');
  }
  
  const api = new GitHubAPI(githubToken);
  
  try {
    
    // Fetch repository contents
    let repoContents;
    try {
      repoContents = await api.fetchRepositoryContents();
      
      if (repoContents.message === 'Not Found') {
        console.warn(`⚠️  Repository ${CONFIG.externalRepo.owner}/${CONFIG.externalRepo.repo} not found, creating empty manifest`);
        repoContents = [];
      }
    } catch (error) {
      console.warn(`⚠️  Failed to fetch repository contents: ${error.message}`);
      console.warn('Creating empty manifest - galleries will use Supabase storage only');
      repoContents = [];
    }
    
    // Process folders (assuming array of folder objects)
    const manifest = {};
    let totalImages = 0;
    
    if (Array.isArray(repoContents)) {
      for (const folder of repoContents) {
        if (folder.type === 'dir') {
          try {
            // Fetch folder contents
            const folderContents = await api.fetchRepositoryContents(folder.name);
            
            if (Array.isArray(folderContents)) {
              // Check if this folder contains subdirectories with images
              let allImages = [];
              let manifestKey = folder.name;
              
              // Look for image files in current folder
              const directImages = folderContents.filter(item => {
                const ext = path.extname(item.name).toLowerCase();
                return ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext);
              });
              
              if (directImages.length > 0) {
                // Images are directly in this folder
                allImages = await generateCdnUrls(directImages, folder.name, api);
                manifest[manifestKey] = allImages;
                totalImages += allImages.length;
                console.log(`📁 ${manifestKey}: ${allImages.length} images`);
              } else {
                // Look for subdirectories that might contain images
                for (const subfolder of folderContents) {
                  if (subfolder.type === 'dir') {
                    try {
                      const subfolderContents = await api.fetchRepositoryContents(`${folder.name}/${subfolder.name}`);
                      
                      if (Array.isArray(subfolderContents)) {
                        const subImages = await generateCdnUrls(subfolderContents, `${folder.name}/${subfolder.name}`, api);
                        if (subImages.length > 0) {
                          const subManifestKey = `${folder.name}/${subfolder.name}`;
                          manifest[subManifestKey] = subImages;
                          totalImages += subImages.length;
                          console.log(`📁 ${subManifestKey}: ${subImages.length} images`);
                        }
                      }
                    } catch (subError) {
                      console.warn(`Error processing subfolder ${subfolder.name}:`, subError.message);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error processing folder ${folder.name}:`, error);
          }
        }
      }
    }
    
    // Write manifest file
    const manifestJson = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(CONFIG.localPaths.manifest, manifestJson, 'utf8');
    
    console.log(`✅ Manifest written to: ${CONFIG.localPaths.manifest}`);
    console.log(`📁 Total folders: ${Object.keys(manifest).length}`);
    console.log(`📸 Total images: ${totalImages}`);
    
    // Show CDN configuration
    console.log('\n🌐 CDN Configuration:');
    console.log(`  Provider: ${CONFIG.cdn.provider}`);
    console.log(`  Base URL: ${CONFIG.cdn.baseUrl}`);
    
  } catch (error) {
    console.error('❌ Error generating external manifest:', error);
    // Create empty manifest as fallback
    const emptyManifest = '{}';
    fs.writeFileSync(CONFIG.localPaths.manifest, emptyManifest, 'utf8');
    console.log('📝 Created empty manifest as fallback');
  }
}

/**
 * Create local photo gallery directory for development fallback
 */
function ensureLocalPhotoGallery() {
  if (!fs.existsSync(CONFIG.localPaths.photoGallery)) {
    fs.mkdirSync(CONFIG.localPaths.photoGallery, { recursive: true });
    console.log(`📁 Created local photo gallery directory: ${CONFIG.localPaths.photoGallery}`);
  }
}

/**
 * Show configuration help
 */
function showConfigHelp() {
  console.log('\n📋 Configuration:');
  console.log('Environment Variables:');
  console.log('  GITHUB_TOKEN: GitHub personal access token');
  console.log('  EXTERNAL_REPO_OWNER: Repository owner username');
  console.log('  EXTERNAL_REPO_NAME: Repository name');
  console.log('  EXTERNAL_REPO_BRANCH: Branch name (default: main)');
  console.log('  CDN_PROVIDER: CDN provider (jsdelivr|unpkg|statically|github)');
  console.log('  CDN_BASE_URL: Custom CDN base URL');
  console.log('\nExample:');
  console.log('export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx');
  console.log('export EXTERNAL_REPO_OWNER=your-username');
  console.log('export EXTERNAL_REPO_NAME=spurs-women-photos');
  console.log('npm run generate-external-manifest');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showConfigHelp();
    return;
  }
  
  if (args.includes('--init-local')) {
    ensureLocalPhotoGallery();
    return;
  }
  
  await generateExternalManifest();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateExternalManifest, CONFIG };
