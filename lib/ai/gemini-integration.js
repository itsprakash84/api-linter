// ============================================================================
// Gemini AI Integration Module
// Enhances validation suggestions with AI-powered insights
// ============================================================================

const https = require('https');

/**
 * Configuration for Gemini AI
 */
const GEMINI_CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || '',
  model: 'gemini-pro',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
  timeout: 10000,
  enabled: false // Will be set to true if API key is present
};

/**
 * Initialize Gemini AI integration
 * @returns {boolean} - Whether AI is enabled
 */
function initializeGemini() {
  if (GEMINI_CONFIG.apiKey) {
    GEMINI_CONFIG.enabled = true;
    console.log('✓ Gemini AI integration enabled');
    return true;
  } else {
    console.log('ℹ Gemini AI integration disabled (set GEMINI_API_KEY to enable)');
    return false;
  }
}

/**
 * Check if Gemini AI is enabled
 * @returns {boolean}
 */
function isGeminiEnabled() {
  return GEMINI_CONFIG.enabled && !!GEMINI_CONFIG.apiKey;
}

/**
 * Make a request to Gemini AI API
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - AI response text
 */
async function callGeminiAPI(prompt) {
  if (!isGeminiEnabled()) {
    throw new Error('Gemini AI is not enabled. Set GEMINI_API_KEY environment variable.');
  }

  const url = `${GEMINI_CONFIG.endpoint}?key=${GEMINI_CONFIG.apiKey}`;
  
  const requestBody = JSON.stringify({
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: GEMINI_CONFIG.timeout
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.error) {
            reject(new Error(`Gemini API error: ${response.error.message}`));
            return;
          }

          if (response.candidates && response.candidates[0]?.content?.parts[0]?.text) {
            resolve(response.candidates[0].content.parts[0].text);
          } else {
            reject(new Error('Invalid response format from Gemini API'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Gemini response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Gemini API request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API request timed out'));
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Enhance a validation issue with AI-powered suggestions
 * @param {Object} issue - Validation issue object
 * @param {Object} context - Additional context (API spec, location, etc.)
 * @returns {Promise<Object>} - Enhanced issue with AI suggestions
 */
async function enhanceWithAI(issue, context = {}) {
  if (!isGeminiEnabled()) {
    return issue; // Return original issue if AI is disabled
  }

  try {
    const prompt = buildPrompt(issue, context);
    const aiResponse = await callGeminiAPI(prompt);
    
    return {
      ...issue,
      ai_suggestion: aiResponse,
      ai_enhanced: true,
      ai_timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn(`AI enhancement failed for issue: ${error.message}`);
    return {
      ...issue,
      ai_enhanced: false,
      ai_error: error.message
    };
  }
}

/**
 * Build prompt for Gemini AI based on validation issue
 * @param {Object} issue - Validation issue
 * @param {Object} context - Additional context
 * @returns {string} - Formatted prompt
 */
function buildPrompt(issue, context) {
  const { level, validator, message, location, suggestion } = issue;
  const { apiTitle, apiVersion, industry } = context;

  let prompt = `You are an OpenAPI specification expert helping to improve API design.

**Context:**
- API Title: ${apiTitle || 'Unknown'}
- API Version: ${apiVersion || 'Unknown'}
- Industry: ${industry || 'General'}

**Validation Issue:**
- Severity: ${level}
- Validator: ${validator}
- Location: ${location}
- Issue: ${message}
- Current Suggestion: ${suggestion || 'None'}

**Task:**
Provide a detailed, actionable suggestion to fix this OpenAPI specification issue. Your response should:
1. Explain why this is a problem
2. Provide a concrete example of the fix
3. Include best practices for this scenario
4. Keep it concise (2-3 sentences)

Focus on practical improvements that developers can implement immediately.`;

  return prompt;
}

/**
 * Enhance multiple validation issues in batch
 * @param {Array} issues - Array of validation issues
 * @param {Object} context - Shared context for all issues
 * @param {number} maxConcurrent - Maximum concurrent AI requests
 * @returns {Promise<Array>} - Array of enhanced issues
 */
async function enhanceBatchWithAI(issues, context = {}, maxConcurrent = 3) {
  if (!isGeminiEnabled() || !issues || issues.length === 0) {
    return issues;
  }

  console.log(`Enhancing ${issues.length} issues with Gemini AI (max ${maxConcurrent} concurrent)...`);
  
  const results = [];
  const batches = [];
  
  // Split into batches to avoid rate limiting
  for (let i = 0; i < issues.length; i += maxConcurrent) {
    batches.push(issues.slice(i, i + maxConcurrent));
  }

  for (const batch of batches) {
    const batchPromises = batch.map(issue => enhanceWithAI(issue, context));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const enhanced = results.filter(r => r.ai_enhanced).length;
  console.log(`✓ Enhanced ${enhanced}/${issues.length} issues with AI suggestions`);

  return results;
}

/**
 * Get AI-powered general recommendations for API spec
 * @param {Object} apiSpec - Full OpenAPI specification
 * @param {Array} validationResults - Validation results
 * @returns {Promise<Object>} - General recommendations
 */
async function getGeneralRecommendations(apiSpec, validationResults) {
  if (!isGeminiEnabled()) {
    return null;
  }

  try {
    const errorCount = validationResults.filter(r => r.level === 'error').length;
    const warningCount = validationResults.filter(r => r.level === 'warning').length;
    
    const prompt = `You are an OpenAPI specification expert. Analyze this API and provide general recommendations.

**API Information:**
- Title: ${apiSpec.info?.title || 'Unknown'}
- Version: ${apiSpec.info?.version || 'Unknown'}
- Endpoints: ${Object.keys(apiSpec.paths || {}).length}
- Schemas: ${Object.keys(apiSpec.components?.schemas || {}).length}

**Validation Summary:**
- Errors: ${errorCount}
- Warnings: ${warningCount}

**Task:**
Provide 3-5 high-level recommendations to improve this API design. Focus on:
1. Architecture and design patterns
2. Security and authentication
3. Documentation completeness
4. Consistency and maintainability

Keep each recommendation to 1-2 sentences. Be specific and actionable.`;

    const aiResponse = await callGeminiAPI(prompt);
    
    return {
      recommendations: aiResponse,
      generated_at: new Date().toISOString(),
      api_analyzed: {
        title: apiSpec.info?.title,
        version: apiSpec.info?.version,
        endpoint_count: Object.keys(apiSpec.paths || {}).length,
        schema_count: Object.keys(apiSpec.components?.schemas || {}).length
      }
    };
  } catch (error) {
    console.warn(`Failed to get general recommendations: ${error.message}`);
    return null;
  }
}

// Initialize on module load
initializeGemini();

module.exports = {
  initializeGemini,
  isGeminiEnabled,
  enhanceWithAI,
  enhanceBatchWithAI,
  getGeneralRecommendations,
  GEMINI_CONFIG
};
