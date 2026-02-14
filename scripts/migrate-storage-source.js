#!/usr/bin/env node

/**
 * Migration Script: Add storage_source field to media records
 * 
 * This script helps populate the new storage_source field for existing photo albums
 * based on their URL patterns, enabling explicit tracking instead of inference.
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Determines storage source based on URL pattern
 * @param {string} url - The URL from media record
 * @returns {string} 'supabase' or 'github'
 */
function determineStorageSource(url) {
  if (!url) return null;
  
  // GitHub-based: simple folder keys without complex patterns
  if (!url.includes('storage') && !url.includes('/') && !url.includes(' ')) {
    return 'github';
  }
  
  // Default to supabase for everything else
  return 'supabase';
}

/**
 * Main migration function
 */
async function migrateStorageSources() {
  console.log('🔄 Starting storage_source migration...');
  
  try {
    // Fetch all photo album records without storage_source
    const { data: records, error } = await supabase
      .from('media')
      .select('id, url, type')
      .eq('type', 'photo album')
      .is('storage_source', null);
    
    if (error) {
      console.error('Error fetching records:', error);
      process.exit(1);
    }
    
    if (!records || records.length === 0) {
      console.log('✅ No records need migration');
      return;
    }
    
    console.log(`📊 Found ${records.length} photo albums to process`);
    
    // Process each record
    const updates = records.map(record => {
      const storageSource = determineStorageSource(record.url);
      
      return {
        id: record.id,
        url: record.url,
        storage_source: storageSource
      };
    });
    
    // Update records in batches
    const batchSize = 10;
    let processed = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(updates.length/batchSize)}`);
      
      // Update each record individually
      for (const update of batch) {
        const { error } = await supabase
          .from('media')
          .update({ storage_source: update.storage_source })
          .eq('id', update.id);
        
        if (error) {
          console.error(`❌ Failed to update record ${update.id}:`, error);
        } else {
          console.log(`✅ Updated record ${update.id}: ${update.url} -> ${update.storage_source}`);
          processed++;
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ Migration complete! Processed ${processed} records`);
    
    // Show summary
    const summary = updates.reduce((acc, update) => {
      acc[update.storage_source] = (acc[update.storage_source] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Migration Summary:');
    Object.entries(summary).forEach(([source, count]) => {
      console.log(`  ${source}: ${count} records`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Show dry run results without making changes
 */
async function dryRun() {
  console.log('🔍 Dry run mode - no changes will be made');
  
  try {
    const { data: records, error } = await supabase
      .from('media')
      .select('id, url, type')
      .eq('type', 'photo album')
      .is('storage_source', null);
    
    if (error) {
      console.error('Error fetching records:', error);
      return;
    }
    
    if (!records || records.length === 0) {
      console.log('✅ No records need migration');
      return;
    }
    
    console.log(`\n📋 Records that will be updated:`);
    records.forEach(record => {
      const storageSource = determineStorageSource(record.url);
      console.log(`  ID ${record.id}: "${record.url}" -> ${storageSource}`);
    });
    
  } catch (error) {
    console.error('❌ Dry run failed:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  
  if (isDryRun) {
    await dryRun();
  } else {
    await migrateStorageSources();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { determineStorageSource, migrateStorageSources, dryRun };
