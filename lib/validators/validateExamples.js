/**
 * Examples Validator
 * 
 * Validates that schemas and parameters have example values
 */

function validateExamples(apiSpec, addResult) {
  // Check component schemas for examples
  if (apiSpec.components?.schemas) {
    for (const [schemaName, schema] of Object.entries(apiSpec.components.schemas)) {
      const location = `components.schemas.${schemaName}`;
      
      // Skip if it's just a reference or composition
      if (schema.$ref || schema.allOf || schema.anyOf || schema.oneOf) continue;
      
      // Check for example in schema
      if (!schema.example && !schema.examples) {
        // Only warn for primitive types and simple objects
        if (schema.type === 'object' && schema.properties) {
          const propCount = Object.keys(schema.properties).length;
          if (propCount > 0 && propCount <= 10) {
            addResult('info',
              `Schema '${schemaName}' has no example defined.`,
              location,
              'Add example field to improve API documentation.');
          }
        } else if (['string', 'number', 'integer', 'boolean'].includes(schema.type)) {
          addResult('info',
            `Schema '${schemaName}' has no example value.`,
            location,
            'Add example field to show valid values.');
        }
      }
      
      // Check properties for examples
      if (schema.type === 'object' && schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          if (propSchema.$ref) continue;
          
          // Check if property has example
          if (!propSchema.example && !propSchema.examples && !propSchema.default) {
            // Only info level for property-level examples
            if (['string', 'number', 'integer', 'boolean'].includes(propSchema.type)) {
              // Don't spam too much - only check for required or special fields
              const isRequired = schema.required?.includes(propName);
              if (isRequired) {
                addResult('info',
                  `Required property '${schemaName}.${propName}' has no example.`,
                  `${location}.properties.${propName}`,
                  'Add example to show valid value.');
              }
            }
          }
        }
      }
    }
  }
  
  // Check parameters for examples
  const paths = apiSpec.paths || {};
  for (const [pathName, pathDef] of Object.entries(paths)) {
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object' || !methodDef.parameters) continue;
      
      const baseLocation = `${pathName}.${method}`;
      
      for (let i = 0; i < methodDef.parameters.length; i++) {
        const param = methodDef.parameters[i];
        const paramLocation = `${baseLocation}.parameters[${i}]`;
        
        // Check if parameter has example
        if (!param.example && !param.examples && !param.schema?.example) {
          // Only warn for query and path parameters
          if (param.in === 'query' || param.in === 'path') {
            addResult('info',
              `Parameter '${param.name}' has no example value.`,
              paramLocation,
              'Add example to show valid parameter value.');
          }
        }
      }
    }
  }
}

module.exports = {
  validateExamples
};
