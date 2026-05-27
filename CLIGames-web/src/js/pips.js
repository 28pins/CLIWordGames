let guesses = [];
let matches = [];
let date = new Date();

if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('date')) {
        const parsed = new Date(params.get('date'));
        if (!isNaN(parsed)) date = parsed;
    }
}

let puzzle = null;

const HELP_TEXT = `Pips - Match patterns to images
Type "exit" or "quit" to exit the game
Type "help" to see this message again
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
    
    consolePort.log(chalkPort.blue(`Pips puzzle for ${date.toDateString()}:\n`));
    displayPuzzleInfo();
    
    while (true) {
        const raw = await inquirerPort.promptForWord('Enter your guess or command:');
        const cmd = (raw || '').toLowerCase().trim();
        
        if (!cmd) {
            consolePort.log(chalkPort.red('Empty input\n'));
            continue;
        }
        
        if (cmd === 'exit' || cmd === 'quit') {
            consolePort.log('Thanks for playing!\n');
            return;
        }
        
        if (cmd === 'help') {
            consolePort.log(chalkPort.blue(HELP_TEXT));
            continue;
        }
        
        if (cmd === 'date' && guesses.length === 0) {
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
        
        // Parse guess
        const parts = cmd.split(' ');
        let validGuess = true;
        
        for (let i = 0; i < parts.length - 1; i += 2) {
            const patternNum = parseInt(parts[i]);
            const imageNum = parseInt(parts[i + 1]);
            
            if (isNaN(patternNum) || isNaN(imageNum)) {
                validGuess = false;
                break;
            }
            
            if (patternNum < 1 || patternNum > (puzzle.palette ? puzzle.palette.length : 0) ||
                imageNum < 1 || imageNum > (puzzle.images ? puzzle.images.length : 0)) {
                validGuess = false;
                break;
            }
        }
        
        if (!validGuess) {
            consolePort.log(chalkPort.red('Invalid guess. Enter pattern-image pairs (e.g., "1 2 3 4")\n'));
            continue;
        }
        
        guesses.push(cmd);
        consolePort.log(chalkPort.yellow(`Guess recorded: ${cmd}\n`));
        displayPuzzleInfo();
    }
}

function displayPuzzleInfo() {
    if (!puzzle) {
        consolePort.log(chalkPort.red('Puzzle data unavailable\n'));
        return;
    }
    
    consolePort.log(chalkPort.blue('Patterns to match:\n'));
    if (puzzle.palette && puzzle.palette.length > 0) {
        puzzle.palette.forEach((item, index) => {
            const status = matches.includes(index) ? chalkPort.green('✓') : ' ';
            consolePort.log(`  ${status} ${index + 1}. Pattern ${index + 1}\n`);
        });
    }
    
    if (guesses.length > 0) {
        consolePort.log(chalkPort.blue(`\nGuesses: ${guesses.length}\n`));
    }
    consolePort.log(chalkPort.blue('-'.repeat(40)) + '\n\n');
}

main().catch(err => {
    consolePort.log(chalkPort.red(`Error: ${err.message}\n`));
});
