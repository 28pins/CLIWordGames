#!/usr/bin/env node
// Populate dailyWords by calling the NYT Wordle API for each date.
// Usage: node scripts/populate_dailyWords.js [END_DATE]
// Example: node scripts/populate_dailyWords.js 2026-04-14
// Requires Node 18+ (global `fetch`).

const fs = require('fs');
const path = require('path');

const START_DATE = new Date('2021-06-19');
const END_ARG = process.argv[2];
const END_DATE = END_ARG ? new Date(END_ARG) : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })(); // default to one month from now
const OUT_FILE = path.join(__dirname, '..', 'CLIGames-web', 'src', 'js', 'words_dailyWords.js');
const OUT_FILE_2 = path.join(__dirname, '..', 'Wrdli', 'wrdli_words.js');

function formatDateAsYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function fetchSolutionForDate(d) {
  const dateStr = formatDateAsYMD(d);
  const url = `https://www.nytimes.com/svc/wordle/v2/${dateStr}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      //console.error(`WARN: ${dateStr} -> HTTP ${res.status}`);
      //console.log('x')
      return null;
    }
    const json = await res.json();
    return json && json.solution ? json.solution : null;
    //console.log('√')
  } catch (err) {
    //console.error(`ERROR: ${dateStr} -> ${err.message}`);
    //console.log('x')
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
  }

  // Write a JS file suitable for pasting into wrdli.js or importing.
  const fileContent = `const dailyWords = [${results.map(w => `  \"${w}\"`).join(', ')}];\n`;
  fs.writeFileSync(OUT_FILE, fileContent , 'utf8');
  let existingContent = fs.readFileSync(OUT_FILE_2, 'utf8'); // preserve any existing content (like exports)
  fs.writeFileSync(OUT_FILE_2, existingContent.split('const dailyWords =')[0] + fileContent + `\n\nmodule.exports = {
  guessWords, dailyWords
}`, 'utf8');
  console.log(`\nWrote ${results.length} words to ${OUT_FILE}`);
}

// main().catch(err => { console.error(err); process.exit(1); });

///CONNECTIONS

const CSTART_DATE = new Date('2023-06-19');
const CEND_DATE = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })(); // in one month from now
const COUT_FILE = path.join(__dirname, '..', 'CLIGames-web', 'src', 'js', 'categories_dailyPuzzles.js');
const COUT_FILE_2 = path.join(__dirname, '..', 'Cli-nnections', 'cli-nnections_puzzles.js');

async function fetchConnectionsForDate(d) {
  const dateStr = formatDateAsYMD(d);
  const url = `https://www.nytimes.com/svc/connections/v2/${dateStr}.json`;
  const maxRetries = 3;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`WARN: ${dateStr} -> HTTP ${res.status}: ${res.statusText}`);
        attempt++;
        continue;
      }
      const json = await res.json();
      return json
    } catch (err) {
      if (attempt === maxRetries - 1) console.error(`ERROR: ${dateStr} -> ${err.message}`);
      attempt++;
    }
  }
  return null;
}

async function mainConnections() {
  if (typeof fetch === 'undefined') {
    console.error('This script requires Node 18+ with global fetch.');
    process.exit(1);
  }
  console.log(`Fetching Connections puzzles from ${formatDateAsYMD(CSTART_DATE)} to ${formatDateAsYMD(CEND_DATE)}...`);
  const results = [];
  const failed = [];
  let total = 0;
  for (let d = new Date(CSTART_DATE); d <= CEND_DATE; d.setDate(d.getDate() + 1)) {
    const cur = new Date(d); // copy
    total++;
    try {
      const puzzle = await fetchConnectionsForDate(cur);
      if (puzzle) {
        results.push(puzzle);
      } else {
        failed.push(formatDateAsYMD(cur));
      }
    } catch (err) {
      // Shouldn't happen because fetchConnectionsForDate handles its own errors,
      // but guard here to ensure the loop never throws.
      console.error(`UNEXPECTED ERROR for ${formatDateAsYMD(cur)} -> ${err && err.message ? err.message : String(err)}`);
      failed.push(formatDateAsYMD(cur));
    }
    if (total % 50 === 0) console.log(`Processed ${total} dates...`);
  }

  // Write failures to a log for inspection (prevents terminal flooding)
  if (failed.length > 0) {
    const failLog = path.join(__dirname, '..', 'logs');
    try { fs.mkdirSync(failLog, { recursive: true }); } catch (e) { }
    fs.writeFileSync(path.join(failLog, `connections_failed_${formatDateAsYMD(CSTART_DATE)}_to_${formatDateAsYMD(CEND_DATE)}.json`), JSON.stringify(failed, null, 2), 'utf8');
    console.log(`Failures: ${failed.length} dates (written to logs).`);
  } else {
    console.log('No failures.');
  }

  // Write a JS file suitable for pasting into categories.js or importing.
  const fileContent = `const dailyPuzzles = [${results.map(p => `  ${JSON.stringify(p)}`).join(',\n')}];\n`;
  try {
    fs.writeFileSync(COUT_FILE, fileContent, 'utf8');
    console.log(`\nWrote ${results.length} puzzles to ${COUT_FILE}`);
    fs.writeFileSync(COUT_FILE_2, fileContent + `\n\nmodule.exports = {
      dailyPuzzles
  }`, 'utf8');
  } catch (err) {
    console.error(`Failed to write output files: ${err && err.message ? err.message : String(err)}`);
  }
}

// Run and ensure we don't exit with failure; log errors and exit 0 so caller can inspect outputs/logs.
mainConnections().catch(err => {
  console.error('Fatal error in mainConnections:', err && err.message ? err.message : String(err));
}).finally(() => {
  console.log('mainConnections finished (see logs for details).');
});