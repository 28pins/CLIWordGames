#!/usr/bin/env node

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\nGame exited. Goodbye!');
    process.exit(0);
});

/// MARK: - Imports
const { dailyPuzzles } = require('./midi_puzzles.js');
if (!dailyPuzzles) {
    console.error('Error: puzzle data not found. Please run "node scripts/populate_dailyWords.js" to fetch the data from the NYT API.');
    process.exit(1);
}
const inquirer = require('inquirer');
const chalk = require('chalk');

/// MARK: - Variable Definitions
let grid = [];
let revealed = [];
let date = new Date();
let solved = false;

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
                console.log(chalk.blue('Type "solve" to see the solution'));
                console.log(chalk.blue('Enter coordinates (e.g., "1,2") to fill in letters'));
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

    grid = JSON.parse(JSON.stringify(puzzle.grid));
    revealed = puzzle.grid.map(row => row.map(() => false));
    
    while (!solved) {
        displayPuzzle();
        const { input } = await inquirer.prompt([{ 
            type: 'input', 
            name: 'input', 
            message: 'Enter action (row,col or help): '
        }]);
        
        const command = input.toLowerCase().trim();
        
        if (!command) {
            continue;
        } else if (command === 'exit' || command === 'quit') {
            console.log('Thanks for playing!');
            return;
        } else if (command === 'help') {
            console.log(chalk.blue('Enter coordinates like "0,0" to reveal a cell'));
            console.log(chalk.blue('Type "solve" to see the solution'));
            console.log(chalk.blue('Type "exit" to quit'));
            continue;
        } else if (command === 'solve') {
            console.log('Solution:');
            displaySolution();
            solved = true;
            continue;
        } else {
            // Try to parse coordinates
            const parts = command.split(',');
            if (parts.length === 2) {
                const row = parseInt(parts[0]);
                const col = parseInt(parts[1]);
                if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
                    revealed[row][col] = true;
                    checkIfSolved();
                } else {
                    console.log(chalk.red('Invalid coordinates'));
                }
            }
        }
    }

    console.log(chalk.bgGreen(chalk.black('  Puzzle Solved!  ')));
    console.log('Thanks for playing!');
}

/// MARK: - Game Logic
function checkIfSolved() {
    let allRevealed = true;
    for (let row of revealed) {
        for (let cell of row) {
            if (!cell) {
                allRevealed = false;
                break;
            }
        }
    }
    solved = allRevealed;
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
    const epochDate = new Date('2024-01-01'); // Placeholder date
    const timeDifference = date.getTime() - epochDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
}

function displayPuzzle() {
    console.clear();
    console.log(chalk.blue('MIDI -- CLI Daily Grid Puzzle'));
    console.log(chalk.gray('─ ─ ─ ─ ─ ─ ─'));
    console.log('');
    
    if (grid.length === 0) {
        console.log('No puzzle data');
        return;
    }

    for (let i = 0; i < grid.length; i++) {
        let row = '';
        for (let j = 0; j < grid[i].length; j++) {
            if (revealed[i][j]) {
                row += chalk.bgGreen(chalk.black(grid[i][j])) + ' ';
            } else {
                row += chalk.bgGray('_') + ' ';
            }
        }
        console.log(row);
    }
    console.log('');
}

function displaySolution() {
    for (let i = 0; i < grid.length; i++) {
        let row = '';
        for (let j = 0; j < grid[i].length; j++) {
            row += chalk.bgBlue(chalk.white(grid[i][j])) + ' ';
        }
        console.log(row);
    }
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
