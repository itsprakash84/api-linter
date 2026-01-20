/**
 * Security Validator
 * 
 * Validates that endpoints have proper authentication and authorization
 */

function validateSecurity(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  const globalSecurity = apiSpec.security || [];
  
  // Check if there's any security defined at all
  const hasGlobalSecurity = globalSecurity.length > 0;
  const securitySchemes = apiSpec.components?.securitySchemes || {};
  
  if (!hasGlobalSecurity && Object.keys(securitySchemes).length === 0) {
    addResult('warning',
      'No security schemes defined in the API specification.',
      'components.securitySchemes',
      'Add security schemes (e.g., bearerAuth, apiKey, oauth2) in components.securitySchemes.');
  }
  
  // Check each endpoint for security
  for (const [pathName, pathDef] of Object.entries(paths)) {
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object') continue;
      
      const baseLocation = `${pathName}.${method}`;
      const endpointSecurity = methodDef.security;
      
      // Check if endpoint has security defined (either at operation level or global level)
      const hasEndpointSecurity = endpointSecurity !== undefined;
      const isPublic = hasEndpointSecurity && endpointSecurity.length === 0;
      
      if (!hasGlobalSecurity && !hasEndpointSecurity) {
        addResult('warning',
          `Endpoint ${method.toUpperCase()} ${pathName} has no security defined.`,
          baseLocation,
          'Add security requirement or explicitly mark as public with "security: []".');
      } else if (isPublic) {
        // Warn about public endpoints (might be intentional)
        addResult('info',
          `Endpoint ${method.toUpperCase()} ${pathName} is publicly accessible (no authentication).`,
          baseLocation,
          'Verify this endpoint should be public. If authentication is needed, add security requirements.');
      }
      
      // Check for sensitive operations without security
      if (method === 'post' || method === 'put' || method === 'patch' || method === 'delete') {
        if (!hasGlobalSecurity && (!hasEndpointSecurity || isPublic)) {
          addResult('error',
            `${method.toUpperCase()} ${pathName} modifies data but has no authentication.`,
            baseLocation,
            'Add security requirements for data-modifying operations (POST, PUT, PATCH, DELETE).');
        }
      }
    }
  }
  
  // Validate security scheme references
  if (hasGlobalSecurity) {
    for (const secReq of globalSecurity) {
      for (const schemeName of Object.keys(secReq)) {
        if (!securitySchemes[schemeName]) {
          addResult('error',
            `Security scheme '${schemeName}' is referenced but not defined.`,
            'security',
            `Add '${schemeName}' to components.securitySchemes.`);
        }
      }
    }
  }
}

module.exports = {
  validateSecurity
};
