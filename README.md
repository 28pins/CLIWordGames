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

## Mini

A streamlined terminal Wordle variant with 4 guesses instead of 6. Each day a new five-letter word is fetched live from the NYT Wordle API.

**Run:**
```bash
node Mini/Mini.js
node Mini/Mini.js --hard
node Mini/Mini.js 2024-03-15
```

### How to Play
You have four attempts to guess the secret five-letter word.

After each guess:
- A correct letter in the correct position is highlighted **green**.
- A correct letter in the wrong position is highlighted **yellow**.
- A letter not in the word is shown in **white/grey**.

### Features
- **Live daily word** — fetched from the NYT Wordle API; falls back to a bundled word list offline.
- **Date argument** — pass a date (`YYYY-MM-DD`) to replay any past puzzle.
- **Hard mode** (`--hard`) — every subsequent guess must use all previously revealed correct letters.
- **In-game commands:**
  - `help` — show command help
  - `guesses` — reprint your previous guesses
  - `exit` / `quit` — end the game
  - Ctrl+C or Escape — exit at any time

---

## Spelling Bee

Find words using a set of 7 letters arranged in a hexagon. Each word must be at least 4 letters long and include the center letter. Each day a new puzzle is provided.

**Run:**
```bash
node SpellingBee/SpellingBee.js
node SpellingBee/SpellingBee.js 2024-03-15
```

### How to Play
The 7 letters are displayed in a hexagon pattern with one center letter. Find as many words as possible:
- Each word must be at least 4 letters long
- The center letter (highlighted in yellow) must be in every word
- You can only use the 7 available letters
- Finding all possible words earns a "pangram" bonus

### Features
- **Puzzle of the day** — a new Spelling Bee puzzle daily.
- **Date argument** — pass a date (`YYYY-MM-DD`) to play any historical puzzle.
- **Shuffle feature** — rearrange letters for easier viewing.
- **Score tracking** — earn points based on word length and rarity.

---

## MIDI

A grid-based daily puzzle game where you reveal letters to complete the grid.

**Run:**
```bash
node MIDI/MIDI.js
node MIDI/MIDI.js 2024-03-15
```

### How to Play
A grid of hidden letters is displayed. Use coordinates to reveal letters and complete the puzzle:
- Enter coordinates in the format `row,col` (e.g., `0,0`)
- Reveal all letters to solve the puzzle
- Words may be hidden horizontally, vertically, or diagonally

### Features
- **Puzzle of the day** — a new MIDI puzzle daily.
- **Date argument** — pass a date (`YYYY-MM-DD`) to play any historical puzzle.
- **Solution reveal** — type "solve" to see the complete solution.

---

## Pips

Find words using the letters arranged on the border of a square. Each word must be formed from adjacent letters.

**Run:**
```bash
node Pips/Pips.js
node Pips/Pips.js 2024-03-15
```

### How to Play
Letters are arranged on the border of a square. Find words by:
- Using letters from the border (each letter appears only once per word)
- Forming chains of adjacent letters
- Finding words of 4+ letters

### Features
- **Puzzle of the day** — a new Pips puzzle daily.
- **Date argument** — pass a date (`YYYY-MM-DD`) to play any historical puzzle.
- **Score tracking** — earn points based on word length.

---
## Web Version
A web-based version of all games is available at [28pins.github.io](https://28pins.github.io), built with the same data and logic as the CLI versions. The web version uses code in the 'CLIGames-web' directory.
---

## Scripts (data utilities)

> **Note:** These scripts are developer utilities for pre-populating offline word/puzzle data for the `OpenWord-web` project. They are **not required** to play either game — both games fetch data automatically.

Requires **Node 18+** (uses global `fetch`).

### `scripts/populate_dailyWords.js`
Fetches daily puzzle data from the NYT APIs and generates data files for all games:
- **Wordle** — fetches from the NYT Wordle API (starting from 2021-06-19)
- **Connections** — fetches from the NYT Connections API (starting from 2023-06-19)
- **Mini** — fetches from the NYT Wordle API (starting from 2024-05-27)
- **Spelling Bee** — generates placeholder data (starting from 2018-05-28)
- **MIDI** — generates placeholder data (starting from 2024-01-01)
- **Pips** — generates placeholder data (starting from 2023-01-01)

```bash
node scripts/populate_dailyWords.js 2026-04-14
```

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