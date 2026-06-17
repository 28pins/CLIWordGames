#!/usr/bin/env node

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\nGame exited. Goodbye!');
    process.exit(0);
});

/// MARK: - Imports
const chalk = require('chalk');
const inquirer = require('inquirer');
const https = require('https');

/// MARK: - Date Formatting
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/// MARK: - Puzzle Fetching
async function getMidiPuzzle(forDate) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://www.nytimes.com/svc/crosswords/v6/puzzle/midi/${formatDate(forDate)}.json`;

        https.get(apiUrl, { timeout: 10000 }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode !== 200) {
                        throw new Error(`HTTP ${res.statusCode}`);
                    }

                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        })
            .on('error', (error) => {
                process.stdout.write('\x07\n');
                reject(new Error(`API request failed: ${error.message}`));
            })
    });
}

/// MARK: - State Variables
let puzzle = null;
let date = new Date();
let answers = {};

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
                console.log(chalk.blue('MIDI Crossword -- CLI Daily Puzzle Game'));
                console.log(chalk.blue('Type "exit" or "quit" to exit the game'));
                console.log(chalk.blue('Type "help" to see this message again'));
                console.log(chalk.blue('Type "clues" to see the clues'));
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

    try {
        puzzle = await getMidiPuzzle(date);
    } catch (err) {
        console.log(chalk.yellow(`Warning: Could not fetch puzzle from API: ${err.message}`));
        console.log(chalk.yellow('Make sure you have an internet connection.'));
        return;
    }

    displayPuzzleInfo();
    playGame();
}

function displayPuzzleInfo() {
    console.clear();
    console.log(chalk.blue('MIDI Crossword -- CLI Daily Puzzle Game'));
    console.log(chalk.yellow('-'.repeat(50)));
    
    if (puzzle.body && puzzle.body.length > 0) {
        console.log(chalk.blue(`Across (${puzzle.body.filter(c => c.direction === 'Across').length}):`));
        puzzle.body.filter(c => c.direction === 'Across').forEach(clue => {
            const status = answers[clue.label] ? chalk.green('✓') : ' ';
            console.log(`  ${status} ${clue.label}. ${clue.clue}`);
        });
        
        console.log(chalk.blue(`\nDown (${puzzle.body.filter(c => c.direction === 'Down').length}):`));
        puzzle.body.filter(c => c.direction === 'Down').forEach(clue => {
            const status = answers[clue.label] ? chalk.green('✓') : ' ';
            console.log(`  ${status} ${clue.label}. ${clue.clue}`);
        });
    }
    console.log(chalk.yellow('-'.repeat(50)));
    console.log(`Filled: ${Object.keys(answers).length}/${puzzle.body ? puzzle.body.length : 0}`);
    console.log('');
}

async function playGame() {
    while (true) {
        const { input } = await inquirer.prompt([{ 
            type: 'input', 
            name: 'input', 
            message: 'Enter clue number and answer (e.g., "1 HELLO"):' 
        }]);

        const parts = input.toLowerCase().trim().split(' ');
        if (parts.length < 2) {
            if (parts[0] === 'exit' || parts[0] === 'quit') {
                console.log(chalk.green('Thanks for playing!'));
                return;
            }
            if (parts[0] === 'help') {
                console.log(chalk.blue('Enter clue number and answer, or use commands like "clues", "exit"'));
                continue;
            }
            if (parts[0] === 'clues') {
                displayPuzzleInfo();
                continue;
            }
            console.log(chalk.red('Please enter a clue number and answer'));
            continue;
        }

        const clueNum = parts[0];
        const answer = parts.slice(1).join(' ').toUpperCase();

        // Find the clue
        const clue = puzzle.body && puzzle.body.find(c => c.label === clueNum);
        if (!clue) {
            console.log(chalk.red('Invalid clue number'));
            continue;
        }

        // Check if answer is correct
        if (clue.answer && clue.answer.toUpperCase() === answer) {
            answers[clueNum] = answer;
            console.log(chalk.green('✓ Correct!'));
            
            // Check if puzzle is complete
            if (Object.keys(answers).length === puzzle.body.length) {
                console.log(chalk.green('\n🎉 Puzzle complete!'));
                console.log('Thanks for playing!');
                return;
            }
            displayPuzzleInfo();
        } else {
            console.log(chalk.red('✗ Incorrect'));
        }
    }
}

main();
