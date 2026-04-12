#!/usr/bin/env node
/**
 * Get NYT Connections - Minimal Version
 * 
 * Stripped down version - just fetch and parse
 * 
 * Usage:
 *   node getConnections-minimal.js [date]
 */

const https = require('https');

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function getConnections(dateStr) {
  dateStr = dateStr || formatDate(new Date());
  
  return new Promise((resolve, reject) => {
    const url = `https://www.nytimes.com/svc/connections/v2/${dateStr}.json`;

    https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const puzzle = JSON.parse(data).puzzle || JSON.parse(data);
          resolve(puzzle);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    }).on('error', reject).on('timeout', function() {
      this.abort();
      reject(new Error('Timeout'));
    });
  });
}

(async () => {
  try {
    const puzzle = await getConnections(process.argv[2]);
    console.log(`ID: ${puzzle.id}`);
    console.log(`Date: ${puzzle.displayDate || 'N/A'}`);
    console.log(`Groups: ${puzzle.groups ? puzzle.groups.length : 0}`);
    
    if (puzzle.groups) {
      puzzle.groups.forEach((g, i) => {
        const diff = ['Yellow', 'Green', 'Blue', 'Purple'][g.difficulty] || '?';
        console.log(`  [${diff}] ${g.category}: ${g.displayNames ? g.displayNames.join(', ') : 'N/A'}`);
      });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
})();
