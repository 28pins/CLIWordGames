#!/usr/bin/env node

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\nGame exited. Goodbye!');
    process.exit(0);
});

/// MARK: - Imports
const { dailyPuzzles, allWords } = require('./pips_puzzles.js');
if (!dailyPuzzles || !allWords) {
    console.error('Error: puzzle data not found. Please run "node scripts/populate_dailyWords.js" to fetch the data from the NYT API.');
    process.exit(1);
}
const inquirer = require('inquirer');
const chalk = require('chalk');

/// MARK: - Variable Definitions
let foundWords = [];
let score = 0;
let date = new Date();

/// MARK: - Main Game
async function main() {
    console.clear();
    const args = process.argv.slice(2);
    
    process.stdin.on('data', function(key) {
        if (key === '\u0003' || key === '\u001B') { // Ctrl+C or Escape
            console.log(chalk.green('Goodbye!'));
            process.exit();
        }
    });

    if (args.length > 0) {
        for (let i = 0; i < args.length; i++) {
            const arg = args[i].toLowerCase();
            if (arg === 'help' || arg === '--help' || arg === '-h') {
                console.log(chalk.blue('Type "exit" or "quit" to exit the game'));
                console.log(chalk.blue('Type "help" to see this message again'));
                console.log(chalk.blue('Type "found" to see your found words'));
                console.log(chalk.blue('Type a date as an argument to play a specific puzzle (format: YYYY-MM-DD)'));
                return;
            } else {
                if (Date.parse(arg)) {
                    date = new Date(arg);
                } else {
                    console.log(chalk.red('Invalid date format. Please use YYYY-MM-DD.'));
                    return;
                }
            }
        }
    }

    const puzzle = await getPuzzle(date);
    if (!puzzle) {
        console.error('Could not load puzzle for date:', date.toDateString());
        process.exit(1);
    }

    displayPuzzle(puzzle);
    
    while (true) {
        const { input } = await inquirer.prompt([{ 
            type: 'input', 
            name: 'input', 
            message: `Score: ${score}. Word: ` 
        }]);
        
        const command = input.toLowerCase().trim();
        
        if (!command) {
            continue;
        } else if (command === 'exit' || command === 'quit') {
            console.log('Thanks for playing!');
            return;
        } else if (command === 'help') {
            console.log(chalk.blue('Form words from adjacent border letters'));
            console.log(chalk.blue('Type "found" to see your found words'));
            console.log(chalk.blue('Type "exit" to quit'));
            continue;
        } else if (command === 'found') {
            console.log('Found words:', foundWords.join(', ') || 'None yet');
            continue;
        } else {
            const result = tryWord(command, puzzle);
            if (result.valid) {
                if (!foundWords.includes(command)) {
                    foundWords.push(command);
                    score += result.points;
                    console.log(chalk.green(`✓ ${result.points} points!`));
                } else {
                    console.log(chalk.yellow('Already found'));
                }
            } else {
                console.log(chalk.red(result.message));
            }
        }
    }
}

/// MARK: - Game Logic
function tryWord(word, puzzle) {
    word = word.toLowerCase().trim();
    
    if (word.length < 4) {
        return { valid: false, message: 'Too short (min 4 letters)' };
    }
    
    // Check if word is in puzzle answers
    if (!puzzle.answers.includes(word)) {
        return { valid: false, message: 'Not in word list' };
    }
    
    // Check if path is valid (adjacent letters from border)
    if (!isValidPath(word, puzzle)) {
        return { valid: false, message: 'Invalid path' };
    }
    
    // Calculate points
    let points = word.length;
    
    return { valid: true, points };
}

function isValidPath(word, puzzle) {
    // Get positions of letters on border
    const positions = puzzle.border.map((letter, idx) => ({ letter, idx }));
    
    // Simple validation - just check all letters are on border
    for (let char of word) {
        if (!puzzle.border.includes(char)) {
            return false;
        }
    }
    
    return true;
}

/// MARK: - Puzzle Management
async function getPuzzle(date) {
    const index = getPuzzleIndex(date);
    if (index < 0 || index >= dailyPuzzles.length) {
        return null;
    }
    return dailyPuzzles[index];
}

function getPuzzleIndex(date) {
    const epochDate = new Date('2023-01-01'); // Placeholder date
    const timeDifference = date.getTime() - epochDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
}

function displayPuzzle(puzzle) {
    console.clear();
    console.log(chalk.blue('Pips -- CLI Daily Word Game'));
    console.log(chalk.gray('─ ─ ─ ─ ─ ─ ─'));
    console.log('');
    
    if (!puzzle.border) {
        console.log('No puzzle data');
        return;
    }

    // Display as a box border
    const size = 4;
    const top = puzzle.border.slice(0, size).join(' ');
    const bottom = puzzle.border.slice(size * 2, size * 3).join(' ');
    
    console.log('  ' + top);
    if (puzzle.border.length >= size * 3) {
        console.log(puzzle.border[size * 3 - 1] + '       ' + puzzle.border[size]);
        console.log(puzzle.border[size * 3 - 2] + '       ' + puzzle.border[size + 1]);
    }
    console.log('  ' + bottom);
    
    console.log('');
    console.log(chalk.gray(`Found: ${foundWords.length} words`));
    console.log('');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
