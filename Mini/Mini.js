#!/usr/bin/env node

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\nGame exited. Goodbye!');
    process.exit(0);
});
/// MARK: - Variable Definitions
//Import word lists
const { guessWords, dailyWords } = require('./mini_words.js');
if ( !guessWords || !dailyWords ) {
    console.error('Error: word lists not found. Please run "node scripts/populate_dailyWords.js" to fetch the word lists from the NYT API.');
    process.exit(1);
}
const inquirer = require('inquirer');
const chalk = require('chalk');
let guesses = []
let mustRewriteGuesses = true;
let date = new Date();
let hardMode = false;
const MAX_GUESSES = 4; // Mini has 4 guesses instead of 6
/// MARK: - 
async function main() {
    console.clear();
    const args = process.argv.slice(2);
    process.stdin.on('data', function(key) {
        if (key === '\u0003' || key === '\u001B') { // Ctrl+C or Escape
            console.log(chalk.green('Goodbye!'));
            process.exit();
        }
    });
    if ( args.length > 0 ) {
        for ( let i = 0; i < args.length; i++ ) {
            const arg = args[i].toLowerCase();
            if ( arg === 'help' || arg === '--help' || arg === '-h' ) {
                console.log(chalk.blue('Type "exit" or "quit" to exit the game'));
                console.log(chalk.blue('Type "help" to see this message again'));
                console.log(chalk.blue('Type "guesses" to see your previous guesses'));
                console.log(chalk.blue('Type "--hard" for hard mode'));
                console.log(chalk.blue('Type a date as an argument to play a specific puzzle (format: YYYY-MM-DD)'));
                return;
            } else if ( arg === '--hard' ) {
                hardMode = true;
            } else {
                if(Date.parse(arg)) {
                    date = new Date(arg);
                } else {
                    console.log(chalk.red('Invalid date format. Please use YYYY-MM-DD.'));
                    return;
                }
            }
        }
    }
    const wordOfDay = await lookupDailyWord(date);
    displayKeyboard(wordOfDay);
    while( guesses.length < MAX_GUESSES ) {
        const { word } = await inquirer.prompt([{ type:'input', name:'word', message:'Guess a word:' }]);
        const guess = word.toLowerCase();
        if ( !guess ) { console.log(chalk.red('Empty word')); mustRewriteGuesses = true; continue; }
        else if ( guess === 'guesses' ) {  renderGuesses(guesses, word); continue; }
        if ( guess === 'help' ) {
            console.log(chalk.blue('Type "exit" or "quit" or press Esc or Ctrl+C to exit the game'));
            console.log(chalk.blue('Type "help" to see this message again'));
            console.log(chalk.blue('Type "guesses" to see your previous guesses'));
            mustRewriteGuesses = true;
            continue;
        }
        else if ( guess === 'exit' || guess === 'quit' ) { console.log("Exiting..."); return; }
        else if ( guess.length == 0 ) { console.log(chalk.red('Empty word')); mustRewriteGuesses = true; }
        else if ( !isPresentInWordList(guess) ) { console.log(chalk.red('Not in list')); mustRewriteGuesses = true; }
        else if ( isPresentInArray(guess, guesses) ) { console.log(chalk.red('No duplicates')); mustRewriteGuesses = true; }
        else if ( hardMode && !isHardModeValid(guess, guesses, wordOfDay) ) { console.log(chalk.red('Hard Mode: Use revealed letters!')); mustRewriteGuesses = true; }
        else { /// MARK: - Highlighting logic
            guesses.push(guess);
            if ( mustRewriteGuesses ) {
                console.clear();
                displayKeyboard(wordOfDay);
                renderGuesses(guesses, wordOfDay);
            } else {
                renderGuess(guesses.length - 1, wordOfDay);
            }
            if ( guess === wordOfDay ) {
                console.log("Great game!")
                console.log(`Mini ${ lookupDailyIndex(date) } ${ guesses.length }/${ MAX_GUESSES }${ hardMode ? '*' : '' }\n`)
                renderGuesses(guesses, wordOfDay, true)
                console.log('Want to play?  Try online at 28pins.github.io');
                console.log(chalk.bgHex('#669966')('                     \n Thanks for playing! \n                     '));
                return;
            }
        }
    }
    // Failed - out of guesses
    console.log(chalk.red(`\nGame Over! The word was: ${wordOfDay}`));
    console.log(`Mini ${ lookupDailyIndex(date) } X/${ MAX_GUESSES }${ hardMode ? '*' : '' }\n`)
    console.log('Want to try again?  Try online at 28pins.github.io');
}
/// MARK: - Display Keyboard
function displayKeyboard( answerWord ) {
    //Render Qwerty keyboard
    if ( hardMode ) {
        console.log(chalk.yellow('HARD MODE') + chalk.blue(' -- Mini -- CLI Daily Word Game'));
    } else {
        console.log(chalk.blue('Mini -- CLI Daily Word Game'));
    }
    console.log(chalk.gray('─ ─ ─ ─ ─'));
}

function renderGuess(index, answerWord) {
    const guess = guesses[index];
    let output = "";
    for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        if (answerWord[i] === letter) {
            output += chalk.bgGreen(letter) + " ";
        } else if (answerWord.includes(letter)) {
            output += chalk.bgYellow(letter) + " ";
        } else {
            output += chalk.bgGray(letter) + " ";
        }
    }
    console.log(output);
}

function renderGuesses(guessesArray, answerWord, isFinal = false) {
    console.log("");
    for (let i = 0; i < guessesArray.length; i++) {
        renderGuess(i, answerWord);
    }
    if (!isFinal && guessesArray.length < MAX_GUESSES) {
        console.log(chalk.gray(`${MAX_GUESSES - guessesArray.length} attempts remaining`));
    }
    console.log("");
    mustRewriteGuesses = false;
}

/// MARK: - Lookup Functions
function lookupDailyIndex(date) {
    const epochDate = new Date('2021-06-19'); // Mini launch date
    const timeDifference = date.getTime() - epochDate.getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    return daysDifference + 1;
}

async function lookupDailyWord(date) {
    const index = lookupDailyIndex(date);
    if (index < 1 || index > dailyWords.length) {
        console.error(`Mini puzzle #${index} not available. Valid range: 1 to ${dailyWords.length}`);
        process.exit(1);
    }
    return dailyWords[index - 1];
}

function isPresentInWordList(word) {
    return guessWords.includes(word.toLowerCase());
}

function isPresentInArray(word, arr) {
    return arr.includes(word.toLowerCase());
}

function isHardModeValid(guess, previousGuesses, answer) {
    for (let prev of previousGuesses) {
        for (let i = 0; i < prev.length; i++) {
            if (answer[i] === prev[i] && guess[i] !== answer[i]) {
                return false;
            }
            if (answer.includes(prev[i]) && !guess.includes(prev[i])) {
                return false;
            }
        }
    }
    return true;
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
