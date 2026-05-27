#!/usr/bin/env node

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\nGame exited. Goodbye!');
    process.exit(0);
});

/// MARK: - Imports
const { dailyPuzzles, allWords } = require('./spellingBee_puzzles.js');
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
let maxScore = 0;

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
                console.log(chalk.blue('Type "shuffle" to shuffle the letters'));
                console.log(chalk.blue('Type a date as an argument to play a specific puzzle (format: YYYY-MM-DD)'));
                return;
            } else if (arg === 'shuffle') {
                // This will be handled in game
                continue;
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
            console.log(chalk.blue('Type "exit" or "quit" to exit'));
            console.log(chalk.blue('Type "found" to see your found words'));
            console.log(chalk.blue('Type "shuffle" to shuffle the letters'));
            continue;
        } else if (command === 'found') {
            console.log('Found words:', foundWords.join(', ') || 'None yet');
            continue;
        } else if (command === 'shuffle') {
            puzzle.letters = shuffleArray([...puzzle.letters]);
            displayPuzzle(puzzle);
            continue;
        } else {
            const result = tryWord(command, puzzle);
            if (result.valid) {
                if (!foundWords.includes(command)) {
                    foundWords.push(command);
                    score += result.points;
                    console.log(chalk.green(`✓ ${result.points} points!`));
                    // Check if all words found
                    if (foundWords.length === puzzle.answers.length) {
                        console.log(chalk.bgGreen(chalk.black('  PANGRAM - All words found!  ')));
                    }
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
    
    if (!word.includes(puzzle.center)) {
        return { valid: false, message: 'Must include center letter' };
    }
    
    // Check all letters are valid
    for (let char of word) {
        if (!puzzle.letters.includes(char) && char !== puzzle.center) {
            return { valid: false, message: 'Invalid letters' };
        }
    }
    
    // Check if word is in puzzle answers
    if (!puzzle.answers.includes(word)) {
        return { valid: false, message: 'Not in word list' };
    }
    
    // Calculate points
    let points = word.length === 4 ? 1 : word.length;
    if (new Set(word).size === 7) { // All 7 letters used
        points += 7;
    }
    
    return { valid: true, points };
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
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
    const epochDate = new Date('2018-05-28'); // Spelling Bee launch date
    const timeDifference = date.getTime() - epochDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
}

function displayPuzzle(puzzle) {
    console.clear();
    console.log(chalk.blue('Spelling Bee -- CLI Daily Puzzle Game'));
    console.log(chalk.gray('─ ─ ─ ─ ─ ─ ─'));
    console.log('');
    
    // Display hexagon
    const letters = puzzle.letters;
    const center = puzzle.center;
    console.log(`    ${letters[0]}`);
    console.log(`  ${letters[5]}   ${letters[1]}`);
    console.log(`    ${chalk.yellow.bold(center)}`);
    console.log(`  ${letters[4]}   ${letters[2]}`);
    console.log(`    ${letters[3]}`);
    
    console.log('');
    console.log(chalk.gray(`Found: ${foundWords.length} words`));
    console.log('');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
