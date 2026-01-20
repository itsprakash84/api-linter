// ============================================================================
// API Linter - Shared Validation Module
// This module can be used by both CLI and web frontend
// ============================================================================

// Import validators
const { validateDescriptions } = require('../lib/validators/validateDescriptions');
const { validateCommonFields } = require('../lib/validators/validateCommonFields');
const { validateErrorResponses } = require('../lib/validators/validateErrorResponses');
const { validateComponents } = require('../lib/validators/validateComponents');
const { validateSecurity } = require('../lib/validators/validateSecurity');
const { validateVersioning } = require('../lib/validators/validateVersioning');
const { validateResponseSchemas } = require('../lib/validators/validateResponseSchemas');
const { validatePathParameters } = require('../lib/validators/validatePathParameters');
const { validateRequiredFields } = require('../lib/validators/validateRequiredFields');
const { validateHttpMethods } = require('../lib/validators/validateHttpMethods');
const { validateExamples } = require('../lib/validators/validateExamples');

// Import utilities
const commonFieldRegistry = require('../lib/utils/commonFieldRegistry');
const geminiAI = require('../lib/ai/gemini-integration');

/**
 * Main validation function that can be used by CLI, web, or API
 * @param {Object} apiSpec - Parsed OpenAPI specification
 * @param {Object} options - Validation options
 * @returns {Object|Promise<Object>} Validation results (Promise if AI enhancement enabled)
 */
async function runValidation(apiSpec, options = {}) {
    const {
        strategy = 'inline',
        minSeverity = 'warning',
        validators = 'all',
        fileName = 'api-spec.yaml',
        enableAI = false,
        industry = 'general'
    } = options;

    // Results array
    const results = [];
    
    // Helper function to add results
    const addResult = (level, message, location, suggestion, validator) => {
        results.push({ level, message, location, suggestion, validator });
    };

    // Ensure common fields are loaded
    const loadedFields = commonFieldRegistry.getFieldCount();
    console.log(`✓ Loaded ${loadedFields} common field definitions from common.yaml`);

    // Determine which validators to run
    const validatorsToRun = getValidatorsToRun(validators);

    // Run validators
    const startTime = Date.now();
    
    if (validatorsToRun.includes('descriptions')) {
        validateDescriptions(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('commonFields')) {
        validateCommonFields(apiSpec, addResult, strategy);
    }
    
    if (validatorsToRun.includes('errorResponses')) {
        validateErrorResponses(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('components')) {
        validateComponents(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('security')) {
        validateSecurity(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('versioning')) {
        validateVersioning(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('responseSchemas')) {
        validateResponseSchemas(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('pathParameters')) {
        validatePathParameters(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('requiredFields')) {
        validateRequiredFields(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('httpMethods')) {
        validateHttpMethods(apiSpec, addResult);
    }
    
    if (validatorsToRun.includes('examples')) {
        validateExamples(apiSpec, addResult);
    }

    const duration = Date.now() - startTime;

    // Filter by severity
    let filteredResults = filterBySeverity(results, minSeverity);

    // Enhance with AI if enabled
    let aiRecommendations = null;
    if (enableAI && geminiAI.isGeminiEnabled()) {
        console.log('Enhancing validation results with Gemini AI...');
        
        const context = {
            apiTitle: apiSpec.info?.title,
            apiVersion: apiSpec.info?.version,
            industry: industry
        };
        
        // Enhance individual issues (limit to top 10 for performance)
        const topIssues = filteredResults.slice(0, 10);
        const enhancedTopIssues = await geminiAI.enhanceBatchWithAI(topIssues, context);
        
        // Merge enhanced issues back
        filteredResults = [
            ...enhancedTopIssues,
            ...filteredResults.slice(10)
        ];
        
        // Get general recommendations
        aiRecommendations = await geminiAI.getGeneralRecommendations(apiSpec, filteredResults);
    }

    // Calculate summary
    const summary = {
        total: filteredResults.length,
        errors: filteredResults.filter(r => r.level === 'error').length,
        warnings: filteredResults.filter(r => r.level === 'warning').length,
        info: filteredResults.filter(r => r.level === 'info').length
    };

    const validationResults = {
        file: fileName,
        strategy,
        timestamp: new Date().toISOString(),
        summary,
        results: filteredResults,
        metadata: {
            duration,
            validatorsRun: validatorsToRun.length,
            commonFieldsLoaded: loadedFields,
            aiEnhanced: enableAI && geminiAI.isGeminiEnabled()
        },
        aiRecommendations: aiRecommendations
    };
    
    return validationResults;
}

/**
 * Get list of validators to run based on input
 */
function getValidatorsToRun(validators) {
    const allValidators = [
        'descriptions',
        'commonFields',
        'errorResponses',
        'components',
        'security',
        'versioning',
        'responseSchemas',
        'pathParameters',
        'requiredFields',
        'httpMethods',
        'examples'
    ];

    if (validators === 'all' || !validators || validators.length === 0) {
        return allValidators;
    }

    if (Array.isArray(validators)) {
        return validators.filter(v => allValidators.includes(v));
    }

    return allValidators;
}

/**
 * Filter results by minimum severity level
 */
function filterBySeverity(results, minSeverity) {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    const minLevel = severityOrder[minSeverity] || 1;

    return results.filter(result => {
        const level = severityOrder[result.level];
        return level <= minLevel;
    });
}

/**
 * Get available validators list
 */
function getAvailableValidators() {
    return [
        { name: 'descriptions', description: 'Validates description quality and completeness' },
        { name: 'commonFields', description: 'Validates fields against common.yaml standards' },
        { name: 'errorResponses', description: 'Validates error response definitions' },
        { name: 'components', description: 'Validates component schemas and references' },
        { name: 'security', description: 'Validates security schemes and authentication' },
        { name: 'versioning', description: 'Validates API versioning format' },
        { name: 'responseSchemas', description: 'Validates response schema completeness' },
        { name: 'pathParameters', description: 'Validates path parameter documentation' },
        { name: 'requiredFields', description: 'Validates required field marking' },
        { name: 'httpMethods', description: 'Validates HTTP method usage and REST conventions' },
        { name: 'examples', description: 'Validates example values in schemas' }
    ];
}

/**
 * Get common fields registry (for frontend display)
 */
function getCommonFields() {
    return {
        count: commonFieldRegistry.getFieldCount(),
        fields: commonFieldRegistry.getAllFields()
    };
}

module.exports = {
    runValidation,
    getAvailableValidators,
    getCommonFields,
    filterBySeverity
};
