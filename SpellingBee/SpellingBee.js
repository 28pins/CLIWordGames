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
async function getSpellingBeePuzzle(forDate) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://www.nytimes.com/svc/spelling-bee/game/${formatDate(forDate)}.json`;

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
let foundWords = [];
let date = new Date();
let puzzle = null;

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
                console.log(chalk.blue('Spelling Bee - Find words using the center letter'));
                console.log(chalk.blue('Type "exit" or "quit" to exit the game'));
                console.log(chalk.blue('Type "help" to see this message again'));
                console.log(chalk.blue('Type "words" to see your found words'));
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
        puzzle = await getSpellingBeePuzzle(date);
        if (!puzzle || !puzzle.today) {
            console.log(chalk.red('Failed to fetch today\'s puzzle. Please check your date and try again.'));
            return;
        }
        puzzle = puzzle.today;
    } catch (err) {
        console.log(chalk.yellow(`Warning: Could not fetch puzzle from API: ${err.message}`));
        console.log(chalk.yellow('Make sure you have an internet connection.'));
        return;
    }

    displayPuzzle();
    playGame();
}

function displayPuzzle() {
    console.clear();
    console.log(chalk.blue('Spelling Bee -- CLI Daily Puzzle Game'));
    console.log(chalk.yellow('-'.repeat(40)));

    const centerLetter = puzzle.centerLetter.toUpperCase();
    const otherLetters = puzzle.outerLetters.map(l => l.toUpperCase()).join(' ');

    console.log(chalk.bgYellow.black(`  ${centerLetter}  `) + ' (center letter - must be in every word)');
    console.log(chalk.blue('Other letters: ') + otherLetters);
    console.log(chalk.yellow('-'.repeat(40)));
    console.log(chalk.blue(`Found: ${foundWords.length} words`));
    if (foundWords.length > 0) {
        console.log(chalk.green(`Words: ${foundWords.join(', ')}`));
    }
    console.log('');
}

async function playGame() {
    while (true) {
        const { word } = await inquirer.prompt([{ type: 'input', name: 'word', message: 'Enter a word:' }]);
        const guess = word.toLowerCase().trim();

        if (!guess) {
            console.log(chalk.red('Empty word'));
            continue;
        }

        if (guess === 'exit' || guess === 'quit') {
            console.log(chalk.green('Thanks for playing!'));
            return;
        }

        if (guess === 'help') {
            console.log(chalk.blue('Find words using the center letter (which must be in every word)'));
            console.log(chalk.blue('Type "exit" or "quit" to exit'));
            console.log(chalk.blue('Type "words" to see your found words'));
            continue;
        }

        if (guess === 'words') {
            displayPuzzle();
            continue;
        }

        // Validate word
        if (!isValidWord(guess)) {
            console.log(chalk.red('Invalid word or already found'));
            continue;
        }

        foundWords.push(guess);
        console.log(chalk.green(`✓ Found! (${foundWords.length} total)`));
        displayPuzzle();
    }
}

function isValidWord(word) {
    // Check if word is already found
    if (foundWords.includes(word)) {
        return false;
    }

    // Check if word contains center letter
    if (!word.includes(puzzle.centerLetter)) {
        console.log(chalk.red('Must contain center letter!'));
        return false;
    }

    // Check if word is in valid words list
    if (!puzzle.validWords || !puzzle.validWords.includes(word)) {
        console.log(chalk.red('Not in word list'));
        return false;
    }

    return true;
}

main();
