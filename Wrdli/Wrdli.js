#!/usr/bin/env node

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('\nGame exited. Goodbye!');
    process.exit(0);
});
/// MARK: - Variable Defintions
//Import word lists
const { guessWords, dailyWords } = require('./wrdli_words.js');
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
    while( guesses.length < 6 ) {
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
        else if ( guess === 'aargh' ) { console.log(chalk.red(wordOfDay)); guesses.push("aargh"); guesses.push(wordOfDay); mustRewriteGuesses = true; }
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
                console.log(`Wrdli ${ lookupDailyIndex(date) } ${ guesses.length }/6${ hardMode ? '*' : '' }\n`)
                renderGuesses(guesses, wordOfDay, true)
                console.log('Want to play?  Try online at 28pins.github.io');
                console.log(chalk.bgHex('#669966')('                     \n Thanks for playing! \n                     '));
                return;
            }
        }
    }
}
/// MARK: - Display Keyboard
function displayKeyboard( answerWord ) {
    //Render Qwerty keyboard
    if ( hardMode ) {
        console.log(chalk.yellow('HARD MODE') + chalk.blue(' -- Wrdli -- CLI Daily Word Game'));
    } else {
        console.log(chalk.blue('Wrdli -- CLI Daily Word Game'));
    }
    const keyboard =  ['           q w e r t y u i o p', '            a s d f g h j k l', '              z x c v b n m'];
    for (const row of keyboard) {
        for (const char of row) {
            if (char === ' ') {
                process.stdout.write(' ');
            } else {
                let charColor = chalk.white;
                for (const guess of guesses) {
                    if (charColor === chalk.green) {
                        break;
                    }
                    if (isPresentInArray(char, guess)) {
                        charColor = chalk.gray;
                    }
                    if (isPresentInArray(char, guess) && isPresentInArray(char, answerWord)) {
                        charColor = chalk.yellow;
                        for (let i = 0; i < guess.length; i++) {
                            if (guess[i] === char && answerWord[i] === char) {
                                charColor = chalk.green;
                                break;
                            }
                        }
                    }
                }
                process.stdout.write(charColor(char));
            }
        }
        console.log('\n');
    }
    console.log('-'.repeat(40));
}
/// MARK: - Rendering
function renderGuesses( g, a, e = false ) {
    for( let i=0;i<g.length;i++ ) {
        renderGuess(g[i], a, e);
    }
    // Copy to clipboard (macOS)
    if ( e ) {
        let r = `Wordle ${ lookupDailyIndex() } ${ guesses.length }/6\n\n`;
        for( let i=0;i<g.length;i++ ) {
            for( let j=0;j<g[i].length;j++ ) {
                r += renderEmoji(g[i], j, a);
            }
            r += '\n';
        }
        const { spawn } = require('child_process');
        const proc = spawn('pbcopy');
        proc.stdin.write(r);
        proc.stdin.end();
        proc.on('close', (code) => {
            if (code === 0) {
                console.log('Copied to clipboard!');
            } else {
                console.error('Failed to copy to clipboard.  You can manually copy the above text to share your results.');
            }
        });
    }
}
function renderGuess( g, a, emojified = false ) {
    let r = '';
    if ( emojified ) {
        for( let i=0;i<g.length;i++ ) {
            r += renderEmoji(g, i, a);
        }
    } else {
        r = '                ';
        for( let i=0;i<g.length;i++ ) {
            r += renderChar(g, i, a);
            r += ' ';
        }
    }
    console.log(r);
}
/// MARK: - Char rendering
function renderChar( w, i, a ) {
    if ( getIndexesOfCharInWord(w[i], w).length > 1 ) { // If the guess has multiple of the same char
        if ( i >= a.length ) {
            return chalk.white(w[i]);
        } else if ( w[i] == a[i] ) {
            return chalk.black.bgGreen(w[i]);
        } else if ( isPresentInArray(w[i], a) ) {
            const aIndexes = getIndexesOfCharInWord(w[i], a);
            if ( countCharInArray(a, w[i]) >= countCharInArray(w, w[i]) ) { // If the answer has at least as many of the char as the guess, then we can safely highlight all of them
                return chalk.yellow(w[i]);
            } else {
                let countOfCharInGuess = 0;
                for( let j=0;j<5;j++ ) {
                    if ( w[j] === w[i] && w[j] === a[j] ) {
                        countOfCharInGuess++;
                    }
                }
                let countOfCharToSetYellow = aIndexes.length - countOfCharInGuess;
                if ( countOfCharToSetYellow > 0 ) {
                    for( let j=0;j<5;j++ ) {
                        if ( w[j] === w[i] && w[j] !== a[j] ) {
                            countOfCharToSetYellow--;
                            if ( countOfCharToSetYellow >= 0 && j == i) {
                                return chalk.yellow(w[i]);
                            }
                        }
                    }
                }
                return chalk.white(w[i]);
            }
        } else {
            return chalk.white(w[i]);
        }
    } else {
        if ( i >= a.length ) {
            return chalk.white(w[i]);
        } else if ( w[i] == a[i] ) {
            return chalk.black.bgGreen(w[i]);
        } else if ( isPresentInArray(w[i], a) ) {
            return chalk.yellow(w[i]);
        } else {
            return chalk.white(w[i]);
        }
    }
}
/// MARK: - Emoji rendering
function renderEmoji(w, i, a) {
    if (getIndexesOfCharInWord(w[i], w).length > 1) { // If the guess has multiple of the same char
        if (i >= a.length) {
            return '⬜️';
        } else if (w[i] == a[i]) {
            return '🟩';
        } else if (isPresentInArray(w[i], a)) {
            const aIndexes = getIndexesOfCharInWord(w[i], a);
            if (countCharInArray(a, w[i]) >= countCharInArray(w, w[i])) { // If the answer has at least as many of the char as the guess
                return '🟨';
            } else {
                let countOfCharInGuess = 0;
                for (let j = 0; j < 5; j++) {
                    if (w[j] === w[i] && w[j] === a[j]) {
                        countOfCharInGuess++;
                    }
                }
                let countOfCharToSetYellow = aIndexes.length - countOfCharInGuess;
                if (countOfCharToSetYellow > 0) {
                    for (let j = 0; j < 5; j++) {
                        if (w[j] === w[i] && w[j] !== a[j]) {
                            countOfCharToSetYellow--;
                            if (countOfCharToSetYellow >= 0 && j == i) {
                                return '🟨';
                            }
                        }
                    }
                }
                return '⬜️';
            }
        } else {
            return '⬜️';
        }
    } else {
        if (i >= a.length) {
            return '⬜️';
        } else if (w[i] == a[i]) {
            return '🟩';
        } else if (isPresentInArray(w[i], a)) {
            return '🟨';
        } else {
            return '⬜️';
        }
    }
}
/// MARK: - isPresentIn
function isPresentInArray( e, l ) {
    for( let i=0;i<l.length;i++ ) {
        if ( e === l[i] ) { return true; }
    }
    return false;
}
function isPresentInWordList( w ) {
    return (typeof guessWords !== 'undefined' && isPresentInArray(w, guessWords)) || (typeof dailyWords !== 'undefined' && isPresentInArray(w, dailyWords));
}
/// MARK: - Hard Mode Validation
function isHardModeValid( guess, previousGuesses, answerWord ) {
    // Check all green letters (correct position) are used
    for ( let i = 0; i < previousGuesses.length; i++ ) {
        for ( let j = 0; j < 5; j++ ) {
            if ( previousGuesses[i][j] === answerWord[j] && previousGuesses[i][j] !== guess[j] ) {
                return false; // Green letter not used in correct position
            }
        }
    }
    
    // Check all yellow letters (wrong position) are used
    for ( let i = 0; i < previousGuesses.length; i++ ) {
        for ( let j = 0; j < 5; j++ ) {
            const char = previousGuesses[i][j];
            // If this character was in the word but wrong position
            if ( char !== answerWord[j] && isPresentInArray(char, answerWord) ) {
                // Check if it's used in this guess
                if ( !isPresentInArray(char, guess) ) {
                    return false; // Yellow letter not used
                }
            }
        }
    }
    
    return true;
}
/// MARK: - lookupDaily
function lookupDailyIndex(d = new Date()) {
    const epoch = new Date("".concat("2021-06-19", "T00:00:00"));
    return getDaysSince(epoch) - getDaysSince(d);
}
function formatDateAsYMD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
async function lookupDailyWord(d = new Date()) {
    const url = `https://www.nytimes.com/svc/wordle/v2/${formatDateAsYMD(d)}.json`;
    const https = require('https');
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json.solution);
                } catch (e) {
                    reject(e);
                }
            });
            res.on('error', (e) => {
                reject(e);
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}
function getDaysSince( d ) {
    const now = new Date();
    let d2 = new Date(d);
    const diff = now.getTime() - d2.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
/// MARK: - countChar/indexesOfChar
function countCharInArray(arr, char) {
    let count = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === char) count++;
    }
    return count;
}
function getIndexesOfCharInWord( c, w ) {
    let ixs = [];
    for( let i=0;i<w.length;i++ ) {
        if ( w[i] === c ) { ixs.push(i); }
    }
    return ixs;
}
main();
