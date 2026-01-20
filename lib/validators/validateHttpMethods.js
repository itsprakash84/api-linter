/**
 * HTTP Methods Validator
 * 
 * Validates proper use of HTTP methods and REST conventions
 */

function validateHttpMethods(apiSpec, addResult) {
  const paths = apiSpec.paths || {};
  
  for (const [pathName, pathDef] of Object.entries(paths)) {
    const methods = Object.keys(pathDef).filter(key => 
      ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(key)
    );
    
    // Check for resource with ID but missing update/delete operations
    const hasIdParam = /\{[^}]+\}/.test(pathName);
    
    if (hasIdParam) {
      // Single resource endpoint (e.g., /bookings/{id})
      const hasGet = methods.includes('get');
      const hasUpdate = methods.includes('put') || methods.includes('patch');
      const hasDelete = methods.includes('delete');
      
      if (hasGet && !hasUpdate && !hasDelete) {
        addResult('info',
          `Resource ${pathName} is read-only (no PUT/PATCH/DELETE).`,
          pathName,
          'Consider adding update (PUT/PATCH) or delete (DELETE) operations if resource is mutable.');
      }
      
      if (hasUpdate && !hasGet) {
        addResult('warning',
          `Resource ${pathName} can be updated but not retrieved.`,
          pathName,
          'Add GET operation to allow reading the resource.');
      }
      
      // Check for both PUT and PATCH (might be redundant)
      if (methods.includes('put') && methods.includes('patch')) {
        addResult('info',
          `Resource ${pathName} has both PUT and PATCH.`,
          pathName,
          'Consider using only PUT (full replacement) or PATCH (partial update).');
      }
    } else {
      // Collection endpoint (e.g., /bookings)
      const hasGet = methods.includes('get');
      const hasPost = methods.includes('post');
      
      if (hasPost && !hasGet) {
        addResult('info',
          `Collection ${pathName} allows creation but not listing.`,
          pathName,
          'Consider adding GET operation to list resources.');
      }
      
      // PUT/PATCH/DELETE on collections is unusual
      if (methods.includes('put') || methods.includes('patch')) {
        addResult('warning',
          `Collection ${pathName} has PUT or PATCH operation.`,
          pathName,
          'PUT/PATCH is typically for individual resources. Consider moving to /{id} endpoint.');
      }
      
      if (methods.includes('delete')) {
        addResult('warning',
          `Collection ${pathName} has DELETE operation.`,
          pathName,
          'DELETE on collections (bulk delete) should be carefully considered. Usually DELETE is for individual resources.');
      }
    }
    
    // Check request body usage
    for (const [method, methodDef] of Object.entries(pathDef)) {
      if (typeof methodDef !== 'object') continue;
      
      const baseLocation = `${pathName}.${method}`;
      const hasRequestBody = !!methodDef.requestBody;
      
      // GET, DELETE, HEAD should not have request body
      if (['get', 'delete', 'head'].includes(method) && hasRequestBody) {
        addResult('warning',
          `${method.toUpperCase()} ${pathName} has a request body.`,
          baseLocation,
          `${method.toUpperCase()} requests typically should not have request bodies. Use query parameters instead.`);
      }
      
      // POST, PUT, PATCH should usually have request body
      if (['post', 'put', 'patch'].includes(method) && !hasRequestBody) {
        addResult('warning',
          `${method.toUpperCase()} ${pathName} has no request body.`,
          baseLocation,
          `${method.toUpperCase()} requests typically require a request body to send data.`);
      }
      
      // Check for success response codes
      const responses = methodDef.responses || {};
      const responseCodes = Object.keys(responses).map(code => parseInt(code));
      
      if (method === 'post') {
        if (!responseCodes.includes(201) && !responseCodes.includes(200)) {
          addResult('info',
            `POST ${pathName} doesn't define 200 or 201 response.`,
            `${baseLocation}.responses`,
            'POST requests typically return 201 (Created) or 200 (OK).');
        }
      }
      
      if (method === 'delete') {
        if (!responseCodes.includes(204) && !responseCodes.includes(200)) {
          addResult('info',
            `DELETE ${pathName} doesn't define 200 or 204 response.`,
            `${baseLocation}.responses`,
            'DELETE requests typically return 204 (No Content) or 200 (OK).');
        }
      }
    }
  }
}

module.exports = {
  validateHttpMethods
};
