/**
 * Response Schema Validator
 * 
 * Validates that all responses have proper schema definitions
 */

function validateResponseSchemas(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  
  for (const [pathName, pathDef] of Object.entries(paths)) {
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object' || !methodDef.responses) continue;
      
      const baseLocation = `${pathName}.${method}`;
      const responses = methodDef.responses;
      
      // Check if at least one success response exists
      const successResponses = Object.keys(responses).filter(code => {
        const numCode = parseInt(code);
        return numCode >= 200 && numCode < 300;
      });
      
      if (successResponses.length === 0) {
        addResult('warning',
          `Endpoint ${method.toUpperCase()} ${pathName} has no success responses (2xx).`,
          baseLocation,
          'Add at least one 2xx success response (e.g., 200, 201, 204).');
      }
      
      // Check each response for schema
      for (const [statusCode, response] of Object.entries(responses)) {
        const numCode = parseInt(statusCode);
        const respLocation = `${baseLocation}.responses.${statusCode}`;
        
        // Skip checking schema for 204 No Content
        if (numCode === 204) continue;
        
        // Check if response has content
        if (!response.content) {
          // For success responses, missing content is more concerning
          if (numCode >= 200 && numCode < 300) {
            addResult('warning',
              `Response ${statusCode} has no content defined.`,
              respLocation,
              'Add content with appropriate media type (e.g., application/json) and schema.');
          }
          continue;
        }
        
        // Check for application/json
        const jsonContent = response.content['application/json'];
        if (!jsonContent) {
          addResult('info',
            `Response ${statusCode} does not define application/json content type.`,
            respLocation,
            'Consider adding application/json content type for API responses.');
          continue;
        }
        
        // Check if schema is defined
        if (!jsonContent.schema) {
          addResult('error',
            `Response ${statusCode} application/json has no schema defined.`,
            `${respLocation}.content.application/json`,
            'Add schema to define the structure of the response body.');
        } else {
          // Check if schema is empty object
          const schema = jsonContent.schema;
          if (schema && typeof schema === 'object' && 
              !schema.$ref && !schema.type && !schema.allOf && 
              !schema.anyOf && !schema.oneOf && 
              Object.keys(schema).length === 0) {
            addResult('warning',
              `Response ${statusCode} has empty schema.`,
              `${respLocation}.content.application/json.schema`,
              'Define schema properties or use $ref to reference a component schema.');
          }
        }
        
        // Check for examples in responses
        if (jsonContent.schema && !jsonContent.example && !jsonContent.examples && !jsonContent.schema.example) {
          if (numCode >= 200 && numCode < 300) {
            addResult('info',
              `Response ${statusCode} has no example defined.`,
              `${respLocation}.content.application/json`,
              'Consider adding example response to improve API documentation.');
          }
        }
      }
    }
  }
}

module.exports = {
  validateResponseSchemas
};
