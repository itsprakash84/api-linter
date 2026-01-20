/**
 * Versioning Validator
 * 
 * Validates API versioning standards
 */

function isSemanticVersion(version) {
  // Check for semantic versioning: major.minor.patch (e.g., 1.0.0, 2.1.3)
  const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
  return semverPattern.test(version);
}

function validateVersioning(apiSpec, addResult) {
  const info = apiSpec.info || {};
  
  // Check if version exists
  if (!info.version) {
    addResult('error',
      'API specification is missing version information.',
      'info.version',
      'Add version field in info section (e.g., "1.0.0").');
    return;
  }
  
  const version = info.version;
  
  // Check for semantic versioning
  if (!isSemanticVersion(version)) {
    addResult('warning',
      `API version '${version}' does not follow semantic versioning.`,
      'info.version',
      'Use semantic versioning format: MAJOR.MINOR.PATCH (e.g., "1.0.0", "2.1.3").');
  }
  
  // Check for "v" prefix (not recommended in info.version)
  if (version.startsWith('v') || version.startsWith('V')) {
    addResult('warning',
      `API version '${version}' has "v" prefix.`,
      'info.version',
      'Remove "v" prefix from version. Use "1.0.0" instead of "v1.0.0".');
  }
  
  // Check if title includes version (redundant)
  if (info.title && /v\d+|version\s*\d+/i.test(info.title)) {
    addResult('info',
      'API title contains version information.',
      'info.title',
      'Consider removing version from title as it\'s already in info.version.');
  }
  
  // Check if paths include version (if using path-based versioning)
  const paths = apiSpec.paths || {};
  const pathsWithVersion = Object.keys(paths).filter(path => /\/v\d+\//i.test(path));
  
  if (pathsWithVersion.length > 0) {
    addResult('info',
      'API uses path-based versioning (e.g., /v1/resource).',
      'paths',
      'Ensure version in paths matches info.version. Consider using header-based versioning instead.');
  }
  
  // Check openapi version
  if (!apiSpec.openapi) {
    addResult('error',
      'Missing OpenAPI version.',
      'openapi',
      'Add openapi field (e.g., "3.0.3").');
  } else if (!apiSpec.openapi.startsWith('3.')) {
    addResult('warning',
      `OpenAPI version '${apiSpec.openapi}' is outdated.`,
      'openapi',
      'Consider upgrading to OpenAPI 3.0.3 or later.');
  }
}

module.exports = {
  validateVersioning
};
