const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pLimit = require('p-limit').default || require('p-limit');
const cliProgress = require('cli-progress');
const { buildUrl, ensureDir, formatDuration, handleDuplicateNames, getDateFolder } = require('./utils');

const AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadSingle(emoji, outputDir, customUrl) {
  const filePath = path.join(outputDir, emoji.filename);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    if (stats.size > 0) {
      return { ok: true, skipped: true };
    }
  }

  const url = customUrl || buildUrl(emoji.id, emoji.animated);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await axios({
        method: 'get',
        url,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': AGENT,
          'Referer': 'https://discord.com/'
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty (0 bytes)');
      }

      return { ok: true, skipped: false };
    } catch (err) {
      if (attempt < 3) {
        await sleep(1000 * attempt);
      }
    }
  }

  return { ok: false };
}

function writeLog(logFile, entries) {
  const stream = fs.createWriteStream(logFile, { flags: 'a' });
  entries.forEach(e => stream.write(e + '\n'));
  stream.end();
}

async function downloadAll(emojis, baseOutputDir, baseLogsDir) {
  const outputDir = getDateFolder(baseOutputDir);
  const logsDir = getDateFolder(baseLogsDir);

  const logFile = path.join(logsDir, 'download.log');
  const named = handleDuplicateNames(emojis);
  const total = named.length;
  const startTime = Date.now();

  const logEntries = [`=== Session ${new Date().toISOString()} ===`, `Total emojis: ${total}`, `Output: ${outputDir}`];

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  const failedList = [];

  const limit = pLimit(20);
  const bar = new cliProgress.SingleBar({
    format: '{bar} {percentage}% | {value}/{total} | \u2b07 {downloaded} | \u23ed {skipped} | \u2717 {failed} | \u23f1{speed}emojis/s | ETA: {eta}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  }, cliProgress.Presets.shades_classic);

  bar.start(total, 0, { downloaded: 0, skipped: 0, failed: 0, speed: '0', eta: '--' });

  const tasks = named.map(emoji =>
    limit(async () => {
      const result = await downloadSingle(emoji, outputDir, emoji.customUrl);
      const elapsed = (Date.now() - startTime) / 1000;
      let status;

      if (result.ok && result.skipped) {
        skipped++;
        status = 'SKIPPED';
        logEntries.push(`[SKIP] ${emoji.filename} (${emoji.id}) — already exists`);
      } else if (result.ok) {
        downloaded++;
        status = 'OK';
        logEntries.push(`[OK] ${emoji.filename} (${emoji.id}) — ${emoji.animated ? 'animated' : 'static'}`);
      } else {
        failed++;
        status = 'FAILED';
        failedList.push({ name: emoji.name, id: emoji.id, filename: emoji.filename });
        logEntries.push(`[FAIL] ${emoji.filename} (${emoji.id}) — failed after 3 retries`);
      }

      const speed = elapsed > 0 ? ((downloaded + skipped) / elapsed).toFixed(1) : '0';
      const done = downloaded + skipped + failed;
      bar.update(done, { downloaded, skipped, failed, speed });

      return { emoji, result, status };
    })
  );

  await Promise.all(tasks);
  bar.stop();

  const totalElapsed = (Date.now() - startTime) / 1000;

  logEntries.push(`--- Summary ---`);
  logEntries.push(`Downloaded: ${downloaded}`);
  logEntries.push(`Skipped: ${skipped}`);
  logEntries.push(`Failed: ${failed}`);
  logEntries.push(`Duration: ${formatDuration(totalElapsed)}`);

  writeLog(logFile, logEntries);

  return { downloaded, skipped, failed, failedList, total, duration: totalElapsed, outputDir, logsDir, logFile };
}

async function downloadFromUrl(emojiData, baseOutputDir, baseLogsDir) {
  const outputDir = getDateFolder(baseOutputDir);
  const logsDir = getDateFolder(baseLogsDir);

  const logFile = path.join(logsDir, 'download.log');

  const ext = '.' + emojiData.extension;
  const filename = emojiData.id + ext;

  const emoji = {
    id: emojiData.id,
    animated: emojiData.animated,
    name: emojiData.id,
    filename
  };

  const urls = [emojiData.originalUrl];
  const fallback = buildUrl(emojiData.id, emojiData.animated);
  if (fallback !== emojiData.originalUrl) urls.push(fallback);

  const startTime = Date.now();
  let result = { ok: false };
  for (const url of urls) {
    result = await downloadSingle(emoji, outputDir, url);
    if (result.ok) break;
  }
  const duration = (Date.now() - startTime) / 1000;

  const logEntries = [`=== URL Download ${new Date().toISOString()} ===`];

  if (result.ok && result.skipped) {
    logEntries.push(`[SKIP] ${filename} — already exists`);
  } else if (result.ok) {
    logEntries.push(`[OK] ${filename} — ${emojiData.animated ? 'animated' : 'static'}`);
  } else {
    logEntries.push(`[FAIL] ${filename} — failed after 3 retries`);
  }

  logEntries.push(`Duration: ${formatDuration(duration)}`);
  writeLog(logFile, logEntries);

  return {
    ok: result.ok,
    skipped: result.skipped,
    filename,
    filepath: path.join(outputDir, filename),
    outputDir,
    logFile,
    duration
  };
}

module.exports = { downloadAll, downloadFromUrl, downloadSingle };
