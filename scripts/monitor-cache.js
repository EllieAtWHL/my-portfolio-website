#!/usr/bin/env node

// Simple cache monitoring script
// Run with: node scripts/monitor-cache.js

const { spawn } = require('child_process');

function monitorCacheLogs() {
  console.log('🔍 Monitoring cache performance...');
  console.log('Press Ctrl+C to stop\n');

  const npm = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true
  });

  npm.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    
    lines.forEach(line => {
      if (line.includes('Cache')) {
        const timestamp = new Date().toLocaleTimeString();
        
        // Color code different cache events
        if (line.includes('Cache HIT')) {
          console.log(`\x1b[32m[${timestamp}] ${line}\x1b[0m`); // Green
        } else if (line.includes('Cache ERROR')) {
          console.log(`\x1b[31m[${timestamp}] ${line}\x1b[0m`); // Red
        } else if (line.includes('Cache FALLBACK')) {
          console.log(`\x1b[33m[${timestamp}] ${line}\x1b[0m`); // Yellow
        } else if (line.includes('Cache BYPASS')) {
          console.log(`\x1b[36m[${timestamp}] ${line}\x1b[0m`); // Cyan
        } else {
          console.log(`[${timestamp}] ${line}`);
        }
      }
    });
  });

  npm.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });

  npm.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  });
}

if (require.main === module) {
  monitorCacheLogs();
}

module.exports = { monitorCacheLogs };
