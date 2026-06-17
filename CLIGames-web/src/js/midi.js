// MIDI Web Game
let date = new Date();

if (window.location.search) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('date')) {
        const parsed = new Date(params.get('date'));
        if (!isNaN(parsed)) date = parsed;
    }
}

async function main() {
    consolePort.clear();
    consolePort.log(chalkPort.blue(`MIDI -- CLI Daily Puzzle\n`));
    
    if (typeof dailyPuzzles === 'undefined' || dailyPuzzles.length === 0) {
        consolePort.log(chalkPort.red('No puzzle data available. Please run populate_dailyWords.js\n'));
        return;
    }
    
    consolePort.log(chalkPort.blue('MIDI game coming soon!\n'));
    consolePort.log('Visit the CLI version for now: node MIDI/MIDI.js\n');
}

main();
