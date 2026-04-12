#!/usr/bin/env node
/**
 * Get NYT Connections - Alternative Endpoints
 * 
 * Tries multiple API endpoint variations to find Connections puzzle
 * 
 * Usage:
 *   node getConnections-alt.js [date]
 */

const https = require('https');

const ENDPOINTS = [
  'https://www.nytimes.com/svc/connections/v2',
  'https://www.nytimes.com/svc/connections/v1',
  'https://www.nytimes.com/svc/nyt-connections/v2',
  'https://www.nytimes.com/svc/games/connections/v2',
  'https://www.nytimes.com/games-assets/connections/v2'
];

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function tryEndpoint(baseUrl, dateStr) {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}/${dateStr}.json`;
    
    https.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve({ success: true, url, data: parsed });
          } catch (e) {
            reject(new Error(`Parse error at ${baseUrl}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode} at ${baseUrl}`));
        }
      });
    }).on('error', (e) => {
      reject(new Error(`Connection failed at ${baseUrl}: ${e.message}`));
    }).on('timeout', function() {
      this.abort();
      reject(new Error(`Timeout at ${baseUrl}`));
    });
  });
}

async function getConnectionsFromAny(dateStr) {
  dateStr = dateStr || formatDate(new Date());
  
  console.log(`📅 Trying to fetch Connections for: ${dateStr}\n`);
  
  for (const endpoint of ENDPOINTS) {
    try {
      console.log(`🔍 Trying: ${endpoint}`);
      const result = await tryEndpoint(endpoint, dateStr);
      console.log(`✅ SUCCESS: ${endpoint}\n`);
      return result;
    } catch (error) {
      console.log(`❌ ${error.message}`);
    }
  }
  
  throw new Error('All endpoints failed - Connections API not found');
}

(async () => {
  try {
    const result = await getConnectionsFromAny(process.argv[2]);
    console.log('📊 Puzzle Data:');
    console.log(JSON.stringify(result.data, null, 2));
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
})();
