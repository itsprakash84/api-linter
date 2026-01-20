/**
 * Description Validator
 * 
 * Validates that all fields have proper quality descriptions
 */

function isValidDescription(desc) {
  if (!desc || typeof desc !== 'string') return false;
  if (desc.length < 10) return false;
  if (!/^[A-Z]/.test(desc)) return false;
  if (!/[.!?:]$/.test(desc)) return false;
  return true;
}

function getSuggestion(currentDesc, fieldName) {
  const issues = [];
  
  if (!currentDesc) {
    return `Add a description for field '${fieldName}' explaining what it represents.`;
  }
  
  if (!/^[A-Z]/.test(currentDesc)) {
    issues.push('start with uppercase letter');
  }
  if (!/[.!?:]$/.test(currentDesc)) {
    issues.push('end with proper punctuation (. ! ? or :)');
  }
  if (currentDesc.length < 10) {
    issues.push('be more descriptive (at least 10 characters)');
  }
  
  if (issues.length > 0) {
    return `Description should ${issues.join(', ')}. Current: "${currentDesc}"`;
  }
  
  return null;
}

function walkProperties(schema, callback, path = '') {
  if (!schema || typeof schema !== 'object') return;
  
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const propPath = path ? `${path}.properties.${propName}` : `properties.${propName}`;
      callback(propName, propSchema, propPath);
      walkProperties(propSchema, callback, propPath);
    }
  }
  
  if (schema.items) {
    walkProperties(schema.items, callback, `${path}.items`);
  }
}

function validateDescriptions(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  
  for (const [pathName, pathDef] of Object.entries(paths)) {
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object') continue;
      
      const baseLocation = `${pathName}.${method}`;
      
      if (!methodDef.description && !methodDef.summary) {
        addResult('warning', `Endpoint ${method.toUpperCase()} ${pathName} is missing description or summary.`,
          baseLocation, 'Add a description or summary explaining what this endpoint does.');
      }
      
      if (methodDef.parameters) {
        for (let i = 0; i < methodDef.parameters.length; i++) {
          const param = methodDef.parameters[i];
          const paramLocation = `${baseLocation}.parameters[${i}]`;
          
          if (!param.description) {
            addResult('error', `Parameter '${param.name}' is missing description.`,
              paramLocation, `Add description for parameter '${param.name}'.`);
          } else if (!isValidDescription(param.description)) {
            addResult('warning', `Parameter '${param.name}' description needs improvement.`, paramLocation,
              getSuggestion(param.description, param.name));
          }
        }
      }
      
      if (methodDef.requestBody) {
        const reqBodySchema = methodDef.requestBody.content?.['application/json']?.schema;
        if (reqBodySchema) {
          walkProperties(reqBodySchema, (propName, propSchema, propPath) => {
            const location = `${baseLocation}.requestBody.${propPath}`;
            if (!propSchema.description) {
              addResult('error', `Request body field '${propName}' is missing description.`,
                location, `Add a description for field '${propName}' explaining its purpose.`);
            } else if (!isValidDescription(propSchema.description)) {
              addResult('warning', `Field '${propName}' description needs improvement.`, location,
                getSuggestion(propSchema.description, propName));
            }
          });
        }
      }
      
      if (methodDef.responses) {
        for (const [statusCode, response] of Object.entries(methodDef.responses)) {
          const respLocation = `${baseLocation}.responses.${statusCode}`;
          
          if (!response.description) {
            addResult('warning', `Response ${statusCode} is missing description.`,
              respLocation, 'Add a description explaining when this response occurs.');
          }
          
          const respSchema = response.content?.['application/json']?.schema;
          if (respSchema) {
            walkProperties(respSchema, (propName, propSchema, propPath) => {
              const location = `${respLocation}.${propPath}`;
              if (!propSchema.description) {
                addResult('error', `Response field '${propName}' is missing description.`,
                  location, `Add a description for field '${propName}' explaining what it represents.`);
              } else if (!isValidDescription(propSchema.description)) {
                addResult('warning', `Field '${propName}' description needs improvement.`, location,
                  getSuggestion(propSchema.description, propName));
              }
            });
          }
        }
      }
    }
  }
  
  if (apiSpec.components?.schemas) {
    for (const [schemaName, schema] of Object.entries(apiSpec.components.schemas)) {
      walkProperties(schema, (propName, propSchema, propPath) => {
        const propLocation = `components.schemas.${schemaName}.${propPath}`;
        if (!propSchema.description) {
          addResult('error', `Schema '${schemaName}' property '${propName}' is missing description.`,
            propLocation, `Add description for property '${propName}'.`);
        } else if (!isValidDescription(propSchema.description)) {
          addResult('warning', `Property '${schemaName}.${propName}' description needs improvement.`, propLocation,
            getSuggestion(propSchema.description, propName));
        }
      });
    }
  }
}

module.exports = {
  validateDescriptions
};
