/**
 * Summary Formatter
 * 
 * Formats validation results as a concise summary
 */

const { colorize } = require('../utils/colorHelper');

function formatAsSummary(results, specFile, strategy) {
  const errors = results.filter(r => r.level === 'error').length;
  const warnings = results.filter(r => r.level === 'warning').length;
  const info = results.filter(r => r.level === 'info').length;
  
  const lines = [];
  
  lines.push('');
  lines.push(colorize('='.repeat(60), 'blue'));
  lines.push(colorize('API Linter Summary', 'blue'));
  lines.push(colorize('='.repeat(60), 'blue'));
  lines.push('');
  lines.push(`File:     ${specFile}`);
  lines.push(`Strategy: ${strategy}`);
  lines.push('');
  lines.push(colorize(`✗ ${errors} errors`, 'red'));
  lines.push(colorize(`⚠ ${warnings} warnings`, 'yellow'));
  lines.push(colorize(`ℹ ${info} info`, 'blue'));
  lines.push('');
  
  return lines.join('\n');
}

module.exports = {
  formatAsSummary
};
