/**
 * Color Helper
 * 
 * Provides colored terminal output utilities
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function colorize(text, color, useColor = true) {
  if (!useColor) return text;
  return `${colors[color] || ''}${text}${colors.reset}`;
}

module.exports = {
  colors,
  colorize
};
