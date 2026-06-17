let foundWords = [];
let date = new Date();

if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('date')) {
        const parsed = new Date(params.get('date'));
        if (!isNaN(parsed)) date = parsed;
    }
}

let puzzle = null;

const HELP_TEXT = `Spelling Bee - Find words using the center letter
Type "exit" or "quit" to exit the game
Type "help" to see this message again
Type "words" to see your found words
Type "date" before first guess to enter YYYY-MM-DD
`;

function getPuzzleForDate(d) {
    const idx = dailyPuzzles.findIndex(p => {
        const pDate = new Date(p.date_string || p.print_date);
        return pDate.toDateString() === d.toDateString();
    });
    return idx >= 0 ? dailyPuzzles[idx] : (dailyPuzzles.length > 0 ? dailyPuzzles[0] : null);
}

async function main() {
    consolePort.clear();
    puzzle = getPuzzleForDate(date);
    if (!puzzle) {
        consolePort.log(chalkPort.red('No puzzle found for this date'));
        return;
    }
    
    consolePort.log(chalkPort.blue(`Spelling Bee puzzle for ${date.toDateString()}:\n`));
    displayPuzzle();
    
    while (true) {
        const raw = await inquirerPort.promptForWord('Enter a word:');
        const guess = (raw || '').toLowerCase().trim();
        
        if (!guess) { 
            consolePort.log(chalkPort.red('Empty word\n')); 
            continue; 
        }
        
        if (guess === 'exit' || guess === 'quit') {
            consolePort.log('Thanks for playing!\n');
            return;
        }
        
        if (guess === 'help') {
            consolePort.log(chalkPort.blue(HELP_TEXT));
            continue;
        }
        
        if (guess === 'date' && foundWords.length === 0) {
            const dateInput = prompt('Enter a date (YYYY-MM-DD): ');
            const parsed = new Date(dateInput);
            if (isNaN(parsed)) { 
                consolePort.log(chalkPort.red('Invalid date format\n')); 
                continue; 
            }
            const ymd = formatDateAsYMD(parsed);
            window.open(`?date=${ymd}`, '_blank');
            consolePort.log(chalkPort.blue(`Opened new tab for ${ymd}\n`));
            continue;
        }
        
        if (guess === 'words') {
            displayPuzzle();
            continue;
        }
        
        // Validate word
        if (!isValidWord(guess)) {
            continue;
        }
        
        foundWords.push(guess);
        consolePort.log(chalkPort.green(`✓ Found! (${foundWords.length} total)\n`));
        displayPuzzle();
    }
}

function displayPuzzle() {
    if (!puzzle || !puzzle.today) {
        consolePort.log(chalkPort.red('Puzzle data unavailable\n'));
        return;
    }
    
    const centerLetter = puzzle.today.centerLetter.toUpperCase();
    const otherLetters = (puzzle.today.outerLetters || []).map(l => l.toUpperCase()).join(' ');
    
    consolePort.log(chalkPort.bgYellow.black(`  ${centerLetter}  `) + chalkPort.blue(' (center letter - must be in every word)\n'));
    consolePort.log(chalkPort.blue('Other letters: ') + otherLetters + '\n');
    consolePort.log(chalkPort.blue('-'.repeat(40)) + '\n');
    consolePort.log(chalkPort.blue(`Found: ${foundWords.length} words\n`));
    if (foundWords.length > 0) {
        consolePort.log(chalkPort.green(`Words: ${foundWords.join(', ')}\n`));
    }
    consolePort.log('\n');
}

function isValidWord(word) {
    if (!puzzle || !puzzle.today) return false;
    
    // Check if word is already found
    if (foundWords.includes(word)) {
        consolePort.log(chalkPort.red('Already found\n'));
        return false;
    }
    
    // Check if word contains center letter
    if (!word.includes(puzzle.today.centerLetter)) {
        consolePort.log(chalkPort.red('Must contain center letter!\n'));
        return false;
    }
    
    // Check if word is in valid words list
    if (!puzzle.today.validWords || !puzzle.today.validWords.includes(word)) {
        consolePort.log(chalkPort.red('Not in word list\n'));
        return false;
    }
    
    return true;
}

main().catch(err => {
    consolePort.log(chalkPort.red(`Error: ${err.message}\n`));
});
