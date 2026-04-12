#!/usr/bin/env node
/**
 * Get NYT Connections Puzzle - Correct Parser
 * 
 * Fetches and parses the actual Connections puzzle structure
 * 
 * Puzzle: Group 16 words/phrases into 4 categories
 * Structure: 4 categories × 4 cards per category
 * 
 * Usage:
 *   node getConnections-correct.js           # Today
 *   node getConnections-correct.js 2026-04-10 # Specific date
 *   node getConnections-correct.js --json     # Full JSON
 */

const https = require('https');

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function getConnectionsPuzzle(dateStr) {
  dateStr = dateStr || formatDate(new Date());
  
  console.log(`📅 Fetching Connections: ${dateStr}`);

  return new Promise((resolve, reject) => {
    const url = `https://www.nytimes.com/svc/connections/v2/${dateStr}.json`;

    https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            throw new Error(`HTTP ${res.statusCode}`);
          }
          const puzzle = JSON.parse(data);
          resolve(puzzle);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    }).on('error', (e) => {
      reject(new Error(`Connection failed: ${e.message}`));
    }).on('timeout', function() {
      this.abort();
      reject(new Error('Request timeout'));
    });
  });
}

function displayPuzzle(puzzle) {
  console.log(`\n🎯 Puzzle ID: ${puzzle.id}`);
  console.log(`📅 Date: ${puzzle.print_date}`);
  console.log(`👤 Editor: ${puzzle.editor}`);
  console.log(`\n📋 CATEGORIES & WORDS:\n`);

  if (!puzzle.categories || puzzle.categories.length !== 4) {
    console.log('Warning: Expected 4 categories');
  }

  puzzle.categories.forEach((category, index) => {
    const colors = ['🟨', '🟩', '🟦', '🟪'];
    const color = colors[index] || '⬜';
    
    console.log(`${color} ${index + 1}. ${category.title}`);
    
    if (category.cards && Array.isArray(category.cards)) {
      category.cards.forEach(card => {
        console.log(`   • ${card.content}`);
      });
    }
    
    console.log();
  });
}

function exportJSON(puzzle) {
  return {
    id: puzzle.id,
    date: puzzle.print_date,
    editor: puzzle.editor,
    categories: puzzle.categories.map(cat => ({
      title: cat.title,
      words: cat.cards.map(c => c.content),
      count: cat.cards.length
    }))
  };
}

async function main() {
  try {
    let dateArg = null;
    const jsonFlag = process.argv.includes('--json');
    
    // Find date argument (skip node, script, and flags)
    for (const arg of process.argv.slice(2)) {
      if (!arg.startsWith('--')) {
        dateArg = arg;
        break;
      }
    }

    const puzzle = await getConnectionsPuzzle(dateArg);
    
    displayPuzzle(puzzle);
    
    if (jsonFlag) {
      console.log('📄 Structured JSON:\n');
      console.log(JSON.stringify(exportJSON(puzzle), null, 2));
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

module.exports = { getConnectionsPuzzle, formatDate, displayPuzzle, exportJSON };
