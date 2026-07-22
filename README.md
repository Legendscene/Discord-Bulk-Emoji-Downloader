# Discord Bulk Emoji Downloader

A CLI tool to download Discord custom emojis in bulk — from emoji codes, direct CDN URLs, or a mix of both. Features a clean single-window UI with progress tracking.

## Usage

```bash
npm install
npm start
```

## Menu Options

### [1] Download from emoji.txt (bulk)
Paste Discord emoji markdown codes into `input/emoji.txt` and run option 1.

**Input format** — paste directly into `input/emoji.txt`:
```
<:javascript:1377760115779702814><a:loading:1527364927461920838>
```

| Format | Type | Saved as |
|--------|------|----------|
| `<:name:id>` | Static | `name.png` |
| `<a:name:id>` | Animated | `name.gif` |

### [2] Download from URLs / emoji codes (bulk)
Paste multiple lines at once (URLs, emoji codes, or both). Enter a blank line to start.

```
<:pepeHappy:123456789>
<a:pepeDance:987654321>
https://cdn.discordapp.com/emojis/345678.gif
https://cdn.discordapp.com/emojis/567890.webp?animated=true

```

| Input | Saved as |
|-------|----------|
| `<:wave:123>` | `wave.png` |
| `<a:party:456>` | `party.gif` |
| CDN URL with `.png` / `.gif` / `.webp` | `id.png` / `id.gif` / `id.webp` |
| `.webp?animated=true` | `id.gif` (auto-converted) |

### [3] Exit

## Output

```
output/2026-07-22/
├── pepeHappy.png
├── pepeDance.gif
└── 345678.gif

logs/2026-07-22/
└── download.log
```

## Features

- **Single-window UI** — persistent header/footer with status, only content updates
- **Bulk input** — paste 1 or 100+ URLs/codes at once
- **Auto-naming** — saves with real emoji name when available
- **WebP support** — detects `animated=true` flag, auto-converts to `.gif`
- **Concurrent downloads** — 20 parallel downloads
- **Progress bar** — real-time speed, ETA, download/skip/fail counts
- **3 retries** with backoff on failure
- **Duplicate handling** — auto-renames `name_1.gif`, `name_2.gif`
- **Skips existing** — won't re-download already-saved files
- **Logging** — full session log with timestamps

## Project Structure

```
├── src/
│   ├── index.js       # Entry point, main loop, screen logic
│   ├── ui.js          # Window renderer, helpers, multi-line input
│   ├── theme.js       # Colors and styling
│   ├── utils.js       # URL parsing, file naming, date folders
│   ├── downloader.js  # Download with retry, progress bar, logging
│   ├── parser.js      # Emoji markdown code parser
│   └── zip.js         # Archiver wrapper
├── input/
│   └── emoji.txt      # Emoji codes for option 1
├── output/             # Downloaded emojis (date-sorted)
├── logs/               # Download logs (date-sorted)
└── package.json
```

## Notes

- Only works with **custom Discord emojis** (not default emojis)
- You need access to the emoji (same server, or emoji from shared servers)
- No authentication needed — downloads from public CDN
