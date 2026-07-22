const readline = require('readline');
const theme = require('./theme');

const C = { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│', ml: '├', mr: '┤' };
const BOX_W = 96;

function sidePad(cols) {
  return Math.max(0, Math.floor(((cols || process.stdout.columns || 80) - BOX_W) / 2));
}

function sp() { return ''; }

function vl(s) {
  return s.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').length;
}

function rep(c, n) {
  return c.repeat(Math.max(0, n));
}

function center(s, w) {
  const l = vl(s);
  if (l >= w) return s;
  const left = Math.floor((w - l) / 2);
  return rep(' ', left) + s + rep(' ', w - l - left);
}

function rpad(s, w) {
  const l = vl(s);
  if (l >= w) return s;
  return s + rep(' ', w - l);
}

function renderWindow(bodyLines, statusText, metaText) {
  const w = BOX_W;
  const i = w - 2;
  const cw = w - 6;
  const p = sp();
  const lines = [];

  lines.push(p + theme.border(C.tl + rep(C.h, i) + C.tr));
  lines.push(p + theme.border(C.v) + center(theme.title('Discord Emoji Downloader'), i) + theme.border(C.v));
  lines.push(p + theme.border(C.v) + center(theme.subtitle('Made by Panther'), i) + theme.border(C.v));
  lines.push(p + theme.border(C.ml + rep(C.h, i) + C.mr));

  for (const line of bodyLines) {
    const content = line || '';
    lines.push(p + theme.border(C.v) + '  ' + rpad(content, cw) + '  ' + theme.border(C.v));
  }

  const leftStatus = theme.meta(statusText || '● Ready');
  const rightMeta = theme.meta(metaText || 'v1.0.0');
  const sep = theme.meta('  │  ');
  const footerContent = leftStatus + sep + rightMeta;
  const footerPad = Math.max(0, cw - vl(footerContent));

  lines.push(p + theme.border(C.ml + rep(C.h, i) + C.mr));
  lines.push(p + theme.border(C.v) + '  ' + rpad(footerContent + rep(' ', footerPad), cw) + '  ' + theme.border(C.v));
  lines.push(p + theme.border(C.bl + rep(C.h, i) + C.br));

  return lines.join('\n');
}

function menuItems() {
  return [
    '',
    ' ' + theme.menuNumber('[1]') + '  ' + theme.menuText('Download from emoji.txt (bulk)'),
    ' ' + theme.menuNumber('[2]') + '  ' + theme.menuText('Download from URLs / emoji codes (bulk)'),
    ' ' + theme.menuNumber('[3]') + '  ' + theme.menuText('Exit'),
    '',
  ];
}

function summaryBlock(entries) {
  const cw = BOX_W - 6;
  const lines = [];

  for (const e of entries) {
    const coloredLeft = theme.dim(e.icon + ' ') + e.label + ' ';
    const pad = Math.max(0, cw - vl(coloredLeft) - vl(e.value));
    lines.push('  ' + coloredLeft + rep(' ', pad) + e.value);
  }

  return lines;
}

let rl = null;

function getRL() {
  if (!rl) rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return rl;
}

function ask(q) {
  return new Promise(resolve => getRL().question(q, resolve));
}

function askMulti(prompt) {
  return new Promise(resolve => {
    const rl = getRL();
    const lines = [];
    rl.question(prompt, first => {
      if (!first || first.trim() === '') {
        resolve([]);
        return;
      }
      lines.push(first.trim());
      const handler = line => {
        if (!line || line.trim() === '') {
          rl.removeListener('line', handler);
          resolve(lines);
          return;
        }
        lines.push(line.trim());
      };
      rl.on('line', handler);
    });
  });
}

function closeRL() { if (rl) { rl.close(); rl = null; } }

function clear() { process.stdout.write('\x1B[2J\x1B[0f'); }

module.exports = {
  renderWindow, menuItems, summaryBlock, ask, askMulti, closeRL, clear, theme, BOX_W, sp
};
