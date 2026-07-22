const fs = require('fs');

function parseEmojiMarkdown(text) {
  const regex = /<a?:(\w+):(\d+)>/g;
  const emojis = [];
  const seen = new Set();
  let match;

  while ((match = regex.exec(text)) !== null) {
    const id = match[2];
    if (!seen.has(id)) {
      seen.add(id);
      const raw = match[0];
      emojis.push({
        animated: raw.startsWith('<a'),
        name: match[1],
        id
      });
    }
  }

  return emojis;
}

function readInputFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

module.exports = { parseEmojiMarkdown, readInputFile };
