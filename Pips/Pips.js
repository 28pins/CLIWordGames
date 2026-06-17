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
    return `${y}${m}${d}`;
}

/// MARK: - Puzzle Fetching
async function getPipsPuzzle(forDate) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://www.nytimes.com/svc/pips/game/${formatDate(forDate)}.json`;

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
let guesses = [];
let matches = [];

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
                console.log(chalk.blue('Pips -- CLI Daily Puzzle Game'));
                console.log(chalk.blue('Match images to their patterns'));
                console.log(chalk.blue('Type "exit" or "quit" to exit the game'));
                console.log(chalk.blue('Type "help" to see this message again'));
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
        puzzle = await getPipsPuzzle(date);
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
    console.log(chalk.blue('Pips -- CLI Daily Puzzle Game'));
    console.log(chalk.yellow('-'.repeat(40)));

    if (puzzle.palette && puzzle.palette.length > 0) {
        console.log(chalk.blue('Patterns to match:'));
        puzzle.palette.forEach((item, index) => {
            const status = matches.includes(index) ? chalk.green('✓') : ' ';
            console.log(`  ${status} ${index + 1}. Pattern ${index + 1}`);
        });
    }

    if (guesses.length > 0) {
        console.log(chalk.blue(`\nGuesses: ${guesses.length}`));
    }
    console.log(chalk.yellow('-'.repeat(40)));
    console.log('');
}

async function playGame() {
    while (true) {
        const { input } = await inquirer.prompt([{ 
            type: 'input', 
            name: 'input', 
            message: 'Enter your guess (pattern1 image1 pattern2 image2 ... or commands):' 
        }]);

        const cmd = input.toLowerCase().trim();

        if (cmd === 'exit' || cmd === 'quit') {
            console.log(chalk.green('Thanks for playing!'));
            return;
        }

        if (cmd === 'help') {
            console.log(chalk.blue('Match patterns to images by entering pattern-image pairs'));
            displayPuzzleInfo();
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
            console.log(chalk.red('Invalid guess. Enter pattern-image pairs (e.g., "1 2 3 4")'));
            continue;
        }

        guesses.push(cmd);
        console.log(chalk.yellow(`Guess recorded: ${cmd}`));
        displayPuzzleInfo();
    }
}

main();
