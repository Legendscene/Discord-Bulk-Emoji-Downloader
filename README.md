# Discord Emoji Downloader

Downloads all Discord custom emojis from a text file containing emoji markdown.

## Usage

1. Paste Discord emoji markdown into `input/emoji.txt`
2. Install dependencies:
   ```
   npm install
   ```
3. Run:
   ```
   npm start
   ```
   or
   ```
   node .
   ```

## Input Format

Paste emoji markdown directly into `input/emoji.txt`:

```
<:javascript:1377760115779702814><a:loading:1527364927461920838>
```

Static emoji: `<:name:id>` → `.png`  
Animated emoji: `<a:name:id>` → `.gif`

## Output

- `output/` — individual emoji files
- `emojis.zip` — compressed archive at maximum compression
- `logs/download.log` — download log

## Features

- 20 concurrent downloads
- Progress bar with speed and ETA
- 3 retries on failure
- Skips already-downloaded files
- Auto-renames duplicate names
- Verifies file integrity
- Maximum compression zip archive
