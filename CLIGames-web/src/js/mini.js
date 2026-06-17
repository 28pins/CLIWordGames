let answers = {};
let date = new Date();

if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('date')) {
        const parsed = new Date(params.get('date'));
        if (!isNaN(parsed)) date = parsed;
    }
}

let puzzle = null;

const HELP_TEXT = `Mini Crossword
Type "exit" or "quit" to exit the game
Type "help" to see this message again
Type "grid" to see the crossword clues
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
    
    consolePort.log(chalkPort.blue(`Mini Crossword puzzle for ${date.toDateString()}:\n`));
    displayPuzzleInfo();
    
    while (true) {
        const raw = await inquirerPort.promptForWord('Enter clue number and answer (e.g., "1 HELLO"):');
        const input = (raw || '').toLowerCase().trim();
        
        if (!input) {
            consolePort.log(chalkPort.red('Empty input\n'));
            continue;
        }
        
        if (input === 'exit' || input === 'quit') {
            consolePort.log('Thanks for playing!\n');
            return;
        }
        
        if (input === 'help') {
            consolePort.log(chalkPort.blue(HELP_TEXT));
            continue;
        }
        
        if (input === 'grid') {
            displayPuzzleInfo();
            continue;
        }
        
        if (input === 'date' && Object.keys(answers).length === 0) {
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
        
        const parts = input.split(' ');
        if (parts.length < 2) {
            consolePort.log(chalkPort.red('Please enter a clue number and answer\n'));
            continue;
        }
        
        const clueNum = parts[0];
        const answer = parts.slice(1).join(' ').toUpperCase();
        
        // Find the clue
        const clue = puzzle.body && puzzle.body.find(c => c.label === clueNum);
        if (!clue) {
            consolePort.log(chalkPort.red('Invalid clue number\n'));
            continue;
        }
        
        // Check if answer is correct
        if (clue.answer && clue.answer.toUpperCase() === answer) {
            answers[clueNum] = answer;
            consolePort.log(chalkPort.green('✓ Correct!\n'));
            
            // Check if puzzle is complete
            if (puzzle.body && Object.keys(answers).length === puzzle.body.length) {
                consolePort.log(chalkPort.green('🎉 Puzzle complete!\n'));
                consolePort.log('Thanks for playing!\n');
                return;
            }
            displayPuzzleInfo();
        } else {
            consolePort.log(chalkPort.red('✗ Incorrect\n'));
        }
    }
}

function displayPuzzleInfo() {
    if (!puzzle || !puzzle.body) {
        consolePort.log(chalkPort.red('Puzzle data unavailable\n'));
        return;
    }
    
    consolePort.log(chalkPort.blue('Across:\n'));
    puzzle.body.filter(c => c.direction === 'Across').forEach(clue => {
        const status = answers[clue.label] ? chalkPort.green('✓') : ' ';
        consolePort.log(`  ${status} ${clue.label}. ${clue.clue}\n`);
    });
    
    consolePort.log(chalkPort.blue('\nDown:\n'));
    puzzle.body.filter(c => c.direction === 'Down').forEach(clue => {
        const status = answers[clue.label] ? chalkPort.green('✓') : ' ';
        consolePort.log(`  ${status} ${clue.label}. ${clue.clue}\n`);
    });
    
    consolePort.log(chalkPort.blue('-'.repeat(40)) + '\n');
    consolePort.log(`Filled: ${Object.keys(answers).length}/${puzzle.body.length}\n\n`);
}

main().catch(err => {
    consolePort.log(chalkPort.red(`Error: ${err.message}\n`));
});
