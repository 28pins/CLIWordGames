#!/usr/bin/env node
/**
 * Get Today's NYT Connections Puzzle
 * 
 * Fetches the daily Connections puzzle from the NYT API.
 * Connections: Group 16 words into 4 categories (4 words each)
 * 
 * Usage:
 *   node getConnections.js           # Get today's puzzle
 *   node getConnections.js 2024-04-10  # Get specific date
 */

const https = require('https');
const url = require('url');

const CONNECTIONS_API_BASE = 'https://www.nytimes.com/svc/connections/v2';
const API_TIMEOUT_MS = 5000;

/**
 * Format a Date object as "yyyy-MM-dd"
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch today's Connections puzzle from NYT API
 */
async function getConnectionsPuzzle(dateStr) {
  if (!dateStr) {
    dateStr = formatDate(new Date());
  }

  console.log(`📅 Fetching Connections for: ${dateStr}`);

  return new Promise((resolve, reject) => {
    const apiUrl = `${CONNECTIONS_API_BASE}/${dateStr}.json`;

    https
      .get(apiUrl, { timeout: API_TIMEOUT_MS }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`HTTP ${res.statusCode}`);
            }

            const response = JSON.parse(data);
            const puzzle = response.puzzle || response;

            console.log(`🎯 Puzzle ID: ${puzzle.id}`);
            console.log(`📅 Date: ${puzzle.displayDate || dateStr}`);
            console.log(`📊 Groups: ${puzzle.groups ? puzzle.groups.length : 'unknown'}`);

            resolve(puzzle);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      })
      .on('error', (error) => {
        reject(new Error(`API request failed: ${error.message}`));
      })
      .on('timeout', function() {
        this.abort();
        reject(new Error(`Request timeout (${API_TIMEOUT_MS}ms)`));
      });
  });
}

/**
 * Pretty print puzzle groups
 */
function displayPuzzle(puzzle) {
  if (!puzzle.groups || puzzle.groups.length === 0) {
    console.log('\nNo groups found in puzzle');
    return;
  }

  console.log('\n📋 PUZZLE GROUPS:\n');

  puzzle.groups.forEach((group, index) => {
    const difficulty = ['Yellow', 'Green', 'Blue', 'Purple'][group.difficulty] || 'Unknown';
    console.log(`${index + 1}. [${difficulty}] ${group.category || 'Category ' + (index + 1)}`);
    
    if (group.categoryDescription) {
      console.log(`   📝 ${group.categoryDescription}`);
    }
    
    if (group.displayNames && Array.isArray(group.displayNames)) {
      console.log(`   Words: ${group.displayNames.join(', ')}`);
    }
    
    console.log();
  });
}

/**
 * Export puzzle as JSON
 */
function exportAsJSON(puzzle) {
  return JSON.stringify(puzzle, null, 2);
}

// Main entry point
async function main() {
  try {
    const dateArg = process.argv[2];
    const puzzle = await getConnectionsPuzzle(dateArg);

    displayPuzzle(puzzle);

    if (process.argv.includes('--json')) {
      console.log('\n📄 Full JSON:\n');
      console.log(exportAsJSON(puzzle));
    }

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getConnectionsPuzzle,
  formatDate,
  displayPuzzle,
  exportAsJSON
};
