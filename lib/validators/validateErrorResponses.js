/**
 * Error Responses Validator
 * 
 * Validates that error responses (4xx, 5xx) are properly defined
 */

const COMMON_ERROR_CODES = {
  '400': 'Bad Request - Invalid input',
  '401': 'Unauthorized - Authentication required',
  '403': 'Forbidden - Access denied',
  '404': 'Not Found - Resource does not exist',
  '409': 'Conflict - Resource conflict',
  '422': 'Unprocessable Entity - Validation failed',
  '429': 'Too Many Requests - Rate limit exceeded',
  '500': 'Internal Server Error',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable'
};

function validateErrorResponses(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  
  for (const [pathName, pathDef] of Object.entries(paths)) {
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object') continue;
      
      const baseLocation = `${pathName}.${method}`;
      const responses = methodDef.responses || {};
      const statusCodes = Object.keys(responses);
      
      const errorCodes = statusCodes.filter(code => {
        const numCode = parseInt(code);
        return numCode >= 400 && numCode < 600;
      });
      
      if (errorCodes.length === 0) {
        addResult('error', 
          `Endpoint ${method.toUpperCase()} ${pathName} has no error responses defined.`,
          baseLocation,
          'Add at least one 4xx or 5xx error response. Common codes: 400, 401, 403, 404, 500.');
      }
      
      for (const [statusCode, response] of Object.entries(responses)) {
        const numCode = parseInt(statusCode);
        if (numCode < 400 || numCode >= 600) continue;
        
        const respLocation = `${baseLocation}.responses.${statusCode}`;
        
        if (!response.description) {
          const suggestion = COMMON_ERROR_CODES[statusCode] || 'Error response';
          addResult('warning',
            `Error response ${statusCode} is missing description.`,
            respLocation,
            `Add description, e.g., "${suggestion}"`);
        }
        
        const respSchema = response.content?.['application/json']?.schema;
        if (!respSchema) {
          addResult('warning',
            `Error response ${statusCode} has no schema defined.`,
            respLocation,
            'Add a schema for the error response body. Consider using ErrorResponse or ValidationErrorResponse from common.yaml.');
        } else {
          const hasErrorField = respSchema.properties?.error !== undefined;
          const hasMessageField = respSchema.properties?.message !== undefined;
          const hasErrorsArray = respSchema.properties?.errors !== undefined;
          
          if (!hasErrorField && !hasMessageField && !hasErrorsArray) {
            addResult('warning',
              `Error response ${statusCode} schema should contain error information.`,
              respLocation,
              'Include fields like "error", "message", or "errors" to describe what went wrong.');
          }
        }
      }
      
      const has400 = responses['400'] !== undefined;
      const has404 = responses['404'] !== undefined;
      const has500 = responses['500'] !== undefined;
      
      if (method === 'get' || method === 'delete') {
        if (!has404) {
          addResult('warning',
            `${method.toUpperCase()} ${pathName} should define 404 response.`,
            baseLocation,
            'Add 404 response for when the resource is not found.');
        }
      }
      
      if (method === 'post' || method === 'put' || method === 'patch') {
        if (!has400) {
          addResult('warning',
            `${method.toUpperCase()} ${pathName} should define 400 response.`,
            baseLocation,
            'Add 400 response for invalid request data.');
        }
      }
      
      if (!has500) {
        addResult('info',
          `${method.toUpperCase()} ${pathName} should define 500 response.`,
          baseLocation,
          'Consider adding 500 response for server errors.');
      }
    }
  }
}

module.exports = {
  validateErrorResponses
};
