#!/usr/bin/env node
/**
 * Test Connections API endpoints and parse logic
 * 
 * Demonstrates fetching, parsing, and displaying Connections puzzles
 * 
 * Usage:
 *   node connectionsTest.js              # Test all endpoints
 *   node connectionsTest.js --verbose    # With detailed output
 */

const https = require('https');

const ENDPOINTS = [
  { name: 'connections/v2', url: 'https://www.nytimes.com/svc/connections/v2' },
  { name: 'connections/v1', url: 'https://www.nytimes.com/svc/connections/v1' },
  { name: 'nyt-connections/v2', url: 'https://www.nytimes.com/svc/nyt-connections/v2' },
  { name: 'games/connections/v2', url: 'https://www.nytimes.com/svc/games/connections/v2' }
];

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function testEndpoint(endpoint, dateStr) {
  return new Promise((resolve) => {
    const url = `${endpoint.url}/${dateStr}.json`;
    
    https.get(url, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve({ endpoint: endpoint.name, status: 'SUCCESS', data: parsed });
          } catch {
            resolve({ endpoint: endpoint.name, status: 'PARSE_ERROR' });
          }
        } else {
          resolve({ endpoint: endpoint.name, status: `HTTP ${res.statusCode}` });
        }
      });
    }).on('error', (e) => {
      resolve({ endpoint: endpoint.name, status: `ERROR: ${e.code}` });
    }).on('timeout', function() {
      this.abort();
      resolve({ endpoint: endpoint.name, status: 'TIMEOUT' });
    });
  });
}

function displayResults(results, verbose) {
  console.log('\n📊 TEST RESULTS:\n');
  
  results.forEach(result => {
    const icon = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} ${result.endpoint}: ${result.status}`);
    
    if (result.status === 'SUCCESS' && verbose && result.data) {
      const puzzle = result.data.puzzle || result.data;
      console.log(`   ID: ${puzzle.id}`);
      console.log(`   Date: ${puzzle.displayDate}`);
      console.log(`   Groups: ${puzzle.groups ? puzzle.groups.length : 0}`);
    }
  });
}

async function main() {
  const verbose = process.argv.includes('--verbose');
  const testDate = formatDate(new Date());
  
  console.log(`🧪 Testing Connections API Endpoints`);
  console.log(`📅 Date: ${testDate}\n`);
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint, testDate);
    results.push(result);
  }
  
  displayResults(results, verbose);
  
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  console.log(`\n📈 Summary: ${successCount}/${ENDPOINTS.length} endpoints working`);
}

main();
