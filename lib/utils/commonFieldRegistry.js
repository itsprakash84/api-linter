/**
 * Common Field Registry
 * 
 * Auto-extracts common field definitions from common.yaml.
 * Whenever you add/update schemas in common.yaml, this registry automatically picks them up.
 * 
 * This provides guidance (warnings), not enforced rules (errors).
 */

const { loadYaml } = require('./yamlLoader');
const path = require('path');

// Auto-load from common.yaml
const commonYamlPath = path.join(__dirname, '../../config/common.yaml');
let commonSpec = null;
const commonFieldDefinitions = {};
const commonFieldMap = {};

try {
  commonSpec = loadYaml(commonYamlPath);
  const schemas = commonSpec.components?.schemas || {};
  
  // Extract all schemas as common field definitions
  for (const [schemaName, schemaDef] of Object.entries(schemas)) {
    // Store the schema definition
    commonFieldDefinitions[schemaName] = schemaDef;
    
    // Create case-insensitive mappings for common field names
    const normalized = schemaName.toLowerCase();
    commonFieldMap[normalized] = schemaName;
    
    // Also map common variations (snake_case, camelCase)
    // UserID -> user_id, userId, userid
    const snakeCase = schemaName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    const camelCase = schemaName.charAt(0).toLowerCase() + schemaName.slice(1);
    
    if (snakeCase !== normalized) {
      commonFieldMap[snakeCase] = schemaName;
    }
    if (camelCase !== schemaName && camelCase !== normalized) {
      commonFieldMap[camelCase] = schemaName;
    }
  }
  
  console.log(`✓ Loaded ${Object.keys(commonFieldDefinitions).length} common field definitions from common.yaml`);
} catch (e) {
  // If common.yaml doesn't exist or has errors, continue with empty definitions
  console.warn(`⚠ Could not load common.yaml: ${e.message}`);
  console.warn('  Common field validation will be skipped.');
}

/**
 * Get the count of loaded common fields
 */
function getFieldCount() {
  return Object.keys(commonFieldDefinitions).length;
}

/**
 * Get all common field definitions
 */
function getAllFields() {
  return commonFieldDefinitions;
}

/**
 * Get a specific field definition by name (case-insensitive)
 */
function getField(fieldName) {
  const normalized = fieldName.toLowerCase();
  const actualName = commonFieldMap[normalized];
  return actualName ? commonFieldDefinitions[actualName] : null;
}

module.exports = {
  commonFieldDefinitions,
  commonFieldMap,
  commonSpec,
  getFieldCount,
  getAllFields,
  getField
};
