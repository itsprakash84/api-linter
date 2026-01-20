/**
 * JSON Formatter
 * 
 * Formats validation results as JSON for programmatic use
 */

function formatAsJson(results, specFile, strategy) {
  return JSON.stringify({
    file: specFile,
    strategy: strategy,
    summary: {
      total: results.length,
      errors: results.filter(r => r.level === 'error').length,
      warnings: results.filter(r => r.level === 'warning').length,
      info: results.filter(r => r.level === 'info').length,
    },
    results: results,
  }, null, 2);
}

module.exports = {
  formatAsJson
};
