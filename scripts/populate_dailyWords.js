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
const FAILURE_THRESHOLD = 10;

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
    const errMsg = 'This script requires Node.js 18 or later with native fetch support.';
    console.error(errMsg);
    throw new Error(errMsg);
  }

  const results = [];
  const failedDates = [];
  for (let d = new Date(START_DATE); d <= END_DATE; d.setDate(d.getDate() + 1)) {
    const cur = new Date(d); // copy
    const sol = await fetchSolutionForDate(cur);
    if (sol) {
      results.push(sol.toLowerCase());
      console.log(`${formatDateAsYMD(cur)} -> ${sol}`);
      process.stdout.write('.');
    } else {
      failedDates.push(formatDateAsYMD(cur));
      process.stdout.write('x');
    }
  }

  // Check for excessive errors in Wordle fetch
  if (failedDates.length > FAILURE_THRESHOLD) {
    console.error(`\nERROR: ${failedDates.length} dates failed to fetch Wordle solutions (threshold: ${FAILURE_THRESHOLD})`);
    console.error(`Failed dates: ${failedDates.slice(0, 20).join(', ')}${failedDates.length > 20 ? '...' : ''}`);
    throw new Error(`Wordle fetch failed for ${failedDates.length} dates`);
  }

  // Writes a JS file suitable for pasting into wrdli.js or importing.
  const fileContent = `const dailyWords = [${results.map(w => `  \"${w}\"`).join(', ')}];\n`;
  fs.writeFileSync(OUT_FILE, fileContent , 'utf8');
  let existingContent = fs.readFileSync(OUT_FILE_2, 'utf8'); // preserve any existing content (like exports)
  fs.writeFileSync(OUT_FILE_2, existingContent.split('const dailyWords =')[0] + fileContent + `\n\nmodule.exports = {
  guessWords, dailyWords
}`, 'utf8');
  console.log(`\nWrote ${results.length} words to ${OUT_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });

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
    const errMsg = 'This script requires Node.js 18 or later with native fetch support.';
    console.error(errMsg);
    throw new Error(errMsg);
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

  // Check for excessive errors in Connections fetch
  if (failed.length > FAILURE_THRESHOLD) {
    console.error(`ERROR: ${failed.length} Connections dates failed to fetch (threshold: ${FAILURE_THRESHOLD})`);
    console.error(`Failed dates: ${failed.slice(0, 20).join(', ')}${failed.length > 20 ? '...' : ''}`);
    throw new Error(`Connections fetch failed for ${failed.length} dates`);
  }

  // Write failures to a log for inspection (prevents terminal flooding)
  if (failed.length > 0) {
    console.log(`Failures: ${failed.length} dates`);
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
    throw err;
  }
}

mainConnections().catch(err => { console.error(err); process.exit(1); });

/// SPELLING BEE
const SBSTART_DATE = new Date('2023-07-03');
const SBEND_DATE = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();
const SBOUT_FILE = path.join(__dirname, '..', 'CLIGames-web', 'src', 'js', 'spelling_bee_dailyPuzzles.js');
const SBOUT_FILE_2 = path.join(__dirname, '..', 'SpellingBee', 'spelling_bee_puzzles.js');

async function fetchSpellingBeeForDate(d) {
  const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const url = `https://www.nytimes.com/svc/spelling-bee/game/${dateStr}.json`;
  const maxRetries = 3;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        attempt++;
        continue;
      }
      const json = await res.json();
      return json;
    } catch (err) {
      attempt++;
    }
  }
  return null;
}

