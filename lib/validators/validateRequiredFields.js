/**
 * Required Fields Validator
 * 
 * Validates that request bodies and schemas have appropriate required fields
 */

function validateRequiredFields(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  
  // Check request bodies for required fields
  for (const [pathName, pathDef] of Object.entries(paths)) {
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object') continue;
      
      const baseLocation = `${pathName}.${method}`;
      
      // Check request body
      if (methodDef.requestBody) {
        const reqBodySchema = methodDef.requestBody.content?.['application/json']?.schema;
        
        if (reqBodySchema) {
          const location = `${baseLocation}.requestBody`;
          
          // Check if schema has properties but no required fields
          if (reqBodySchema.properties && !reqBodySchema.required) {
            const propCount = Object.keys(reqBodySchema.properties).length;
            if (propCount > 0) {
              addResult('warning',
                `Request body has ${propCount} properties but no required fields specified.`,
                location,
                'Add "required" array to specify which fields are mandatory.');
            }
          }
          
          // Check if required array exists but is empty (suspicious)
          if (reqBodySchema.required && reqBodySchema.required.length === 0 && reqBodySchema.properties) {
            const propCount = Object.keys(reqBodySchema.properties).length;
            if (propCount > 0) {
              addResult('info',
                `Request body has ${propCount} properties but required array is empty.`,
                location,
                'Consider marking critical fields as required.');
            }
          }
          
          // Check if requestBody itself is marked as required
          if (method === 'post' || method === 'put') {
            if (methodDef.requestBody.required !== true) {
              addResult('warning',
                `${method.toUpperCase()} request body should be marked as required.`,
                location,
                'Set "required": true for the requestBody.');
            }
          }
        }
      }
    }
  }
  
  // Check component schemas for required fields
  if (apiSpec.components?.schemas) {
    for (const [schemaName, schema] of Object.entries(apiSpec.components.schemas)) {
      if (schema.type !== 'object' || !schema.properties) continue;
      
      const location = `components.schemas.${schemaName}`;
      const propCount = Object.keys(schema.properties).length;
      
      // Check if object has properties but no required fields
      if (!schema.required && propCount > 0) {
        addResult('info',
          `Schema '${schemaName}' has ${propCount} properties but no required fields.`,
          location,
          'Consider adding "required" array for mandatory fields.');
      }
      
      // Check if required array references non-existent properties
      if (schema.required && Array.isArray(schema.required)) {
        const propNames = Object.keys(schema.properties);
        for (const requiredField of schema.required) {
          if (!propNames.includes(requiredField)) {
            addResult('error',
              `Schema '${schemaName}' marks '${requiredField}' as required but property doesn't exist.`,
              location,
              `Remove '${requiredField}' from required array or add it to properties.`);
          }
        }
      }
    }
  }
}

module.exports = {
  validateRequiredFields
};
