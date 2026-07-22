const chalk = require('chalk');

const theme = {
  title: chalk.hex('#5cd6ff').bold,
  subtitle: chalk.hex('#cccccc'),
  border: chalk.hex('#cca300'),
  menuNumber: chalk.green.bold,
  menuText: chalk.white,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  dim: chalk.hex('#777777'),
  highlight: chalk.hex('#4ECDC4'),
  promptSymbol: chalk.green,
  meta: chalk.hex('#999999'),
  muted: chalk.hex('#666666'),
  accent: chalk.hex('#FFD93D'),
};

module.exports = theme;
