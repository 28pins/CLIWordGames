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
## Web Version
A web-based version of both games is available at [28pins.github.io](https://28pins.github.io), built with the same data and logic as the CLI versions. The web version uses code in the 'CLIGames-web' folder.
---

## Scripts (data utilities)

> **Note:** These scripts are developer utilities for pre-populating offline word/puzzle data for the `OpenWord-web` project. They are **not required** to play either game — both games fetch data live. Run them sparingly, as they make repeated API requests.

Requires **Node 18+** (uses global `fetch`).

### `scripts/populate_dailyWords.js`
Fetches every daily Wordle solution from the NYT Wordle API starting from Wordle's launch date (2021-06-19) up to a given end date, and writes the full list to `OpenWord-web/generated_dailyWords.js`.  Also updates connections with the same end date to ensure both games have the same range of puzzles.

```bash
node scripts/populate_dailyWords.js 2026-04-14
```

### `scripts/initCommands.sh`
Runs `chmod +x` on all game scripts to make them directly executable from the terminal without `node` prefix. Only needs to be run once after cloning the repo.

```bash

chmod +x scripts/initCommands.sh
./scripts/initCommands.sh
```

---

## License
This project is distributed under a custom license based on the MIT License, with additional restrictions. See [LICENSE](LICENSE) for the full terms.


