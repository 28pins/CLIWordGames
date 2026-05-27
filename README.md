# CLIWordGames
A collection of CLI-based word games with daily challenges synced live from the original web games.

---

## Wrdli

A terminal Wordle clone. Each day a new five-letter word is fetched live from the NYT Wordle API.

**Run:**
```bash
node Wrdli/Wrdli.js
node Wrdli/Wrdli.js --hard
node Wrdli/Wrdli.js 2024-03-15
```

### How to Play
You have six attempts to guess the secret five-letter word.

After each guess:
- A correct letter in the correct position is highlighted **green**.
- A correct letter in the wrong position is highlighted **yellow**.
- A letter not in the word is shown in **white/grey**.

A color-coded keyboard is displayed after each guess to track used letters. Type your five-letter guess and press Enter.

### Features
- **Live daily word** — fetched from the NYT Wordle API; falls back to a bundled word list offline.
- **Date argument** — pass a date (`YYYY-MM-DD`) to replay any past puzzle.
- **Hard mode** (`--hard`) — every subsequent guess must use all previously revealed correct letters.
- **Shareable emoji output** — prints a Wordle-style emoji grid and puzzle number on completion.
- **In-game commands:**
  - `help` — show command help
  - `guesses` — reprint your previous guesses
  - `exit` / `quit` — end the game
  - Ctrl+C or Escape — exit at any time

---

## Cli-nnections

A fully interactive terminal clone of the NYT Connections game. Each day's puzzle is fetched live from the NYT Connections API.

**Run:**
```bash
node Cli-nnections/cli-nnections.js
node Cli-nnections/cli-nnections.js 2024-03-15
node Cli-nnections/cli-nnections.js --help
```

### How to Play
A 4×4 grid of 16 words is displayed. Your goal is to find the four groups of four words that share a hidden connection. Categories are color-coded by difficulty:
- 🟨 Yellow — easiest
- 🟩 Green — moderate
- 🟦 Blue — harder
- 🟪 Purple — hardest

Use the keyboard to navigate the grid, select four cards, and submit a category. Correct groups are highlighted and removed from the grid. You have four total attempts (one per category).

### Controls
| Key | Action |
|-----|--------|
| Arrow keys / IJKL | Move cursor |
| M | Move cursor down |
| Space / K | Select / deselect a card |
| Enter | Confirm selection (also navigable via footer) |
| X | Clear selected cards |
| H | Show help |
| Q / Ctrl+C / Escape | Exit |

### Features
- **Live daily puzzle** — fetched from the NYT Connections API.
- **Date argument** — pass a date (`YYYY-MM-DD`) to play any historical puzzle.
- **One away hint** — warns you when 3 of 4 selected cards share a category.
- **Auto-complete** — once 3 categories are found, the 4th completes automatically.
- **Shareable emoji output** — prints the emoji guess grid (🟨🟩🟦🟪) and puzzle ID on game over.
- **Footer buttons** — on-screen Enter / Clear / Help / Exit buttons navigable with the keyboard.

---

## Spelling Bee

A terminal Spelling Bee clone. Each day a new puzzle is fetched live from the NYT Spelling Bee API.

**Run:**
```bash
node SpellingBee/SpellingBee.js
node SpellingBee/SpellingBee.js 2024-03-15
```

### How to Play
Find as many words as you can using the provided letters. Every word must include the center letter (highlighted in yellow). Words must be at least 4 letters long and appear in the official word list.

### Features
- **Live daily puzzle** — fetched from the NYT Spelling Bee API
- **Date argument** — pass a date (`YYYY-MM-DD`) to replay any past puzzle
- **Word validation** — words must contain center letter and be in the valid word list
- **Score tracking** — displays total words found

---

## Mini Crossword

A small crossword puzzle from the New York Times. Each day's puzzle is fetched live from the NYT Crosswords API.

**Run:**
```bash
node Mini/Mini.js
node Mini/Mini.js 2024-03-15
```

### How to Play
Fill in the crossword grid by entering answers to clues. Each clue is labeled with a number and direction (Across or Down).

### Features
- **Live daily puzzle** — fetched from the NYT Mini Crosswords API
- **Date argument** — pass a date (`YYYY-MM-DD`) to play any historical puzzle
- **Answer validation** — checks if your answer matches the solution
- **Progress tracking** — shows how many clues you've completed

---

## MIDI Crossword

A mid-sized crossword puzzle from the New York Times. Similar to the Mini but with a larger grid.

**Run:**
```bash
node Midi/Midi.js
node Midi/Midi.js 2024-03-15
```

### How to Play
Fill in the crossword grid by entering answers to clues. Enter the clue number and your answer at the prompt.

### Features
- **Live daily puzzle** — fetched from the NYT MIDI Crosswords API
- **Date argument** — pass a date (`YYYY-MM-DD`) to play any historical puzzle
- **Answer validation** — verifies correct answers
- **Progress tracking** — shows completion status

---

## Pips

A pattern-matching puzzle from the New York Times. Each day a new puzzle is fetched live from the NYT Pips API.

**Run:**
```bash
node Pips/Pips.js
node Pips/Pips.js 2024-03-15
```

### How to Play
Match visual patterns to images. The game presents patterns and images that must be correctly paired.

### Features
- **Live daily puzzle** — fetched from the NYT Pips API
- **Date argument** — pass a date (`YYYY-MM-DD`) to replay any past puzzle
- **Pattern matching** — visual pattern recognition puzzle

---

## Web Version
A web-based version of all games is available at [28pins.github.io](https://28pins.github.io), built with the same data and logic as the CLI versions. The web version uses code in the 'CLIGames-web' directory.

---

## Scripts (data utilities)

> **Note:** These scripts are developer utilities for pre-populating offline puzzle data for the `CLIGames-web` project. They are **not required** to play any game — all games fetch data automatically.

Requires **Node 18+** (uses global `fetch`).

### `scripts/populate_dailyWords.js`
Fetches puzzle data from the NYT APIs for all games (Wordle, Connections, Spelling Bee, Mini, MIDI, and Pips) and writes them to data files used by both CLI and web versions. This is useful for pre-populating data for offline use or building archives.

```bash
node scripts/populate_dailyWords.js 2026-04-14
```

This will fetch data from each game's API from its launch date up to the specified end date.

### `scripts/initCommands.sh`
Runs `chmod +x` on all game scripts to make them directly executable from the terminal without `node` prefix. Only needs to be run once after cloning the repo.

```
chmod +x scripts/initCommands.sh
./scripts/initCommands.sh
```

---

## License
This project is distributed under a custom license based on the MIT License, with additional restrictions. See [LICENSE](LICENSE) for the full terms.


## Disclaimer
This project fetches live puzzle data from third-party APIs (including the NYT public endpoints). These sources may change or disappear at any time. As a result, daily puzzle syncing, historical archives, or future puzzles may break or stop working without warning. This project is independent, open-source, and does not guarantee uninterrupted access to any external puzzle services.