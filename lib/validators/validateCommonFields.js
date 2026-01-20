/**
 * Common Fields Validator
 * 
 * Validates usage of common fields defined in the registry
 */

const { commonFieldDefinitions, commonFieldMap } = require('../utils/commonFieldRegistry');

function validateFieldMatch(actualSchema, expectedDef, fullPath) {
  const issues = [];
  
  if (expectedDef.type && actualSchema.type !== expectedDef.type) {
    issues.push({
      field: 'type',
      expected: expectedDef.type,
      actual: actualSchema.type,
      message: `Type mismatch: expected '${expectedDef.type}', got '${actualSchema.type}'`
    });
  }
  
  if (expectedDef.format && actualSchema.format !== expectedDef.format) {
    issues.push({
      field: 'format',
      expected: expectedDef.format,
      actual: actualSchema.format || 'none',
      message: `Format mismatch: expected '${expectedDef.format}', got '${actualSchema.format || 'none'}'`
    });
  }
  
  if (expectedDef.pattern && actualSchema.pattern !== expectedDef.pattern) {
    issues.push({
      field: 'pattern',
      expected: expectedDef.pattern,
      actual: actualSchema.pattern || 'none',
      message: `Pattern mismatch: expected '${expectedDef.pattern}', got '${actualSchema.pattern || 'none'}'`
    });
  }
  
  if (expectedDef.minLength && actualSchema.minLength !== expectedDef.minLength) {
    issues.push({
      field: 'minLength',
      expected: expectedDef.minLength,
      actual: actualSchema.minLength || 'none',
      message: `MinLength mismatch: expected ${expectedDef.minLength}, got ${actualSchema.minLength || 'none'}`
    });
  }
  
  if (expectedDef.maxLength && actualSchema.maxLength !== expectedDef.maxLength) {
    issues.push({
      field: 'maxLength',
      expected: expectedDef.maxLength,
      actual: actualSchema.maxLength || 'none',
      message: `MaxLength mismatch: expected ${expectedDef.maxLength}, got ${actualSchema.maxLength || 'none'}`
    });
  }
  
  if (expectedDef.enum) {
    const expectedEnums = JSON.stringify(expectedDef.enum.sort());
    const actualEnums = JSON.stringify((actualSchema.enum || []).sort());
    if (expectedEnums !== actualEnums) {
      issues.push({
        field: 'enum',
        expected: expectedDef.enum,
        actual: actualSchema.enum || [],
        message: `Enum values mismatch`
      });
    }
  }
  
  return issues;
}

function walkSchema(schema, callback, path = '') {
  if (!schema || typeof schema !== 'object') return;
  
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const propPath = path ? `${path}.${propName}` : propName;
      callback(propName, propSchema, propPath);
      walkSchema(propSchema, callback, propPath);
    }
  }
  
  if (schema.items) {
    walkSchema(schema.items, callback, path ? `${path}[]` : '[]');
  }
  
  if (schema.allOf) {
    schema.allOf.forEach((subSchema, idx) => {
      walkSchema(subSchema, callback, `${path}.allOf[${idx}]`);
    });
  }
  
  if (schema.anyOf) {
    schema.anyOf.forEach((subSchema, idx) => {
      walkSchema(subSchema, callback, `${path}.anyOf[${idx}]`);
    });
  }
  
  if (schema.oneOf) {
    schema.oneOf.forEach((subSchema, idx) => {
      walkSchema(subSchema, callback, `${path}.oneOf[${idx}]`);
    });
  }
}

function validateCommonFields(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  
  for (const [pathName, pathDef] of Object.entries(paths)) {
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object') continue;
      
      const baseLocation = `${pathName}.${method}`;
      
      if (methodDef.requestBody) {
        const reqBodySchema = methodDef.requestBody.content?.['application/json']?.schema;
        if (reqBodySchema) {
          walkSchema(reqBodySchema, (propName, propSchema, propPath) => {
            const normalizedName = propName.toLowerCase();
            
            if (commonFieldMap[normalizedName]) {
              const expectedDef = commonFieldDefinitions[commonFieldMap[normalizedName]];
              const issues = validateFieldMatch(propSchema, expectedDef, propPath);
              
              if (issues.length > 0) {
                const location = `${baseLocation}.requestBody.${propPath}`;
                const issueDetails = issues.map(i => i.message).join('; ');
                addResult('warning', 
                  `Common field '${propName}' doesn't match standard definition in request body.`,
                  location, 
                  `Consider using standard definition: ${issueDetails}. Example: ${JSON.stringify(expectedDef.example || expectedDef)}`);
              }
            }
          });
        }
      }
      
      if (methodDef.responses) {
        for (const [statusCode, response] of Object.entries(methodDef.responses)) {
          const respSchema = response.content?.['application/json']?.schema;
          if (respSchema) {
            walkSchema(respSchema, (propName, propSchema, propPath) => {
              const normalizedName = propName.toLowerCase();
              
              if (commonFieldMap[normalizedName]) {
                const expectedDef = commonFieldDefinitions[commonFieldMap[normalizedName]];
                const issues = validateFieldMatch(propSchema, expectedDef, propPath);
                
                if (issues.length > 0) {
                  const location = `${baseLocation}.responses.${statusCode}.${propPath}`;
                  const issueDetails = issues.map(i => i.message).join('; ');
                  addResult('warning',
                    `Common field '${propName}' doesn't match standard definition in response.`,
                    location,
                    `Consider using standard definition: ${issueDetails}. Example: ${JSON.stringify(expectedDef.example || expectedDef)}`);
                }
              }
            });
          }
        }
      }
    }
  }
  
  if (apiSpec.components?.schemas) {
    for (const [schemaName, schema] of Object.entries(apiSpec.components.schemas)) {
      walkSchema(schema, (propName, propSchema, propPath) => {
        const normalizedName = propName.toLowerCase();
        
        if (commonFieldMap[normalizedName]) {
          const expectedDef = commonFieldDefinitions[commonFieldMap[normalizedName]];
          const issues = validateFieldMatch(propSchema, expectedDef, propPath);
          
          if (issues.length > 0) {
            const location = `components.schemas.${schemaName}.${propPath}`;
            const issueDetails = issues.map(i => i.message).join('; ');
            addResult('warning',
              `Common field '${propName}' in schema '${schemaName}' doesn't match standard definition.`,
              location,
              `Consider using standard definition: ${issueDetails}. Example: ${JSON.stringify(expectedDef.example || expectedDef)}`);
          }
        }
      });
    }
  }
}

module.exports = {
  validateCommonFields
};
