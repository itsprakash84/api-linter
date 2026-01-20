/**
 * Path Parameters Validator
 * 
 * Validates that path parameters are properly documented
 */

function extractPathParams(pathTemplate) {
  // Extract parameters from path like /bookings/{bookingId}/flights/{flightId}
  const matches = pathTemplate.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(match => match.slice(1, -1)); // Remove { }
}

function validatePathParameters(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  
  for (const [pathName, pathDef] of Object.entries(paths)) {
    // Extract expected path parameters from the path template
    const expectedParams = extractPathParams(pathName);
    
    if (expectedParams.length === 0) continue;
    
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object') continue;
      
      const baseLocation = `${pathName}.${method}`;
      const parameters = methodDef.parameters || [];
      
      // Get path parameters defined in the operation
      const definedPathParams = parameters
        .filter(p => p.in === 'path')
        .map(p => p.name);
      
      // Check for missing path parameter definitions
      for (const expectedParam of expectedParams) {
        if (!definedPathParams.includes(expectedParam)) {
          addResult('error',
            `Path parameter '${expectedParam}' in ${method.toUpperCase()} ${pathName} is not defined.`,
            `${baseLocation}.parameters`,
            `Add parameter definition: { "name": "${expectedParam}", "in": "path", "required": true, "schema": { "type": "string" } }`);
        }
      }
      
      // Check defined path parameters
      for (const param of parameters.filter(p => p.in === 'path')) {
        const paramLocation = `${baseLocation}.parameters`;
        
        // Path parameters must be required
        if (param.required !== true) {
          addResult('error',
            `Path parameter '${param.name}' must be required.`,
            paramLocation,
            `Set "required": true for path parameter '${param.name}'.`);
        }
        
        // Check if parameter has schema
        if (!param.schema) {
          addResult('error',
            `Path parameter '${param.name}' has no schema defined.`,
            paramLocation,
            `Add schema for '${param.name}' (e.g., { "type": "string" }).`);
        }
        
        // Check if parameter has description
        if (!param.description) {
          addResult('warning',
            `Path parameter '${param.name}' is missing description.`,
            paramLocation,
            `Add description for '${param.name}' explaining what it represents.`);
        }
        
        // Check if path param is defined but not in the path template
        if (!expectedParams.includes(param.name)) {
          addResult('warning',
            `Path parameter '${param.name}' is defined but not used in path template.`,
            paramLocation,
            `Remove unused parameter '${param.name}' or add {${param.name}} to the path.`);
        }
      }
    }
  }
}

module.exports = {
  validatePathParameters
};
