let guesses = [];
let mustRewriteGuesses = true;
let date = new Date();
if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('date')) {
        const parsed = new Date(params.get('date'));
        if (!isNaN(parsed)) date = parsed;
    }
}
let hardMode = false;
const MAX_GUESSES = 6;
const HELP_TEXT = `Type "exit" or "quit" to exit the game
Type "help" to see this message again
Type "guesses" to see your previous guesses
Type "hard" before first guess to toggle hard mode
Type "date" before first guess to enter YYYY-MM-DD
`;

const evaluateGuess = (g = '', a = '') => {
    const n = g.length;
    const res = Array(n).fill('absent');
    const gA = g.split('');
    const aA = a.split('');
    const freq = {};
    for (let i = 0; i < n; i++) {
        if (aA[i] && gA[i] === aA[i]) res[i] = 'correct';
        else if (aA[i]) freq[aA[i]] = (freq[aA[i]] || 0) + 1;
    }
    for (let i = 0; i < n; i++) if (res[i] !== 'correct') {
        const ch = gA[i];
        if (freq[ch] > 0) { res[i] = 'present'; freq[ch]--; }
    }
    return res;
};

async function main() {
    consolePort.clear();
    const wordOfDay = await lookupDailyWord(date);
    consolePort.log(chalkPort.blue(`Word puzzle for ${date.toDateString()}:\n`));
    displayKeyboard(wordOfDay);
    while (guesses.length < MAX_GUESSES) {
        const raw = await inquirerPort.promptForWord('Guess a word:');
        const guess = (raw || '').toLowerCase();
        if (!guess) { consolePort.log(chalkPort.red('Empty word\n')); mustRewriteGuesses = true; continue; }
        if (guess === 'guesses') { renderGuesses(guesses, wordOfDay); continue; }
        if (guess === 'help') {
            consolePort.log(chalkPort.blue(HELP_TEXT));
            mustRewriteGuesses = true; continue;
        }
        if (guess === 'date' && guesses.length === 0) {
            const dateInput = prompt('Enter a date (YYYY-MM-DD): ');
            const parsed = new Date(dateInput);
            if (isNaN(parsed)) { consolePort.log(chalkPort.red('Invalid date format\n')); mustRewriteGuesses = true; continue; }
            const ymd = formatDateAsYMD(parsed);
            window.open(`?date=${ymd}`, '_blank');
            consolePort.log(chalkPort.blue(`Opened new tab for ${ymd}\n`));
            mustRewriteGuesses = true; continue;
        }
        if (guess === 'hard' && guesses.length === 0) { hardMode = !hardMode; consolePort.log(chalkPort.blue(`Hard mode ${hardMode ? 'enabled' : 'disabled'}\n`)); mustRewriteGuesses = true; continue; }
        if (guess === 'exit' || guess === 'quit') { consolePort.log('Exiting...\n'); return; }
        if (!isPresentInWordList(guess)) { consolePort.log(chalkPort.red('Not in list\n')); mustRewriteGuesses = true; continue; }
        if (guesses.includes(guess)) { consolePort.log(chalkPort.red('No duplicates\n')); mustRewriteGuesses = true; continue; }
        if (hardMode && !isHardModeValid(guess, guesses, wordOfDay)) { consolePort.log(chalkPort.red('Hard Mode: Use revealed letters!\n')); mustRewriteGuesses = true; continue; }
        if (guess === 'aargh') { guesses.push('aargh', wordOfDay); mustRewriteGuesses = true; continue; }

        guesses.push(guess);
        consolePort.clear(); displayKeyboard(wordOfDay); renderGuesses(guesses, wordOfDay);
        if (guess === wordOfDay) {
            consolePort.log('Great game!\n');
            consolePort.log(`Words ${lookupDailyIndex(date)} ${guesses.length}/6${hardMode ? '*' : ''}\n`);
            renderGuesses(guesses, wordOfDay, true);
            consolePort.log('\n');
            consolePort.log(chalkPort.bgHex('#669966')(' Thanks for playing! '));
            return;
        }
    }
}

function displayKeyboard(answerWord) {
    consolePort.log(hardMode ? chalkPort.yellow('HARD MODE') + chalkPort.blue(' -- Wrdli -- CLI Daily Word Game -- help for instructions\n') : chalkPort.blue('Wrdli -- CLI Daily Word Game -- help for instructions\n'));
    const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
    const state = {};
    for (const g of guesses) {
        const marks = evaluateGuess(g, answerWord);
        for (let i = 0; i < g.length; i++) {
            const ch = g[i];
            if (marks[i] === 'correct') state[ch] = 'correct';
            else if (marks[i] === 'present' && state[ch] !== 'correct') state[ch] = 'present';
            else if (!state[ch]) state[ch] = 'absent';
        }
    }
    for (const r of rows) {
        let out = ' '.repeat((40 - 2 * r.length) / 2);
        for (const ch of r) {
            const s = state[ch];
            const fn = s === 'correct' ? chalkPort.green : s === 'present' ? chalkPort.yellow : s === 'absent' ? chalkPort.gray : chalkPort.white;
            out += fn(ch) + ' ';
        }
        consolePort.log(out + '\n');
    }
    consolePort.log('-'.repeat(40) + '\n');
}

function renderGuesses(g, a, em = false) {
    for (const guess of g) renderGuess(guess, a, em);
    if (em) {
        return;
    }
}

function renderGuess(g, a, em = false) {
    const marks = evaluateGuess(g, a);
    if (em) {
        consolePort.log(marks.map(m => m === 'correct' ? '🟩' : m === 'present' ? '🟨' : '⬜️').join('') + '\n');
        return;
    }
    let out = '                ';
    for (let i = 0; i < g.length; i++) {
        const ch = g[i];
        const m = marks[i];
        out += (m === 'correct' ? chalkPort.bgGreen(ch) : m === 'present' ? chalkPort.yellow(ch) : chalkPort.white(ch)) + ' ';
    }
    consolePort.log(out + '\n');
}

function isPresentInWordList(w) { return (typeof guessWords !== 'undefined' && guessWords.includes(w)) || (typeof dailyWords !== 'undefined' && dailyWords.includes(w)); }

function isHardModeValid(guess, previousGuesses, answerWord) {
    for (const prev of previousGuesses) {
        const marks = evaluateGuess(prev, answerWord);
        for (let i = 0; i < marks.length; i++) {
            if (marks[i] === 'correct' && guess[i] !== prev[i]) return false;
            if (marks[i] === 'present' && !guess.includes(prev[i])) return false;
            if (marks[i] === 'present' && guess[i] === prev[i]) return false;
        }
    }
    return true;
}

function lookupDailyIndex(d = new Date()) { const epoch = new Date('2021-06-19T00:00:00'); return getDaysSince(epoch) - getDaysSince(d); }
function formatDateAsYMD(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
async function lookupDailyWord(d = new Date()) {
    try {
        const idx = lookupDailyIndex(d);
        if (typeof dailyWords !== 'undefined' && Array.isArray(dailyWords) && idx >= 0 && idx < dailyWords.length) return dailyWords[idx];
        alert(`Daily word not found in local list: ${typeof dailyWords !== 'undefined' ? `list has ${dailyWords.length} words and requested index is ${idx}` : 'dailyWords is not defined'}`);
    } catch (err) { throw err; }
}
function getDaysSince(d) { const now = Date.now(); const then = new Date(d).getTime(); return Math.floor((now - then) / 86400000); }
main();