async function mainSpellingBee() {
  if (typeof fetch === 'undefined') {
    const errMsg = 'This script requires Node.js 18 or later with native fetch support.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log(`Fetching Spelling Bee puzzles from ${formatDateAsYMD(SBSTART_DATE)} to ${formatDateAsYMD(SBEND_DATE)}...`);
  const results = [];
  const failed = [];
  let total = 0;
  for (let d = new Date(SBSTART_DATE); d <= SBEND_DATE; d.setDate(d.getDate() + 1)) {
    const cur = new Date(d);
    total++;
    try {
      const puzzle = await fetchSpellingBeeForDate(cur);
      if (puzzle) {
        results.push(puzzle);
        console.log(`${formatDateAsYMD(cur)} -> Spelling Bee`);
      } else {
        failed.push(formatDateAsYMD(cur));
      }
    } catch (err) {
      failed.push(formatDateAsYMD(cur));
    }
    if (total % 50 === 0) console.log(`Processed ${total} dates...`);
  }

  if (failed.length > FAILURE_THRESHOLD) {
    console.error(`Warning: ${failed.length} Spelling Bee dates failed (threshold: ${FAILURE_THRESHOLD})`);
  }

  const fileContent = `const dailyPuzzles = [${results.map(p => `  ${JSON.stringify(p)}`).join(',\n')}];\n`;
  try {
    fs.writeFileSync(SBOUT_FILE, fileContent, 'utf8');
    fs.writeFileSync(SBOUT_FILE_2, fileContent + `\n\nmodule.exports = {\n  dailyPuzzles\n}`, 'utf8');
    console.log(`Wrote ${results.length} Spelling Bee puzzles`);
  } catch (err) {
    console.error(`Failed to write Spelling Bee files: ${err && err.message ? err.message : String(err)}`);
  }
}

/// MINI CROSSWORD
const MINISTART_DATE = new Date('2023-01-02');
const MINIEND_DATE = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();
const MINIOUT_FILE = path.join(__dirname, '..', 'CLIGames-web', 'src', 'js', 'mini_dailyPuzzles.js');
const MINIOUT_FILE_2 = path.join(__dirname, '..', 'Mini', 'mini_puzzles.js');

async function fetchMiniForDate(d) {
  const dateStr = formatDateAsYMD(d);
  const url = `https://www.nytimes.com/svc/crosswords/v6/puzzle/mini/${dateStr}.json`;
  const maxRetries = 3;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        attempt++;
        continue;
      }
      const json = await res.json();
      return json;
    } catch (err) {
      attempt++;
    }
  }
  return null;
}

async function mainMini() {
  if (typeof fetch === 'undefined') {
    const errMsg = 'This script requires Node.js 18 or later with native fetch support.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log(`Fetching Mini crosswords from ${formatDateAsYMD(MINISTART_DATE)} to ${formatDateAsYMD(MINIEND_DATE)}...`);
  const results = [];
  const failed = [];
  let total = 0;
  for (let d = new Date(MINISTART_DATE); d <= MINIEND_DATE; d.setDate(d.getDate() + 1)) {
    const cur = new Date(d);
    total++;
    try {
      const puzzle = await fetchMiniForDate(cur);
      if (puzzle) {
        results.push(puzzle);
        console.log(`${formatDateAsYMD(cur)} -> Mini`);
      } else {
        failed.push(formatDateAsYMD(cur));
      }
    } catch (err) {
      failed.push(formatDateAsYMD(cur));
    }
    if (total % 50 === 0) console.log(`Processed ${total} dates...`);
  }

  if (failed.length > FAILURE_THRESHOLD) {
    console.error(`Warning: ${failed.length} Mini dates failed (threshold: ${FAILURE_THRESHOLD})`);
  }

  const fileContent = `const dailyPuzzles = [${results.map(p => `  ${JSON.stringify(p)}`).join(',\n')}];\n`;
  try {
    fs.writeFileSync(MINIOUT_FILE, fileContent, 'utf8');
    fs.writeFileSync(MINIOUT_FILE_2, fileContent + `\n\nmodule.exports = {\n  dailyPuzzles\n}`, 'utf8');
    console.log(`Wrote ${results.length} Mini crosswords`);
  } catch (err) {
    console.error(`Failed to write Mini files: ${err && err.message ? err.message : String(err)}`);
  }
}

/// MIDI CROSSWORD
const MIDISTART_DATE = new Date('2023-07-10');
const MIDIEND_DATE = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();
const MIDIOUT_FILE = path.join(__dirname, '..', 'CLIGames-web', 'src', 'js', 'midi_dailyPuzzles.js');
const MIDIOUT_FILE_2 = path.join(__dirname, '..', 'Midi', 'midi_puzzles.js');

async function fetchMidiForDate(d) {
  const dateStr = formatDateAsYMD(d);
  const url = `https://www.nytimes.com/svc/crosswords/v6/puzzle/midi/${dateStr}.json`;
  const maxRetries = 3;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        attempt++;
        continue;
      }
      const json = await res.json();
      return json;
    } catch (err) {
      attempt++;
    }
  }
  return null;
}

async function mainMidi() {
  if (typeof fetch === 'undefined') {
    const errMsg = 'This script requires Node.js 18 or later with native fetch support.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log(`Fetching MIDI crosswords from ${formatDateAsYMD(MIDISTART_DATE)} to ${formatDateAsYMD(MIDIEND_DATE)}...`);
  const results = [];
  const failed = [];
  let total = 0;
  for (let d = new Date(MIDISTART_DATE); d <= MIDIEND_DATE; d.setDate(d.getDate() + 1)) {
    const cur = new Date(d);
    total++;
    try {
      const puzzle = await fetchMidiForDate(cur);
      if (puzzle) {
        results.push(puzzle);
        console.log(`${formatDateAsYMD(cur)} -> MIDI`);
      } else {
        failed.push(formatDateAsYMD(cur));
      }
    } catch (err) {
      failed.push(formatDateAsYMD(cur));
    }
    if (total % 50 === 0) console.log(`Processed ${total} dates...`);
  }

  if (failed.length > FAILURE_THRESHOLD) {
    console.error(`Warning: ${failed.length} MIDI dates failed (threshold: ${FAILURE_THRESHOLD})`);
  }

  const fileContent = `const dailyPuzzles = [${results.map(p => `  ${JSON.stringify(p)}`).join(',\n')}];\n`;
  try {
    fs.writeFileSync(MIDIOUT_FILE, fileContent, 'utf8');
    fs.writeFileSync(MIDIOUT_FILE_2, fileContent + `\n\nmodule.exports = {\n  dailyPuzzles\n}`, 'utf8');
    console.log(`Wrote ${results.length} MIDI crosswords`);
  } catch (err) {
    console.error(`Failed to write MIDI files: ${err && err.message ? err.message : String(err)}`);
  }
}

/// PIPS
const PIPSSTART_DATE = new Date('2024-08-05');
const PIPSEND_DATE = (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();
const PIPSOUT_FILE = path.join(__dirname, '..', 'CLIGames-web', 'src', 'js', 'pips_dailyPuzzles.js');
const PIPSOUT_FILE_2 = path.join(__dirname, '..', 'Pips', 'pips_puzzles.js');

async function fetchPipsForDate(d) {
  const dateStr = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const url = `https://www.nytimes.com/svc/pips/game/${dateStr}.json`;
  const maxRetries = 3;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        attempt++;
        continue;
      }
      const json = await res.json();
      return json;
    } catch (err) {
      attempt++;
    }
  }
  return null;
}

async function mainPips() {
  if (typeof fetch === 'undefined') {
    const errMsg = 'This script requires Node.js 18 or later with native fetch support.';
    console.error(errMsg);
    throw new Error(errMsg);
  }
  console.log(`Fetching Pips puzzles from ${formatDateAsYMD(PIPSSTART_DATE)} to ${formatDateAsYMD(PIPSEND_DATE)}...`);
  const results = [];
  const failed = [];
  let total = 0;
  for (let d = new Date(PIPSSTART_DATE); d <= PIPSEND_DATE; d.setDate(d.getDate() + 1)) {
    const cur = new Date(d);
    total++;
    try {
      const puzzle = await fetchPipsForDate(cur);
      if (puzzle) {
        results.push(puzzle);
        console.log(`${formatDateAsYMD(cur)} -> Pips`);
      } else {
        failed.push(formatDateAsYMD(cur));
      }
    } catch (err) {
      failed.push(formatDateAsYMD(cur));
    }
    if (total % 50 === 0) console.log(`Processed ${total} dates...`);
  }

  if (failed.length > FAILURE_THRESHOLD) {
    console.error(`Warning: ${failed.length} Pips dates failed (threshold: ${FAILURE_THRESHOLD})`);
  }

  const fileContent = `const dailyPuzzles = [${results.map(p => `  ${JSON.stringify(p)}`).join(',\n')}];\n`;
  try {
    fs.writeFileSync(PIPSOUT_FILE, fileContent, 'utf8');
    fs.writeFileSync(PIPSOUT_FILE_2, fileContent + `\n\nmodule.exports = {\n  dailyPuzzles\n}`, 'utf8');
    console.log(`Wrote ${results.length} Pips puzzles`);
  } catch (err) {
    console.error(`Failed to write Pips files: ${err && err.message ? err.message : String(err)}`);
  }
}

// Run all fetch functions
Promise.all([
  mainSpellingBee(),
  mainMini(),
  mainMidi(),
  mainPips()
]).catch(err => { console.error(err); process.exit(1); });
