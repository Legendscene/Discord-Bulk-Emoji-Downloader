const fs = require('fs');
const path = require('path');

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_');
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getExtension(animated) {
  return animated ? '.gif' : '.png';
}

function buildUrl(id, animated) {
  const ext = getExtension(animated);
  return `https://cdn.discordapp.com/emojis/${id}${ext}?quality=lossless&size=4096`;
}

function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function handleDuplicateNames(emojis) {
  const nameCount = {};
  emojis.forEach(e => {
    nameCount[e.name] = (nameCount[e.name] || 0) + 1;
  });

  const counter = {};
  return emojis.map(e => {
    if (!counter[e.name]) counter[e.name] = 0;
    counter[e.name]++;
    const ext = e.filenameExt || getExtension(e.animated);
    const baseName = sanitizeFilename(e.name);
    if (nameCount[e.name] > 1) {
      return { ...e, filename: `${baseName}_${counter[e.name]}${ext}` };
    }
    return { ...e, filename: `${baseName}${ext}` };
  });
}

function getDateFolder(baseDir) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const folderName = `${y}-${m}-${d}`;
  const folderPath = path.join(baseDir, folderName);
  ensureDir(folderPath);
  return folderPath;
}

function parseEmojiUrl(url) {
  const trimmed = url.trim();
  const regex = /cdn\.discordapp\.com\/emojis\/(\d+)\.(png|gif|webp)/i;
  const match = trimmed.match(regex);
  if (!match) return null;
  const ext = match[2].toLowerCase();
  const hasAnimatedFlag = /[?&]animated=true/i.test(trimmed);
  const animated = ext === 'gif' || hasAnimatedFlag;
  const extension = animated && ext === 'webp' ? 'gif' : ext;
  return {
    id: match[1],
    animated,
    extension,
    originalUrl: trimmed
  };
}

function parseMixedLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const codeRegex = /^<a?:(\w+):(\d+)>$/;
  const codeMatch = trimmed.match(codeRegex);
  if (codeMatch) {
    return {
      name: codeMatch[1],
      id: codeMatch[2],
      animated: trimmed.startsWith('<a'),
    };
  }

  const urlData = parseEmojiUrl(trimmed);
  if (urlData) {
    return {
      id: urlData.id,
      animated: urlData.animated,
      filenameExt: '.' + urlData.extension,
      name: urlData.id,
      customUrl: trimmed,
    };
  }

  return null;
}

module.exports = { sanitizeFilename, ensureDir, getExtension, buildUrl, formatDuration, handleDuplicateNames, getDateFolder, parseEmojiUrl, parseMixedLine };
