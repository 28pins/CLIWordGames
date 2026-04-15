#!/usr/bin/env node
// Populate dailyWords by calling the NYT Wordle API for each date.
// Usage: node scripts/populate_dailyWords.js [END_DATE]
// Example: node scripts/populate_dailyWords.js 2026-04-14
// Requires Node 18+ (global `fetch`).

const fs = require('fs');
const path = require('path');

const START_DATE = new Date('2021-06-19');
const END_ARG = process.argv[2];
const END_DATE = END_ARG ? new Date(END_ARG) : new Date();
const OUT_FILE = path.join(__dirname, '..', 'OpenWord-web', 'generated_dailyWords.js');

function formatDateAsYMD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchSolutionForDate(d) {
  const dateStr = formatDateAsYMD(d);
  const url = `https://www.nytimes.com/svc/wordle/v2/${dateStr}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`WARN: ${dateStr} -> HTTP ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json && json.solution ? json.solution : null;
  } catch (err) {
    console.error(`ERROR: ${dateStr} -> ${err.message}`);
    return null;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  if (typeof fetch === 'undefined') {
    console.error('This script requires Node 18+ with global fetch.');
    process.exit(1);
  }

  const results = [];
  for (let d = new Date(START_DATE); d <= END_DATE; d.setDate(d.getDate() + 1)) {
    const cur = new Date(d); // copy
    const sol = await fetchSolutionForDate(cur);
    if (sol) {
      results.push(sol.toLowerCase());
      console.log(`${formatDateAsYMD(cur)} -> ${sol}`);
      process.stdout.write('.');
    } else {
      process.stdout.write('x');
    }
    await sleep(3);
  }

  // Write a JS file suitable for pasting into wrdli.js or importing.
  const fileContent = `const dailyWords = [\n${results.map(w => `  \"${w}\"`).join(',\n')}\n];\n`;
  fs.writeFileSync(OUT_FILE, fileContent, 'utf8');
  console.log(`\nWrote ${results.length} words to ${OUT_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });
