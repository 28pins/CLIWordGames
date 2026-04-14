#!/usr/bin/env node
/// MARK: - Imports
const chalk = require('chalk');
const e = require('express');

/// MARK: - HTTPS
const https = require('https');

/// MARK: - Date Formatting
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/// MARK: - Puzzle Fetching
async function getConnectionsPuzzle() {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://www.nytimes.com/svc/connections/v2/${formatDate(date)}.json`;

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
                        const puzzle = response.puzzle || response;

                        resolve(puzzle);
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
let pos = [0, 0];
let completed =  [0, 0, 0, 0];
let selectedArr = [];

/// MARK: - Puzzle Rendering
function renderPuzzle(puzzle, pos, completed) {
    let maxLength = 0;
    for (const group of puzzle.categories) {
        for (const card of group.cards) {
            if (card.content.length > maxLength) {
                maxLength = card.content.length;
            }
        }
    }
    
    const cellWidth = maxLength + 2;
    //completed
    let output = [[], [], [], [], [], [], [], []];
    let rendered = [false, false, false, false];
    for (let i=0;i<16;i++) {
        for (const group of puzzle.categories) {
            const card = group.cards.find(c => c.position === i);
            if (card) {
                const content = card ? card.content : '';
                if (completed[puzzle.categories.indexOf(group)] !== 0) {
                    if (!rendered[puzzle.categories.indexOf(group)]) {
                        output[puzzle.categories.indexOf(group)*2].push(renderCell(puzzle.categories[puzzle.categories.indexOf(group)].title, puzzle.categories.indexOf(group), false, false, cellWidth*4, true));
                        rendered[puzzle.categories.indexOf(group)] = true;
                    }
                    output[puzzle.categories.indexOf(group)*2+1].push(renderCell(content, puzzle.categories.indexOf(group), false, false, cellWidth));
                } else {
                    continue;
                }
            }
        }
    }
    for (const line of output) {
        if (line.length === 0) {
            continue;
        }
        console.log(line.join(''));
    }

    //main
    output = [[], [], [], []];
    for (let i=0;i<16;i++) {
        for (const group of puzzle.categories) {
            const card = group.cards.find(c => c.position === i);
            if (card) {
                let content = card ? card.content : '';
                if (completed[puzzle.categories.indexOf(group)] !== 0) {
                    content = '';
                }
                const isCurrent = pos[0] === Math.floor(card.position / 4) && pos[1] === card.position % 4;
                const selected = selectedArr.includes(card.position);
                if (content !== '') {
                    output[Math.floor(i / 4)][i % 4] = renderCell(content, -1, isCurrent, selected, cellWidth);
                } else {
                    output[Math.floor(i / 4)][i % 4] = '';
                }
            }
        }
    }
    finalO = '';
    for (const line of output) {
        console.log(line.join(''));
    }
    //footer
    console.log(renderCell('Enter', -1, false, pos[0] === 4 && pos[1] === 0 ? true : 3, cellWidth)+
    renderCell('Clear', -1, false, pos[0] === 4 && pos[1] === 1 ? true : 3, cellWidth)+
    renderCell('Help', -1, false, pos[0] === 4 && pos[1] === 2 ? true : 3, cellWidth)+
    renderCell('Exit', -1, false, pos[0] === 4 && pos[1] === 3 ? true : 3, cellWidth));
}

/// MARK: - Cell Rendering
function renderCell(content, completedIndex, isCurrent, selected, width, bold = false) {
    let out = content
    let w = width - content.length;
    while (w > 0) {
        if (w%2 === 0) {
            out = ' ' + out;
        } else {
            out = out + ' ';
        }
        w--;
    }
    if (bold) {
        out = chalk.bold(out);
    }
    if (isCurrent) {
        return selected ? chalk.bgHex('#aa7777').white(out) : chalk.bgRedBright.white(out);
    } else if (completedIndex !== -1) {
        if (completedIndex === 0) {
            return chalk.bgYellow.black(out);
        } else if (completedIndex === 1) {
            return chalk.bgGreen.white(out);
        } else if (completedIndex === 2) {
            return chalk.bgBlue.white(out);
        } else if (completedIndex === 3) {
            return chalk.bgMagenta.white(out);
        }
    } else if (selected === true) {
        return chalk.bgHex('#ff7575').white(out);
    } else if (selected === 3) {
        return chalk.white.bold(out);
    } else {
        return chalk.bgGray.black(out);
    }
}

/// MARK: - Utility: Count Completed
function countCompletedLines() {
    let count = 0;
    for (const c of completed) {
        if (c !== 0) {
            count++;
        }
    }
    return count;
}

/// MARK: - Utility: Get Category Index
function getCategoryIndexByCardPosition(puzzle, position) {
    for (let i=0;i<puzzle.categories.length;i++) {
        const group = puzzle.categories[i];
        if (group.cards.some(c => c.position === position)) {
            return i;
        }
    }
    return -1;
}
let failureCount = 0;
let date = new Date();
/// MARK: - Main Game Loop
async function main() {
    const args = process.argv.slice(2);
    if ( args.length > 0 ) {
        for ( let i = 0; i < args.length; i++ ) {
            const arg = args[i].toLowerCase();
            if ( arg === 'help' || arg === '--help' || arg === '-h' ) {
                console.log(chalk.blue('Use arrow keys or IJKL to navigate the grid'));
                console.log(chalk.blue('Press Space, K, or Enter to select/deselect cards and confirm category completion'));
                console.log(chalk.blue('Press X or navigate to the button to clear selected cards'));
                console.log(chalk.blue('Press Q or Ctrl+C or navigate to the button to exit the game'));
                console.log(chalk.blue('Press H or navigate to the button to see this message again'));
                console.log(chalk.blue('Selected cards must all be in the same category to complete it'));
                console.log(chalk.blue('You can only select up to 4 cards at a time'));
                console.log(chalk.blue('After completing a category, the remaining cards will be condensed to fill the space'));
                console.log(chalk.blue('Once 3 categories are completed, the remaining category will be automatically completed'));
                console.log(chalk.blue('Use the date as an argument in YYYY-MM-DD format to play a specific puzzle'));
                return;
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
    let puzzle;
    try {
        puzzle = await getConnectionsPuzzle();
    } catch (error) {
        console.error(chalk.red(`Error fetching puzzle: ${error.message}`));
        return;
    }
    
    renderPuzzle(puzzle, pos, completed);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', function(key) {
    if (key === '\u0003' || key === 'q' || key === 'Q' || key === '\u001B') { // Ctrl+C or 'q' or 'Q' or Escape
        console.log(chalk.green('Goodbye!'));
        process.exit();
    }
    if (key === '\u001B[A' || key === 'i' || key === 'I') {
        if (pos[0] > 0) {
            pos[0]--;
            console.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (key === '\u001B[B' || key === 'm' || key === 'M') {
        if (pos[0] < 3 - countCompletedLines()) {
            pos[0]++;
            console.clear();
            renderPuzzle(puzzle, pos, completed);
        } else if (pos[0] === 3 - countCompletedLines()) {
            pos[0]=4;
            console.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (key === '\u001B[C' || key === 'l' || key === 'L') {
        if (pos[1] < 3) {
            pos[1]++;
            console.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (key === '\u001B[D' || key === 'j' || key === 'J') {
        if (pos[1] > 0) {
            pos[1]--;
            console.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (key === '\r' || key === '\n') {
        confirmCategoryCompletion(puzzle);
    } else if (key === ' ' || key === 'k' || key === 'K') {
        if (pos[0] === 4) {
            if (pos[1] === 0) {
                // Enter
                confirmCategoryCompletion(puzzle);
            } else if (pos[1] === 1) {
                // Clear
                selectedArr = [];
                renderPuzzle(puzzle, pos, completed);
            } else if (pos[1] === 2) {
                // Help
                console.log(chalk.blue('Use arrow keys or IJKL to navigate the grid'));
                console.log(chalk.blue('Press Space, K, or Enter to select/deselect cards and confirm category completion'));
                console.log(chalk.blue('Press X or navigate to the button to clear selected cards'));
                console.log(chalk.blue('Press Q or Ctrl+C or navigate to the button to exit the game'));
                console.log(chalk.blue('Press H or navigate to the button to see this message again'));
                console.log(chalk.blue('Selected cards must all be in the same category to complete it'));
                console.log(chalk.blue('You can only select up to 4 cards at a time'));
                console.log(chalk.blue('After completing a category, the remaining cards will be condensed to fill the space'));
                console.log(chalk.blue('Once 3 categories are completed, the remaining category will be automatically completed'));
                console.log(chalk.blue('Use the date as an argument in YYYY-MM-DD format to play a specific puzzle'));
            } else if (pos[1] === 3) {
                // Exit
                //verify that user wants to exit
                process.stdout.write('\x07\n');
                console.log(chalk.yellow('Are you sure you want to exit? (y/n)'));
                process.stdin.once('data', function(key) {
                    if (key.toLowerCase() === 'y') {
                        console.log(chalk.green('Goodbye!'));
                        process.exit();
                    } else {
                        console.clear();
                        renderPuzzle(puzzle, pos, completed);
                    }
                });
            }
        } else if (key === 'x' || key === 'X') {
            // Clear
            selectedArr = [];
            renderPuzzle(puzzle, pos, completed);
        } else {
            if (!selectedArr.includes(pos[0]*4 + pos[1])) {
                if (selectedArr.length < 4) {
                    selectedArr.push(pos[0]*4 + pos[1]);
                } else {
                    process.stdout.write('\x07\n');
                    console.log(chalk.red('You can only select up to 4 cards!'));
                }
            } else {
                selectedArr = selectedArr.filter(p => p !== pos[0]*4 + pos[1]);
            }
            console.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    }
    });
}
/// MARK: - Entry Point
console.clear();
main();
let guesses = '';
function confirmCategoryCompletion(puzzle) {
    if ( guesses.split('\n').length >= 4) {
        console.log(chalk.red('Game over!'));
        console.log(chalk.bgGreen.white.bold('Thanks for playing!'));
        //Generate emoji to share
        console.log(`Connections\nPuzzle #${puzzle.id}`);
        console.log(guesses);
        setTimeout(() => {
            process.exit();
        }, 1000);
    }
    let allInSameCategory = 4;
    let currentCategoryIndex = getCategoryIndexByCardPosition(puzzle, selectedArr[0]);
    if (selectedArr.length === 4 && currentCategoryIndex !== -1) {
        for (let i = 0; i < 4; i++) {
            if (!puzzle.categories[currentCategoryIndex].cards.some(c => c.position === selectedArr[i])) {
                allInSameCategory--;
            }
            guesses += returnEmojiForCardPosition(selectedArr[i], puzzle);
        }
        guesses += '\n';
    } else {
        allInSameCategory = 0;
    }
    if (allInSameCategory === 4) {
        completed[currentCategoryIndex] = Math.max(...completed) + 1;
        selectedArr = [];
        console.clear();
        renderPuzzle(puzzle, pos, completed);
        setTimeout(() => {
            if (countCompletedLines() === 4) {
                renderPuzzle(puzzle, pos, completed);
                console.log(chalk.bgGreen.white.bold('Congratulations! You completed the puzzle!'));
                console.log(chalk.bgGreen.white.bold('Thanks for playing!'));
                //Generate emoji to share
                console.log(`Connections\nPuzzle #${puzzle.id}`);
                console.log(guesses);
                setTimeout(() => {
                    process.exit();
                }, 1000);
            } else {
                console.clear();
                console.log(chalk.green(`Category ${countCompletedLines()}/4 completed!`));
                renderPuzzle(puzzle, pos, completed);
            }
        }, 600);
    } else if (allInSameCategory === 3) {
        process.stdout.write('\x07\n');
        console.log(chalk.yellow('One away!'));
    } else {
        process.stdout.write('\x07\n');
        console.log(chalk.red(selectedArr.length === 4 ? 'Selected cards are not in the same category!' : 'Please select 4 cards before pressing Enter!'));
        if (selectedArr.length === 4) {
            failureCount++;
        }
    }
    //Condense remaining cards
    let index = 0;
    for (let i=0;i<16;i++) {
        for (const group of puzzle.categories) {
            const card = group.cards.find(c => c.position === i);
            if (card) {
                const content = card ? card.content : '';
                if (completed[puzzle.categories.indexOf(group)] === 0) {
                    puzzle.categories[puzzle.categories.indexOf(group)].cards.find(c => c.position === i).position = index;
                    index++;
                }
            }
        }
    }
    if (countCompletedLines() === 3) {
        for ( let i=0;i<4;i++) {
            if (completed[i] === 0) {
                completed[i] = 4;
            }
        }
    }
}
function returnEmojiForCardPosition(position, puzzle) {
    for (const group of puzzle.categories) {
        if (group.cards.some(c => c.position === position)) {
            const categoryIndex = puzzle.categories.indexOf(group);
            if (categoryIndex === 0) {
                return '🟨';
            } else if (categoryIndex === 1) {
                return '🟩';
            } else if (categoryIndex === 2) {
                return '🟦';
            } else if (categoryIndex === 3) {
                return '🟪';
            }
        }
    }
    return '';
}
/// TODO: Add failureCount implementation, finish shareble emoji generation, add date argument, and add one away functionality