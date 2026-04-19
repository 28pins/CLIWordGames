/// MARK: - Date Formatting
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
let date = new Date();
let puzzle;
let guesses = '';
/// MARK: - Puzzle Fetching
function getConnectionsPuzzle() {
    return dailyPuzzles[lookupDailyIndex(formatDate(date))];
}
function lookupDailyIndex(da) {
    const start = new Date('2023-06-18');
    const current = new Date(da);
    const diffTime = Math.abs(current - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays % dailyPuzzles.length;
}

/// MARK: - State Variables
let pos = [0, 0];
let completed = [0, 0, 0, 0];
let selectedArr = [];
let isImagePuzzle = false;

/// MARK: - Puzzle Rendering
let cellWidth = 0;
function renderPuzzle(puzzle, pos, completed) {
    const posMap = new Array(16).fill(null);
    for (let gi = 0; gi < puzzle.categories.length; gi++) {
        const group = puzzle.categories[gi];
        for (const card of group.cards) {
            posMap[card.position] = { card, groupIndex: gi, group };
        }
    }

    let maxLength = 0;
    for (let i = 0; i < posMap.length; i++) {
        const entry = posMap[i];
        if (!entry) continue;
        const c = entry.card;
        const content = c.content || '';
        if (content.length > maxLength) maxLength = content.length;
        if (c.image_alt_text && c.image_alt_text.length > maxLength) maxLength = c.image_alt_text.length;
    }

    cellWidth = maxLength + 2;

    // Completed view (compact) — render per-category: one wide title line, then items line
    for (let gi = 0; gi < puzzle.categories.length; gi++) {
        if (completed[gi] === 0) continue;
        const group = puzzle.categories[gi];
        // Title: span the full width (4 cells)
        const titleLine = renderCell(group.title, gi, false, false, cellWidth * 4, true);
        // Items: collect cards for this group in position order
        const cards = group.cards.slice().sort((a, b) => a.position - b.position);
        const itemsLineParts = [];
        for (const card of cards) {
            const content = card.content || card.image_alt_text || '';
            itemsLineParts.push(renderCell(content, gi, false, false, cellWidth));
        }
        consolePort.log(titleLine + '\n');
        consolePort.log(itemsLineParts.join('') + '\n');
    }

    // Main grid
    const mainOutput = Array.from({ length: 4 }, () => new Array(4).fill(''));
    for (let i = 0; i < posMap.length; i++) {
        const entry = posMap[i];
        if (!entry) continue;
        const { card, groupIndex } = entry;
        let content = card.content || card.image_alt_text || '';
        if (!content && card.image_url) {
            if (isImagePuzzle) {
                content = card.image_alt_text || '[Image]';
            } else {
                isImagePuzzle = true;
                consolePort.log(chalkPort.red('Warning: This puzzle contains an image. Please view the puzzle on the website or press any arrow key to continue rendering the puzzle with alt text.'));
                return;
            }
        }
        if (completed[groupIndex] !== 0) content = '';
        const isCurrent = pos[0] === Math.floor(card.position / 4) && pos[1] === card.position % 4;
        const selected = selectedArr.includes(card.position);
        if (content !== '') {
            mainOutput[Math.floor(i / 4)][i % 4] = renderCell(content, -1, isCurrent, selected, cellWidth);
        } else {
            mainOutput[Math.floor(i / 4)][i % 4] = '';
        }
    }
    for (const line of mainOutput) {
        consolePort.log(line.join('') + '\n');
    }

    // Footer
    consolePort.log(renderCell('Enter', -1, false, pos[0] === 4 && pos[1] === 0 ? true : 3, cellWidth) +
        renderCell('Clear', -1, false, pos[0] === 4 && pos[1] === 1 ? true : 3, cellWidth) +
        renderCell('Help', -1, false, pos[0] === 4 && pos[1] === 2 ? true : 3, cellWidth) +
        renderCell('Exit', -1, false, pos[0] === 4 && pos[1] === 3 ? true : 3, cellWidth));
}

/// MARK: - Cell Rendering
function renderCell(content, completedIndex, isCurrent, selected, width, bold = false) {
    let out = content
    let w = width - content.length;
    while (w > 0) {
        if (w % 2 === 0) {
            out = ' ' + out;
        } else {
            out = out + ' ';
        }
        w--;
    }
    if (bold) {
        out = chalkPort.bold(out);
    }
    if (isCurrent) {
        return selected ? chalkPort.bgHex('#aa7777')(out) : chalkPort.bgRedBright(out);
    } else if (completedIndex !== -1) {
        if (completedIndex === 0) {
            return chalkPort.bgYellow(out);
        } else if (completedIndex === 1) {
            return chalkPort.bgGreen(out);
        } else if (completedIndex === 2) {
            return chalkPort.bgBlue(out);
        } else if (completedIndex === 3) {
            return chalkPort.bgMagenta(out);
        }
    } else if (selected === true) {
        return chalkPort.bgHex('#ff7575')(out);
    } else if (selected === 3) {
        return chalkPort.bold(out);
    } else {
        return chalkPort.bgGray(out);
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
    for (let i = 0; i < puzzle.categories.length; i++) {
        const group = puzzle.categories[i];
        if (group.cards.some(c => c.position === position)) {
            return i;
        }
    }
    return -1;
}
function showInstructions() {
    const lines = [
        'Use arrow keys or IJKL to navigate the grid',
        'Press Space, K, or Enter to select/deselect cards and confirm category completion',
        'Press X or navigate to the button to clear selected cards',
        'Press Q or Ctrl+C or navigate to the button to exit the game',
        'Press H or navigate to the button to see this message again',
        'Selected cards must all be in the same category to complete it',
        'You can only select up to 4 cards at a time',
        'After completing a category, the remaining cards will be condensed to fill the space',
        'Once 3 categories are completed, the remaining category will be automatically completed',
        'Use the date as an argument in YYYY-MM-DD format to play a specific puzzle'
    ];
    for (const l of lines) consolePort.log(chalkPort.blue(l) + '\n');
}
let failureCount = 0;
window.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        if (pos[0] === 4) {
            if (pos[1] === 0) {
                confirmCategoryCompletion(puzzle);
            } else if (pos[1] === 1) {
                selectedArr = [];
                renderPuzzle(puzzle, pos, completed);
            } else if (pos[1] === 2) {
                showInstructions();
            } else if (pos[1] === 3) {
                consolePort.log(chalkPort.green('Goodbye!'));
                process.exit();
            }
        } else {
            confirmCategoryCompletion(puzzle);
        }
    } else if (event.key === 'x' || event.key === 'X') {
        selectedArr = [];
        renderPuzzle(puzzle, pos, completed);
    } else if (event.key === 'h' || event.key === 'H') {
        showInstructions();
    } else if (event.key === 'q' || event.key === 'Q') {
        consolePort.log(chalkPort.green('Goodbye!'));
        process.exit();
    } else if (['ArrowUp', 'i', 'I'].includes(event.key)) {
        if (pos[0] > 0) {
            pos[0]--;
            consolePort.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (event.key === 'd' || event.key === 'D') {
        if (guesses.length === 0) {
            const input = prompt('Enter a date (YYYY-MM-DD): ');
            const parsed = new Date(input);
            if (!isNaN(parsed)) {
                date = parsed;
                puzzle = getConnectionsPuzzle();
                pos = [0, 0];
                completed = [0, 0, 0, 0];
                selectedArr = [];
                consolePort.clear();
                consolePort.log(chalkPort.blue(`Puzzle for ${formatDate(date)}:`));
                consolePort.log(chalkPort.blue('If the date is not what you entered, it may be due to timezone differences. Try entering the previous or next day.'));
                renderPuzzle(puzzle, pos, completed);
            } else {
                consolePort.log(chalkPort.red('Invalid date format. Use YYYY-MM-DD.'));
            }
        }
    } else if (['ArrowDown', 'm', 'M'].includes(event.key)) {
        if (pos[0] < 3 - countCompletedLines()) {
            pos[0]++;
            consolePort.clear();
            renderPuzzle(puzzle, pos, completed);
        } else if (pos[0] === 3 - countCompletedLines()) {
            pos[0] = 4;
            consolePort.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (['ArrowRight', 'l', 'L'].includes(event.key)) {
        if (pos[1] < 3) {
            pos[1]++;
            consolePort.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (['ArrowLeft', 'j', 'J'].includes(event.key)) {
        if (pos[1] > 0) {
            pos[1]--;
            consolePort.clear();
            renderPuzzle(puzzle, pos, completed);
        }
    } else if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
        if (!selectedArr.includes(pos[0] * 4 + pos[1])) {
            if (selectedArr.length < 4) {
                selectedArr.push(pos[0] * 4 + pos[1]);
            } else {
                consolePort.log(chalkPort.red('You can only select up to 4 cards!'));
            }
        } else {
            selectedArr = selectedArr.filter(p => p !== pos[0] * 4 + pos[1]);
        }
        consolePort.clear();
        renderPuzzle(puzzle, pos, completed);
    }

});
window.addEventListener('resize', function (e) {
    // If console is resized past the width or height needed to display the puzzle, show an error message
    if (window.innerWidth < cellWidth * 4 + 10 || window.innerHeight < 10) {
        consolePort.clear();
        consolePort.log(chalkPort.red('Please resize the console to be larger to display the puzzle!'));
    } else {
        consolePort.clear();
        renderPuzzle(puzzle, pos, completed);
    }
});
/// MARK: - Main Game Loop
async function main() {
    try {
        puzzle = getConnectionsPuzzle();
    } catch (error) {
        consolePort.error(chalkPort.red(`Error fetching puzzle: ${error.message}`));
        return;
    }
    renderPuzzle(puzzle, pos, completed);
}
/// MARK: - Entry Point
consolePort.clear();
setInterval(() => {
    if (failureCount > 3) {
        consolePort.clear();
        consolePort.log(chalkPort.red('Goodbye!'));
    }
}, 200);
main();
function confirmCategoryCompletion(puzzle) {
    if (guesses.split('\n').length >= 4) {
        consolePort.log(chalkPort.red('Game over!'));
        consolePort.log(chalkPort.bgGreen(chalkPort.bold('Thanks for playing!')));
        //Generate emoji to share
        consolePort.log(`Connections\nPuzzle #${puzzle.id}`);
        consolePort.log(guesses);
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
        consolePort.clear();
        renderPuzzle(puzzle, pos, completed);
        setTimeout(() => {
            if (countCompletedLines() === 4) {
                renderPuzzle(puzzle, pos, completed);
                consolePort.log(chalkPort.bgGreen(chalkPort.bold('Congratulations! You completed the puzzle!')));
                consolePort.log(chalkPort.bgGreen(chalkPort.bold('Thanks for playing!')));
                //Generate emoji to share
                consolePort.log(`Connections\nPuzzle #${puzzle.id}`);
                consolePort.log(guesses);
                setTimeout(() => {
                    process.exit();
                }, 1000);
            } else {
                consolePort.clear();
                consolePort.log(chalkPort.green(`Category ${countCompletedLines()}/4 completed!\n`));
                renderPuzzle(puzzle, pos, completed);
            }
        }, 600);
    } else if (allInSameCategory === 3) {
        process.stdout.write('\x07\n');
        consolePort.log(chalkPort.yellow('One away!'));
    } else {
        process.stdout.write('\x07\n');
        consolePort.log(chalkPort.red(selectedArr.length === 4 ? 'Selected cards are not in the same category!' : 'Please select 4 cards before pressing Enter!'));
        if (selectedArr.length === 4) {
            failureCount++;
        }
    }
    //Condense remaining cards
    let index = 0;
    for (let i = 0; i < 16; i++) {
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
        for (let i = 0; i < 4; i++) {
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