/**
 * Components Validator
 * 
 * Validates that components/schemas are properly defined and used
 */

function findAllRefs(obj, refs = new Set()) {
  if (!obj || typeof obj !== 'object') return refs;
  
  if (obj.$ref && typeof obj.$ref === 'string') {
    refs.add(obj.$ref);
  }
  
  for (const value of Object.values(obj)) {
    if (typeof value === 'object') {
      findAllRefs(value, refs);
    }
  }
  
  return refs;
}

function validateComponents(apiSpec, addResult) {
  const components = apiSpec.components || {};
  const schemas = components.schemas || {};
  
  const definedSchemas = new Set(Object.keys(schemas));
  
  const usedRefs = findAllRefs(apiSpec);
  const schemaRefs = Array.from(usedRefs)
    .filter(ref => ref.startsWith('#/components/schemas/'))
    .map(ref => ref.replace('#/components/schemas/', ''));
  
  const usedSchemas = new Set(schemaRefs);
  
  for (const schemaName of usedSchemas) {
    if (!definedSchemas.has(schemaName)) {
      addResult('error',
        `Referenced schema '${schemaName}' is not defined in components.schemas.`,
        'components.schemas',
        `Add schema definition for '${schemaName}' in components.schemas section.`);
    }
  }
  
  const unusedSchemas = Array.from(definedSchemas).filter(name => !usedSchemas.has(name));
  
  if (unusedSchemas.length > 0) {
    for (const schemaName of unusedSchemas) {
      addResult('info',
        `Schema '${schemaName}' is defined but never used.`,
        `components.schemas.${schemaName}`,
        `Consider removing unused schema '${schemaName}' or reference it in your API endpoints.`);
    }
  }
  
  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!schema.type && !schema.allOf && !schema.anyOf && !schema.oneOf && !schema.$ref) {
      addResult('warning',
        `Schema '${schemaName}' has no type definition.`,
        `components.schemas.${schemaName}`,
        'Add a "type" field (e.g., "object", "array", "string") or use composition (allOf, anyOf, oneOf).');
    }
    
    if (schema.type === 'object' && !schema.properties && !schema.allOf && !schema.additionalProperties) {
      addResult('warning',
        `Object schema '${schemaName}' has no properties defined.`,
        `components.schemas.${schemaName}`,
        'Define properties for this object schema or use "additionalProperties".');
    }
    
    if (schema.type === 'array' && !schema.items) {
      addResult('error',
        `Array schema '${schemaName}' has no items definition.`,
        `components.schemas.${schemaName}`,
        'Add "items" field to define the type of array elements.');
    }
  }
  
  if (Object.keys(schemas).length === 0 && Object.keys(apiSpec.paths || {}).length > 0) {
    addResult('info',
      'No schemas defined in components.schemas.',
      'components.schemas',
      'Consider defining reusable schemas in components.schemas to avoid duplication.');
  }
}

module.exports = {
  validateComponents
};
