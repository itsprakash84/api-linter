# API Linter - Architecture

## Overview

The API Linter uses a **shared validation engine** that can be used by:
1. **CLI** - Command-line tool (`api-linter-cli.js`)
2. **Web Frontend** - Browser interface (`web/frontend/`)
3. **Spring Boot Backend** - REST API service (`web/backend-api/`)

This ensures **consistent validation** across all interfaces with **no code duplication**.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED VALIDATION ENGINE                  │
│                   lib/validation-engine.js                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  11 Validators (lib/validators/)                     │  │
│  │  - validateDescriptions.js                           │  │
│  │  - validateCommonFields.js                           │  │
│  │  - validateErrorResponses.js                         │  │
│  │  - validateComponents.js                             │  │
│  │  - validateSecurity.js                               │  │
│  │  - validateVersioning.js                             │  │
│  │  - validateResponseSchemas.js                        │  │
│  │  - validatePathParameters.js                         │  │
│  │  - validateRequiredFields.js                         │  │
│  │  - validateHttpMethods.js                            │  │
│  │  - validateExamples.js                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Utilities (lib/utils/)                              │  │
│  │  - yamlLoader.js                                     │  │
│  │  - commonFieldRegistry.js                           │  │
│  │  - colorHelper.js                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
    │   CLI Tool    │ │ Web Frontend │ │ Spring Boot  │
    │               │ │              │ │   Backend    │
    │ api-linter-   │ │  Browser JS  │ │   REST API   │
    │   cli.js      │ │              │ │              │
    └───────────────┘ └──────────────┘ └──────────────┘
         │                  │                  │
         ▼                  ▼                  ▼
    Terminal         Browser Display     JSON Response
```

## Shared Validation Engine

### Location
```
lib/validation-engine.js
```

### Exports
```javascript
module.exports = {
    runValidation,           // Main validation function
    getAvailableValidators,  // List of validators
    getCommonFields,         // Common field definitions
    filterBySeverity        // Filter results by severity
};
```

### Usage

#### 1. CLI Tool
```javascript
const validationEngine = require('./lib/validation-engine');

const results = validationEngine.runValidation(apiSpec, {
    strategy: 'inline',
    minSeverity: 'warning',
    validators: 'all',
    fileName: 'api.yaml'
});
```

#### 2. Spring Boot Backend
```java
// In Java, you would:
// 1. Port validators to Java
// 2. Use same validation logic
// 3. Return same JSON structure

// Or call Node.js validation engine:
ProcessBuilder pb = new ProcessBuilder(
    "node", "lib/validation-engine.js", "--json"
);
```

#### 3. Web Frontend (Two Options)

**Option A: Bundle with Browserify/Webpack**
```bash
# Bundle validators for browser
npm install -g browserify
browserify lib/validation-engine.js -o web/frontend/validation-bundle.js

# Then in frontend:
<script src="validation-bundle.js"></script>
<script>
const results = runValidation(apiSpec, options);
</script>
```

**Option B: Call Spring Boot API** (Recommended)
```javascript
const response = await fetch('http://localhost:8080/api/v1/validate', {
    method: 'POST',
    body: JSON.stringify({ apiSpec, strategy, minSeverity })
});
const results = await response.json();
```

## Benefits of Shared Engine

### ✅ Single Source of Truth
- Validators defined once
- Common fields loaded from one file (`common.yaml`)
- Changes propagate everywhere

### ✅ Consistent Results
- CLI and web give identical results
- Same validation rules everywhere
- Predictable behavior

### ✅ Easy Maintenance
- Update one validator file
- Add new validators once
- Fix bugs in one place

### ✅ Testable
- Test validators in isolation
- Mock common fields easily
- Integration tests across all interfaces

## Data Flow

### CLI Execution
```
1. User runs: node api-linter-cli.js api.yaml
2. CLI loads YAML file
3. CLI calls validationEngine.runValidation()
4. Engine runs all 11 validators
5. Engine filters by severity
6. CLI formats output (text/json/summary)
7. CLI prints to terminal
```

### Web Frontend (Browser)
```
1. User uploads YAML file
2. Browser parses YAML with js-yaml
3. Frontend calls Spring Boot API
4. Spring Boot calls validation engine
5. Spring Boot returns JSON results
6. Frontend displays in UI
```

### Web Frontend (Local - Development)
```
1. User uploads YAML file
2. Browser parses YAML with js-yaml
3. Frontend runs bundled validators
4. Results displayed immediately
5. No backend needed
```

## Common.yaml

### Single Definition File
```yaml
# common.yaml - Single source of truth
components:
  schemas:
    UserID:
      type: string
      description: "Unique identifier for a user."
      example: "usr_abc123"
    
    CurrencyCode:
      type: string
      pattern: "^[A-Z]{3}$"
      minLength: 3
      maxLength: 3
      description: "ISO 4217 currency code."
      example: "USD"
```

### Auto-Loading
```javascript
// lib/utils/commonFieldRegistry.js
// Loads common.yaml automatically at startup
// Creates case-insensitive mappings

