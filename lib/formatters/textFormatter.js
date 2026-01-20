/**
 * Text Formatter
 * 
 * Formats validation results as human-readable colored text
 */

const { colorize } = require('../utils/colorHelper');
const aiCliFormatter = require('./ai-cli-formatter');

function formatAsText(results, specFile, strategy, options = {}) {
  const lines = [];
  const { aiEnhanced = false, aiRecommendations = null } = options;
  
  lines.push('');
  lines.push(colorize('='.repeat(70), 'blue'));
  lines.push(colorize('API Linter Results', 'blue') + (aiEnhanced ? aiCliFormatter.getAIBadge(true) : ''));
  lines.push(colorize('='.repeat(70), 'blue'));
  lines.push('');
  lines.push(`File:     ${specFile}`);
  lines.push(`Strategy: ${colorize(strategy, 'blue')}`);
  lines.push(`Found:    ${results.length} issue(s)`);
  
  if (aiEnhanced) {
    aiCliFormatter.displayStatus();
  }
  
  lines.push('');
  
  if (results.length === 0) {
    lines.push(colorize('✓ No issues found! API spec looks good.', 'green'));
  } else {
    for (const result of results) {
      const levelColor = result.level === 'error' ? 'red' : result.level === 'warning' ? 'yellow' : 'blue';
      const levelSymbol = result.level === 'error' ? '✗' : result.level === 'warning' ? '⚠' : 'ℹ';
      
      lines.push(`${colorize(levelSymbol, levelColor)} ${colorize(result.level.toUpperCase(), levelColor)}: ${result.message}`);
      lines.push(`  ${colorize('Location:', 'gray')} ${result.location}`);
      if (result.suggestion) {
        lines.push(`  ${colorize('Suggestion:', 'gray')} ${result.suggestion}`);
      }
      
      // Add AI suggestion if available
      if (result.aiSuggestion) {
        const aiFormatted = aiCliFormatter.formatForCLI(result, true);
        lines.push(aiFormatted);
      }
      
      lines.push('');
    }
  }
  
  // Add AI general recommendations
  if (aiRecommendations) {
    lines.push(aiCliFormatter.formatRecommendations(aiRecommendations, true));
  }
  
  lines.push(colorize('='.repeat(70), 'blue'));
  lines.push('');
  
  return lines.join('\n');
}

module.exports = {
  formatAsText
};
