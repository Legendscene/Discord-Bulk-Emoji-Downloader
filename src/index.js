const path = require('path');
const { parseEmojiMarkdown, readInputFile } = require('./parser');
const { downloadAll, downloadFromUrl } = require('./downloader');
const { createZip } = require('./zip');
const { ensureDir, formatDuration, parseEmojiUrl, parseMixedLine, getDateFolder } = require('./utils');
const { renderWindow, menuItems, summaryBlock, ask, askMulti, closeRL, clear, theme, sp } = require('./ui');

const ROOT = path.resolve(__dirname, '..');
const INPUT_FILE = path.join(ROOT, 'input', 'emoji.txt');
const OUTPUT_DIR = path.join(ROOT, 'output');
const LOGS_DIR = path.join(ROOT, 'logs');
const VERSION = 'v1.0.0';

function show(body, status) {
  clear();
  console.log(renderWindow(body, status, VERSION));
  console.log();
}

const homeBody = () => menuItems();

async function handleFileDownload() {
  ensureDir(OUTPUT_DIR);
  ensureDir(LOGS_DIR);

  show(['', theme.dim('  Reading ') + theme.menuText('input/emoji.txt') + theme.dim('...'), ''], '● Working');

  let text;
  try {
    text = readInputFile(INPUT_FILE);
  } catch {
    show([
      theme.error('  Failed to read ') + theme.menuText('input/emoji.txt'),
      '',
      theme.warning('  Create ') + theme.menuText('input/emoji.txt') + theme.warning(' with Discord emoji codes'),
    ], '● Error');
    return;
  }

  const emojis = parseEmojiMarkdown(text);

  if (emojis.length === 0) {
    show([
      theme.warning('  No emojis found in ') + theme.menuText('input/emoji.txt'),
      '',
      theme.warning('  Paste emoji messages from Discord into ') + theme.menuText('input/emoji.txt'),
    ], '● Error');
    return;
  }

  const dateFolder = getDateFolder(OUTPUT_DIR);
  show([
    theme.success('  Found ' + emojis.length + ' emoji(s)'),
    theme.dim('  Output: ') + theme.info(dateFolder),
    '',
    theme.info('  Downloading...'),
  ], '● Working');

  const results = await downloadAll(emojis, OUTPUT_DIR, LOGS_DIR);

  const summary = summaryBlock([
    { icon: '📥', label: 'Downloaded', value: theme.success.bold(String(results.downloaded)) },
    { icon: '⏭', label: 'Skipped', value: theme.warning.bold(String(results.skipped)) },
    { icon: '❌', label: 'Failed', value: results.failed > 0 ? theme.error.bold(String(results.failed)) : theme.dim('0') },
    { icon: '⏱', label: 'Duration', value: theme.info.bold(formatDuration(results.duration)) },
  ]);

  const extra = [];
  if (results.failedList.length > 0) {
    extra.push('');
    extra.push(theme.error('  Failed:'));
    results.failedList.forEach(f =>
      extra.push(theme.error('    • ') + theme.menuText(f.filename) + theme.dim(' (' + f.id + ')'))
    );
  }

  show(['', theme.dim('  Output: ') + theme.info(results.outputDir), '', ...summary, ...extra, ''], '● Complete');
}

async function handleUrlDownload() {
  show([
    '',
    theme.info('  📎 ') + theme.menuText('Paste Discord emoji URLs or codes below'),
    theme.info('  ') + theme.dim('(one per line, press Enter twice when done)'),
    '',
    theme.dim('  Supports:  <:name:id>  <a:name:id>  cdn.discordapp.com/emojis/<id>.png'),
    theme.dim('  Enter a blank line to start downloading.'),
    '',
  ], '● Awaiting input');

  const lines = await askMulti(sp() + theme.promptSymbol('  ❯ ') + ' ');

  if (lines.length === 0) {
    show(['', theme.error('  No input provided'), ''], '● Error');
    return;
  }

  const parsed = lines.map(l => parseMixedLine(l)).filter(Boolean);

  if (parsed.length === 0) {
    show(['', theme.error('  No valid emoji URLs or codes found'), ''], '● Error');
    return;
  }

  const codeCount = parsed.filter(p => !p.customUrl).length;
  const urlCount = parsed.filter(p => p.customUrl).length;

  ensureDir(OUTPUT_DIR);
  ensureDir(LOGS_DIR);

  const dateFolder = getDateFolder(OUTPUT_DIR);
  show([
    theme.success('  Parsed ' + parsed.length + ' emoji(s)'),
    theme.dim('    • ') + theme.menuText(codeCount + ' from codes') + theme.dim('  • ') + theme.menuText(urlCount + ' from URLs'),
    theme.dim('  Output: ') + theme.info(dateFolder),
    '',
    theme.info('  Downloading...'),
  ], '● Working');

  const emojis = parsed.map(p => ({
    name: p.name,
    id: p.id,
    animated: p.animated,
    ...(p.filenameExt ? { filenameExt: p.filenameExt } : {}),
    ...(p.customUrl ? { customUrl: p.customUrl } : {}),
  }));

  const results = await downloadAll(emojis, OUTPUT_DIR, LOGS_DIR);

  const summary = summaryBlock([
    { icon: '📥', label: 'Downloaded', value: theme.success.bold(String(results.downloaded)) },
    { icon: '⏭', label: 'Skipped', value: theme.warning.bold(String(results.skipped)) },
    { icon: '❌', label: 'Failed', value: results.failed > 0 ? theme.error.bold(String(results.failed)) : theme.dim('0') },
    { icon: '⏱', label: 'Duration', value: theme.info.bold(formatDuration(results.duration)) },
  ]);

  const extra = [];
  if (results.failedList.length > 0) {
    extra.push('');
    extra.push(theme.error('  Failed:'));
    results.failedList.forEach(f =>
      extra.push(theme.error('    • ') + theme.menuText(f.filename) + theme.dim(' (' + f.id + ')'))
    );
  }

  show(['', theme.dim('  Output: ') + theme.info(results.outputDir), '', ...summary, ...extra, ''], '● Complete');
}

async function main() {
  while (true) {
    show(homeBody(), '● Ready');

    const choice = await ask(sp() + theme.promptSymbol('  ❯ ') + ' ');

    switch (choice.trim()) {
      case '1':
        await handleFileDownload();
        break;
      case '2':
        await handleUrlDownload();
        break;
      case '3':
        show(['', theme.dim('  Thanks for using the tool.'), ''], '● Goodbye');
        closeRL();
        process.exit(0);
      default:
        show(['', theme.error('  Invalid option. ') + theme.dim('Please select 1, 2, or 3.'), ''], '● Error');
    }

    await ask(sp() + theme.muted('  Press Enter to continue...') + ' ');
  }
}

main().catch(err => {
  console.error(theme.error('\n  Fatal error:'), err.message);
  closeRL();
  process.exit(1);
});