const registry = {
  'UserID': { type: 'string', ... },
  'user_id': { type: 'string', ... },  // snake_case
  'userId': { type: 'string', ... },   // camelCase
  'userid': { type: 'string', ... }    // lowercase
};
```

### Used By All Validators
- CLI: Loads at runtime
- Web: Bundled or fetched from backend
- Spring Boot: Loaded from resources/

## Validation Flow

### Input
```javascript
{
  apiSpec: { openapi: "3.0.3", ... },
  strategy: "inline",
  minSeverity: "warning",
  validators: "all",
  fileName: "api.yaml"
}
```

### Processing
```javascript
1. Load common.yaml (29 schemas)
2. Determine which validators to run
3. For each validator:
   - Check apiSpec
   - Add results to array
4. Filter by minSeverity
5. Calculate summary statistics
```

### Output
```javascript
{
  file: "api.yaml",
  strategy: "inline",
  timestamp: "2025-12-04T10:30:00Z",
  summary: {
    total: 25,
    errors: 5,
    warnings: 15,
    info: 5
  },
  results: [
    {
      level: "error",
      validator: "validateDescriptions",
      message: "Field 'data' is missing description.",
      location: "/flights.get.responses.200.data",
      suggestion: "Add a description for field 'data'."
    }
  ],
  metadata: {
    duration: 234,
    validatorsRun: 11,
    commonFieldsLoaded: 29
  }
}
```

## Adding New Validators

### 1. Create Validator File
```javascript
// lib/validators/validateNewThing.js
module.exports = function validateNewThing(apiSpec, addResult) {
    // Check something
    if (issue) {
        addResult(
            'error',
            'Something is wrong',
            'location.in.spec',
            'Fix it like this'
        );
    }
};
```

### 2. Register in Engine
```javascript
// lib/validation-engine.js
const validateNewThing = require('./validators/validateNewThing');

// In runValidation():
if (validatorsToRun.includes('newThing')) {
    validateNewThing(apiSpec, addResult);
}

// In getValidatorsToRun():
const allValidators = [
    'descriptions',
    'commonFields',
    // ... existing
    'newThing'  // Add here
];
```

### 3. Done!
- Works in CLI automatically
- Works in web automatically
- Works in Spring Boot automatically

## Testing Strategy

### Unit Tests
```javascript
// test/validators/validateDescriptions.test.js
const { runValidation } = require('../lib/validation-engine');

test('detects missing descriptions', () => {
    const apiSpec = {
        openapi: '3.0.3',
        info: { title: 'Test' }  // Missing description
    };
    
    const results = runValidation(apiSpec, {
        validators: ['descriptions']
    });
    
    expect(results.summary.errors).toBeGreaterThan(0);
});
```

### Integration Tests
```bash
# Test CLI
node api-linter-cli.js test-api.yaml --format=json > output.json
# Verify output.json

# Test Web
npm start
# Open browser, upload file, check results

# Test Backend
curl -X POST http://localhost:8080/api/v1/validate \
  -d '{"apiSpec": {...}}' \
  | jq '.summary'
```

## Performance

### Benchmarks
- **Small API** (< 50 endpoints): < 100ms
- **Medium API** (50-200 endpoints): < 500ms
- **Large API** (200+ endpoints): < 1s

### Optimization
- Validators run sequentially (easy to parallelize)
- Common.yaml loaded once at startup
- Results filtered after all validators run
- No file I/O during validation (all in memory)

## Deployment Scenarios

### Scenario 1: CLI Only
```bash
npm install
node api-linter-cli.js api.yaml
```

### Scenario 2: Web Frontend + Spring Boot
```bash
# Terminal 1: Spring Boot
cd web/backend-api
./mvnw spring-boot:run

# Terminal 2: Frontend
cd web
npm start
```

### Scenario 3: Docker All-in-One
```bash
docker-compose up
# CLI, Web, Backend, Redis, PostgreSQL
```

### Scenario 4: Serverless
```bash
# Package validators as Lambda
zip -r validators.zip lib/
aws lambda create-function --zip-file fileb://validators.zip
```

## Best Practices

### ✅ DO
- Use `validation-engine.runValidation()` for consistency
- Add new fields to `common.yaml` only
- Write validators in pure functions
- Filter by severity at the end
- Return structured results

### ❌ DON'T
- Don't duplicate validation logic
- Don't hardcode common fields in validators
- Don't format results inside validators
- Don't use file I/O in validators
- Don't throw exceptions (use addResult)

## Troubleshooting

### Common.yaml not loading
```bash
# Check file exists
ls -la common.yaml

# Check registry
const registry = require('./lib/utils/commonFieldRegistry');
console.log(registry.getFieldCount());  // Should be 29
```

### Validators not running
```javascript
// Check validator list
const engine = require('./lib/validation-engine');
console.log(engine.getAvailableValidators());
```

### Different results in CLI vs Web
```bash
# Ensure same version
git status

# Check strategy and severity
node api-linter-cli.js api.yaml --strategy=inline --severity=warning
# Should match web settings
```

## Future Enhancements

### Planned
- [ ] Parallel validator execution
- [ ] Custom validator plugins
- [ ] Performance profiling
- [ ] Caching validation results
- [ ] Progressive validation (stop on first error)

### Experimental
- [ ] AI-powered suggestions
- [ ] Auto-fix common issues
- [ ] Diff validation (before/after)
- [ ] Team-specific rules

---

**Document Version:** 1.0.0  
**Last Updated:** December 4, 2025  
**Maintained By:** Sathya Prakash MC

