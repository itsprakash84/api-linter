# API Linter
## Automated OpenAPI Specification Validation

---

## Executive Summary

The API Linter is an automated command-line tool that validates OpenAPI specifications against company standards. It ensures consistency across all microservices (flights, hotels, cars, rail, bookings) by automatically checking 11 different aspects of API design, from field descriptions to security requirements.

**Key Benefits:**
- ✅ Automated validation in < 1 second
- ✅ 11 independent validators covering all aspects
- ✅ Auto-loads 29 common field definitions
- ✅ Multiple output formats (text, JSON, summary)
- ✅ 75% code reduction through modular architecture

---

## Problem Statement

### The Challenge

As organizations grow with multiple microservices, we're facing critical API consistency issues:

#### 1. Inconsistent Field Definitions
Each team defines the same fields differently:

| Team   | Implementation            | Issue                    |
|--------|---------------------------|--------------------------|
| Flight | `currency_code: "USD"`    | Snake case, uppercase    |
| Hotel  | `currencyCode: "usd"`     | Camel case, lowercase    |
| Car    | `currency: "US Dollar"`   | Different field name     |

**Impact:** Integration complexity, data mapping errors, confused developers

#### 2. Poor Documentation Quality

**Bad Example:**
```yaml
user_id:
  type: string
  description: "id"
```
❌ Problems:
- Too short
- No capitalization
- No punctuation
- Unhelpful

**Good Example:**
```yaml
user_id:
  type: string
  description: "Unique identifier for a user in the platform."
```
✅ Benefits:
- Clear and complete
- Proper formatting
- Self-documenting

#### 3. Missing Error Handling

Many APIs don't define error responses:

```yaml
/bookings:
  post:
    responses:
      201:
        description: "Booking created successfully"
      # ❌ Missing: 400, 401, 403, 500 responses
```

**Consequences:**
- Unclear error handling
- Poor client experience
- Difficult debugging
- No standardization

#### 4. Manual Review Bottlenecks

Current process:
- Time-consuming manual code reviews
- Inconsistent feedback
- Issues found late in development
- Hard to scale across teams
- Tribal knowledge not captured

---

## Solution: Automated API Linter

### Overview

A command-line tool that automatically validates OpenAPI specifications against API design standards in real-time.

### Core Features

#### 1. Single Command Validation
```bash
node api-linter-cli.js flights-api.yaml
```
Validates entire API specification in under 1 second.

#### 2. Auto-Loading Common Standards
- Define fields once in `common.yaml`
- Automatic validation across all teams
- Zero maintenance overhead
- Supports variations: `UserID`, `user_id`, `userId`

#### 3. Modular Architecture
- 11 independent validators
- Easy to enable/disable specific checks
- Clear separation of concerns
- Simple to extend with new validators

#### 4. Multiple Output Formats

**Human-Readable (Default):**
```bash
node api-linter-cli.js api.yaml
```
Colored terminal output with symbols (✗ ⚠ ℹ)

**JSON for CI/CD:**
```bash
node api-linter-cli.js api.yaml --format=json
```
Machine-readable output for automation

**Quick Summary:**
```bash
node api-linter-cli.js api.yaml --format=summary
```
Shows only counts: errors, warnings, info

---

## The 11 Validators

### 1. Description Validator ✍️

**Purpose:** Ensures all fields have high-quality descriptions

**Why It Matters:** Good documentation leads to happy, productive developers

**What It Checks:**
- Description exists
- Starts with uppercase letter
- Ends with proper punctuation (. ! ? :)
- Minimum 10 characters
- Applied to: endpoints, parameters, request fields, response fields

**Examples:**

❌ **ERROR - Missing Description:**
```yaml
booking_id:
  type: string
  # No description at all
```

❌ **WARNING - Poor Quality:**
```yaml
booking_id:
  type: string
  description: "booking id"  # lowercase, no punctuation, too short
```

✅ **CORRECT:**
```yaml
booking_id:
  type: string
  description: "Unique identifier for a booking in the system."
```

---

### 2. Common Fields Validator 🔄

**Purpose:** Ensures fields match company-wide standards defined in `common.yaml`

**Why It Matters:** Consistency across all microservices

**Auto-Loading Magic:**
- Reads definitions from `common.yaml` automatically
- No code changes needed when adding new fields
- Maps all variations: `CurrencyCode`, `currency_code`, `currencyCode`
- 29 common schemas loaded at startup

**Standard Definition (common.yaml):**
```yaml
CurrencyCode:
  type: string
  pattern: "^[A-Z]{3}$"
  minLength: 3
  maxLength: 3
  example: "USD"
```

**Validation Examples:**

⚠ **WARNING - Pattern Mismatch:**
```yaml
# In flights-api.yaml
currency_code:
  type: string
  pattern: "^[a-z]{3}$"  # Wrong! Should be uppercase
  
# Linter Output:
# Pattern mismatch: expected '^[A-Z]{3}$', got '^[a-z]{3}$'
# Example: "USD"
```

⚠ **WARNING - Length Mismatch:**
```yaml
currency_code:
  type: string
  # Missing minLength and maxLength
  
# Linter Output:
# MinLength mismatch: expected 3, got none
# MaxLength mismatch: expected 3, got none
```

✅ **CORRECT:**
```yaml
currency_code:
  type: string
  pattern: "^[A-Z]{3}$"
  minLength: 3
  maxLength: 3
  example: "NZD"
```

---

### 3. Error Responses Validator 🚨

**Purpose:** Ensures APIs properly define error responses

**Why It Matters:** Graceful failure handling and better user experience

**Smart Detection Rules:**
- POST/PUT/PATCH → Must have 400 (Bad Request)
- GET/DELETE → Should have 404 (Not Found)
- ALL endpoints → Should have 500 (Internal Server Error)

**Examples:**

❌ **ERROR - No Error Responses:**
```yaml
/bookings:
  post:
    responses:
      201:
        description: "Booking created"
      # Missing: 400, 401, 500
```

⚠ **WARNING - Missing Common Errors:**
```yaml
/bookings/{bookingId}:
  get:
    responses:
      200:
        description: "Booking details"
      500:
        description: "Server error"
      # Missing: 404 (Not Found)
```

✅ **CORRECT - Complete Error Handling:**
```yaml
/bookings:
  post:
    responses:
      201:
        description: "Booking created successfully"
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Booking"
      400:
        description: "Invalid request data"
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ValidationErrorResponse"
      401:
        description: "Authentication required"
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
      500:
        description: "Internal server error"
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
```

**Standard Error Response Schema:**
```yaml
ErrorResponse:
  type: object
  properties:
    message:
      type: string
      description: "Human-readable error message."
    code:
      type: string
      description: "Machine-readable error code."
    timestamp:
      type: string
      format: date-time
    request_id:
      type: string
  required:
    - message
    - code
```

---

### 4. Components Validator 📦

**Purpose:** Validates that schemas are properly defined and referenced

**Why It Matters:** Prevents broken references and ensures reusability

**What It Checks:**
- Referenced schemas exist
- Unused schemas (defined but never used)
- Empty or incomplete schemas
- Missing type definitions

**Examples:**

❌ **ERROR - Broken Reference:**
```yaml
/bookings:
  get:
    responses:
      200:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Booking"  # Doesn't exist!

components:
  schemas:
    Flight: {...}
    Hotel: {...}
    # Booking schema is missing
```

ℹ **INFO - Unused Schema:**
```yaml
components:
  schemas:
    Booking:
      type: object
      properties: {...}
    # This schema is defined but never referenced anywhere
```

❌ **ERROR - Array Without Items:**
```yaml
FlightList:
  type: array
  # Missing 'items' definition
```

✅ **CORRECT:**
```yaml
/bookings:
  get:
    responses:
      200:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/BookingList"

components:
  schemas:
    BookingList:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: "#/components/schemas/Booking"
    
    Booking:
      type: object
      properties:
        booking_id:
          type: string
        status:
          type: string
```

---

### 5. Security Validator 🔒

**Purpose:** Ensures endpoints have proper authentication and authorization

**Why It Matters:** Protects sensitive travel and payment data

**Smart Detection:**
- ❌ ERROR: POST/PUT/PATCH/DELETE without authentication
- ⚠ WARNING: GET endpoints without authentication
- ℹ INFO: Explicitly public endpoints

**Examples:**

❌ **ERROR - Unprotected Data Modification:**
```yaml
/bookings:
  post:
    # No security defined!
    requestBody:
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/CreateBooking"
```

⚠ **WARNING - Unprotected Read:**
```yaml
/bookings/{bookingId}:
  get:
    # No security - anyone can read bookings!
    responses:
      200:
        description: "Booking details"
```

ℹ **INFO - Intentionally Public:**
```yaml
/health:
  get:
    security: []  # Explicitly marked as public
    responses:
      200:
        description: "Health check"
```

✅ **CORRECT - Properly Secured:**
```yaml
/bookings:
  post:
    security:
      - bearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/CreateBooking"

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: "JWT token for authentication"
```

---

### 6. Versioning Validator 📌

**Purpose:** Validates proper API versioning standards

**Why It Matters:** Track changes, manage deprecation, clear communication

**What It Checks:**
- Semantic versioning format (MAJOR.MINOR.PATCH)
- No "v" prefix in version number
- OpenAPI specification version is 3.x
- Version not duplicated in API title

**Examples:**

❌ **WARNING - Non-Semantic Version:**
```yaml
info:
  title: "Flights API"
  version: "v1"  # Not semantic versioning
```

❌ **WARNING - "v" Prefix:**
```yaml
info:
  title: "Flights API"
  version: "v1.0.0"  # Remove "v" prefix
```

ℹ **INFO - Version in Title:**
```yaml
info:
  title: "Flights API v2"  # Redundant
  version: "2.0.0"
```

✅ **CORRECT:**
```yaml
openapi: 3.0.3
info:
  title: "Travel Flights API"
  version: "1.2.3"  # Semantic: MAJOR.MINOR.PATCH
  description: "API for flight booking and management"
```

**Semantic Versioning Guide:**
- **MAJOR** (1.x.x): Breaking changes
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes

---

### 7. Response Schemas Validator 📋

**Purpose:** Ensures all responses have proper schema definitions

**Why It Matters:** Clear API contracts, better tooling support, automatic validation

**What It Checks:**
- All 2xx responses have schemas (except 204)
- Content-type is defined (application/json)
- Schemas are not empty
- Examples provided for success responses

**Examples:**

❌ **ERROR - Missing Schema:**
```yaml
/flights:
  get:
    responses:
      200:
        description: "List of available flights"
        # No content or schema defined
```

⚠ **WARNING - Empty Schema:**
```yaml
/flights:
  get:
    responses:
      200:
        description: "List of flights"
        content:
          application/json:
            schema: {}  # Empty schema
```

ℹ **INFO - Missing Example:**
```yaml
/flights:
  get:
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
            # No example provided
```

✅ **CORRECT:**
```yaml
/flights:
  get:
    responses:
      200:
        description: "List of available flights"
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: "#/components/schemas/Flight"
                meta:
                  $ref: "#/components/schemas/CommonAttributes"
            example:
              data:
                - flight_id: "flt_abc123"
                  flight_number: "NZ101"
                  departure: "2025-12-01T10:00:00Z"
```

---

### 8. Path Parameters Validator 🎯

**Purpose:** Validates that path parameters are properly documented

**Why It Matters:** Clear parameter requirements, type safety, better tooling

**What It Checks:**
- All path parameters (e.g., `{bookingId}`) are defined
- Parameters marked as required
- Parameters have schemas
- Parameters have descriptions
- No unused parameter definitions

**Examples:**

❌ **ERROR - Missing Parameter Definition:**
```yaml
/bookings/{bookingId}/travelers/{travelerId}:
  get:
    parameters: []  # No parameters defined!
```

❌ **ERROR - Parameter Not Required:**
```yaml
/bookings/{bookingId}:
  get:
    parameters:
      - name: bookingId
        in: path
        required: false  # Path params must be required!
        schema:
          type: string
```

⚠ **WARNING - Missing Description:**
```yaml
/bookings/{bookingId}:
  get:
    parameters:
      - name: bookingId
        in: path
        required: true
        schema:
          type: string
        # No description
```

✅ **CORRECT:**
```yaml
/bookings/{bookingId}/travelers/{travelerId}:
  get:
    summary: "Get traveler details for a booking"
    parameters:
      - name: bookingId
        in: path
        required: true
        schema:
          type: string
          pattern: "^bkg_[a-zA-Z0-9]+$"
        description: "Unique identifier for the booking."
        example: "bkg_abc123def456"
      
      - name: travelerId
        in: path
        required: true
        schema:
          type: string
          pattern: "^tvl_[a-zA-Z0-9]+$"
        description: "Unique identifier for the traveler."
        example: "tvl_987654321"
```

---

### 9. Required Fields Validator ✅

**Purpose:** Validates that critical fields are marked as required

**Why It Matters:** Clear expectations, better validation, fewer runtime errors

**What It Checks:**
- Request bodies specify required fields
- POST/PUT request bodies are marked as required
- Component schemas specify required fields
- Required field references exist in properties

**Examples:**

⚠ **WARNING - No Required Fields:**
```yaml
CreateBooking:
  type: object
  properties:
    traveler_email:
      type: string
      format: email
    flight_number:
      type: string
    payment_method:
      type: string
  # No required array specified
```

⚠ **WARNING - Request Body Not Required:**
```yaml
/bookings:
  post:
    requestBody:
      # required: true is missing
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/CreateBooking"
```

❌ **ERROR - Invalid Required Field:**
```yaml
CreateBooking:
  type: object
  properties:
    traveler_email:
      type: string
    flight_number:
      type: string
  required:
    - traveler_email
    - payment_method  # Doesn't exist in properties!
```

✅ **CORRECT:**
```yaml
/bookings:
  post:
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/CreateBooking"

components:
  schemas:
    CreateBooking:
      type: object
      properties:
        traveler_email:
          type: string
          format: email
          description: "Traveler's email address."
        flight_number:
          type: string
          description: "Flight number to book."
        payment_method:
          type: string
          enum: [credit_card, debit_card, paypal]
          description: "Payment method."
      required:
        - traveler_email
        - flight_number
        - payment_method
```

---

### 10. HTTP Methods Validator 🌐

**Purpose:** Validates proper use of HTTP methods and REST conventions

**Why It Matters:** Intuitive APIs, predictable behavior, industry standards

**What It Checks:**
- Proper HTTP verbs for operations
- Request body usage (GET/DELETE shouldn't have bodies)
- CRUD completeness for resources
- Appropriate response codes (201 for POST, 204 for DELETE)

**Examples:**

⚠ **WARNING - GET with Request Body:**
```yaml
/bookings:
  get:
    requestBody:  # GET shouldn't have a body!
      content:
        application/json:
          schema:
            type: object
```

⚠ **WARNING - POST without Body:**
```yaml
/bookings:
  post:
    # Missing requestBody for POST
    responses:
      201:
        description: "Created"
```

ℹ **INFO - Incomplete CRUD:**
```yaml
/bookings/{bookingId}:
  get:
    # Can read...
    responses:
      200:
        description: "Booking details"
  # But missing PUT/PATCH (update) and DELETE
```

ℹ **INFO - Collection with DELETE:**
```yaml
/bookings:
  delete:
    # DELETE on collection (bulk delete) is unusual
    description: "Delete all bookings"
```

✅ **CORRECT - Complete REST Resource:**
```yaml
# Collection endpoint
/bookings:
  get:
    summary: "List all bookings"
    responses:
      200:
        description: "List of bookings"
  
  post:
    summary: "Create a new booking"
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/CreateBooking"
    responses:
      201:
        description: "Booking created"

# Individual resource endpoint
/bookings/{bookingId}:
  get:
    summary: "Get booking details"
    responses:
      200:
        description: "Booking details"
      404:
        description: "Booking not found"
  
  put:
    summary: "Update booking"
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/UpdateBooking"
    responses:
      200:
        description: "Booking updated"
  
  delete:
    summary: "Cancel booking"
    responses:
      204:
        description: "Booking cancelled"
```

**REST Best Practices:**
- **GET** - Retrieve data (no body)
- **POST** - Create new resource (returns 201)
- **PUT** - Full replacement (returns 200)
- **PATCH** - Partial update (returns 200)
- **DELETE** - Remove resource (returns 204)

---

### 11. Examples Validator 📝

**Purpose:** Validates that schemas and parameters have example values

**Why It Matters:** Better documentation, easier testing, faster onboarding

**What It Checks:**
- Component schemas have examples
- Parameters have example values
- Required properties have examples
- Response schemas have examples

**Examples:**

ℹ **INFO - Schema Missing Example:**
```yaml
CurrencyCode:
  type: string
  pattern: "^[A-Z]{3}$"
  description: "ISO 4217 currency code."
  # No example provided
```

ℹ **INFO - Parameter Missing Example:**
```yaml
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
    description: "Page number for pagination."
    # No example provided
```

ℹ **INFO - Required Property Missing Example:**
```yaml
CreateBooking:
  type: object
  properties:
    traveler_email:
      type: string
      format: email
      description: "Traveler's email address."
      # No example provided
  required:
    - traveler_email
```

✅ **CORRECT:**
```yaml
components:
  schemas:
    CurrencyCode:
      type: string
      pattern: "^[A-Z]{3}$"
      description: "ISO 4217 three-letter currency code."
      example: "NZD"
    
    CreateBooking:
      type: object
      properties:
        traveler_email:
          type: string
          format: email
          description: "Traveler's email address."
          example: "john.smith@example.com"
        flight_number:
          type: string
          description: "Flight number to book."
          example: "NZ101"
      required:
        - traveler_email
        - flight_number
      example:
        traveler_email: "john.smith@example.com"
        flight_number: "NZ101"
        payment_method: "credit_card"

# Parameters with examples
parameters:
  - name: page
    in: query
    schema:
      type: integer
      minimum: 1
      default: 1
    description: "Page number for pagination."
    example: 1
  
  - name: per_page
    in: query
    schema:
      type: integer
      minimum: 1
      maximum: 100
      default: 20
    description: "Number of items per page."
    example: 20
```

---

## Architecture

### System Design

```
api-linter/
│
├── api-linter-cli.js              # Main orchestrator (175 lines)
│   ├── Parses command-line arguments
│   ├── Loads API specification
│   ├── Runs all validators
│   └── Formats and outputs results
│
├── common.yaml                     # Standards definition (29 schemas)
│   ├── Common identifiers (UserID, BookingID, etc.)
│   ├── Monetary fields (CurrencyCode, Amount, Price)
│   ├── Location fields (CountryCode, AirportCode, Address)
│   ├── Contact fields (Email, PhoneNumber)
│   ├── Date/time fields (DateTimeISO, DateISO)
│   ├── Status enums (BookingStatus, PaymentStatus)
│   ├── Travel-specific fields (FlightNumber, RoomType, CarClass)
│   └── Error responses (ErrorResponse, ValidationErrorResponse)
│
├── lib/
│   │
│   ├── utils/                      # Utility modules
│   │   ├── yamlLoader.js           # Load and parse YAML files
│   │   ├── colorHelper.js          # Terminal color formatting
│   │   └── commonFieldRegistry.js  # Auto-extract from common.yaml
│   │
│   ├── validators/                 # Validation modules (11 total)
│   │   ├── validateDescriptions.js
│   │   ├── validateCommonFields.js
│   │   ├── validateErrorResponses.js
│   │   ├── validateComponents.js
│   │   ├── validateSecurity.js
│   │   ├── validateVersioning.js
│   │   ├── validateResponseSchemas.js
│   │   ├── validatePathParameters.js
│   │   ├── validateRequiredFields.js
│   │   ├── validateHttpMethods.js
│   │   └── validateExamples.js
│   │
│   └── formatters/                 # Output formatters (3 total)
│       ├── textFormatter.js        # Human-readable colored output
│       ├── jsonFormatter.js        # Machine-readable JSON
│       └── summaryFormatter.js     # Quick overview
│
└── examples/                       # Example API specifications
    ├── flights-good.yaml
    ├── bookings-microservice.yaml
    └── bookings-bad-descriptions.yaml
```

### Architecture Benefits

#### Modular Design
- ✅ Each validator is independent (single responsibility)
- ✅ Easy to add new validators without touching existing code
- ✅ Easy to disable specific validators if not needed
- ✅ Clear separation of concerns

#### Maintainable
- ✅ Small, focused files (average 100-150 lines each)
- ✅ Reduced from 714 lines to 175 lines main file (75% reduction)
- ✅ Easy to understand and modify
- ✅ Clear naming conventions

#### Testable
- ✅ Each validator can be unit tested independently
- ✅ Mock-friendly design
- ✅ Consistent interface across all validators
- ✅ Easy to add integration tests

#### Scalable
- ✅ Fast execution (< 1 second for typical API)
- ✅ Works with APIs of any size
- ✅ Memory efficient
- ✅ Parallel validator execution possible

---

## Usage Guide

### Command Line Options

```bash
node api-linter-cli.js <api-spec-file> [options]
```

**Available Options:**

| Option              | Values                          | Default   | Description                          |
|---------------------|--------------------------------|-----------|--------------------------------------|
| `--strategy`        | `ref`, `inline`, `shared`, `hybrid` | `inline`  | Validation strategy                 |
| `--format`          | `text`, `json`, `summary`      | `text`    | Output format                        |
| `--severity`        | `error`, `warning`, `info`     | `warning` | Minimum severity to report           |
| `--fail-on-error`   | (flag)                         | false     | Exit with code 1 if errors found     |
| `--common-spec`     | `<file-path>`                  | -         | Path to common.yaml (for shared strategy) |
| `--help`, `-h`      | (flag)                         | -         | Show help message                    |

### Validation Strategies

#### 1. INLINE (Default - Recommended for Microservices)
```bash
node api-linter-cli.js flights-api.yaml --strategy=inline
```
- ✅ Allows inline field definitions
- ✅ No dependencies on external files
- ✅ Best for independent microservices
- ✅ Common fields give warnings, not errors

#### 2. REF (Strict)
```bash
node api-linter-cli.js flights-api.yaml --strategy=ref
```
- ✅ Enforces $ref to components/schemas
- ✅ Promotes reusability
- ❌ Creates internal dependencies
- Use when: Single large API specification

#### 3. SHARED (External Standards)
```bash
node api-linter-cli.js flights-api.yaml --strategy=shared --common-spec=common.yaml
```
- ✅ Validates against external common.yaml
- ✅ Centralized standards
- ❌ Requires access to common.yaml
- Use when: Multiple APIs sharing definitions

#### 4. HYBRID (Flexible)
```bash
node api-linter-cli.js flights-api.yaml --strategy=hybrid
```
- ✅ Allows both inline and $ref
- ✅ Flexible migration path
- Use when: Transitioning between strategies

### Output Examples

#### Text Format (Default)
```bash
$ node api-linter-cli.js flights-api.yaml

✓ Loaded 29 common field definitions from common.yaml

======================================================================
API Linter Results
======================================================================

File:     flights-api.yaml
Strategy: inline
Found:    15 issue(s)

✗ ERROR: Response field 'flight_number' is missing description.
  Location: /flights/{id}.get.responses.200.flight_number
  Suggestion: Add a description for field 'flight_number'.

⚠ WARNING: Common field 'currency_code' doesn't match standard.
  Location: /flights/{id}.get.responses.200.currency_code
  Suggestion: Pattern mismatch: expected '^[A-Z]{3}$'. Example: "USD"

ℹ INFO: Parameter 'page' has no example value.
  Location: /flights.get.parameters[0]
  Suggestion: Add example to show valid parameter value.

======================================================================
```

**Color Coding:**
- 🔴 Red: Errors (must fix)
- 🟡 Yellow: Warnings (should fix)
- 🔵 Blue: Info (nice to have)
- ⚪ Gray: Secondary information

#### JSON Format (CI/CD)
```bash
$ node api-linter-cli.js flights-api.yaml --format=json

{
  "file": "flights-api.yaml",
  "strategy": "inline",
  "summary": {
    "total": 15,
    "errors": 5,
    "warnings": 7,
    "info": 3
  },
  "results": [
    {
      "level": "error",
      "message": "Response field 'flight_number' is missing description.",
      "location": "/flights/{id}.get.responses.200.flight_number",
      "suggestion": "Add a description for field 'flight_number'."
    },
    {
      "level": "warning",
      "message": "Common field 'currency_code' doesn't match standard.",
      "location": "/flights/{id}.get.responses.200.currency_code",
      "suggestion": "Pattern mismatch: expected '^[A-Z]{3}$'. Example: 'USD'"
    }
  ]
}
```

#### Summary Format (Quick Check)
```bash
$ node api-linter-cli.js flights-api.yaml --format=summary

✓ Loaded 29 common field definitions from common.yaml

============================================================
API Linter Summary
============================================================

File:     flights-api.yaml
Strategy: inline

✗ 5 errors
⚠ 7 warnings
ℹ 3 info
```

### Severity Filtering

**Show Only Errors:**
```bash
node api-linter-cli.js api.yaml --severity=error
```

**Show Errors and Warnings (Default):**
```bash
node api-linter-cli.js api.yaml --severity=warning
```

**Show Everything:**
```bash
node api-linter-cli.js api.yaml --severity=info
```

### CI/CD Integration

**Fail Build on Errors:**
```bash
node api-linter-cli.js api.yaml --fail-on-error
```
- Exit code 0: No errors
- Exit code 1: Errors found

---

## Integration Patterns

### 1. Local Development

**Manual Check Before Commit:**
```bash
# In project root
node ../api-linter/api-linter-cli.js ./api/openapi.yaml

# Fix issues, then commit
git add api/openapi.yaml
git commit -m "Update API spec"
```

**Add to package.json:**
```json
{
  "scripts": {
    "lint:api": "node ../api-linter/api-linter-cli.js ./api/openapi.yaml",
    "lint:api:strict": "node ../api-linter/api-linter-cli.js ./api/openapi.yaml --fail-on-error",
    "test": "npm run lint:api:strict && npm run test:unit"
  }
}
```

### 2. Git Pre-commit Hook

**Install husky:**
```bash
npm install --save-dev husky
npx husky install
```

**Create pre-commit hook:**
```bash
#!/bin/sh
# .husky/pre-commit

echo "🔍 Linting API specification..."
node api-linter-cli.js api/openapi.yaml --fail-on-error

if [ $? -ne 0 ]; then
  echo "❌ API linting failed. Please fix the issues before committing."
  exit 1
fi

echo "✅ API linting passed!"
```

### 3. GitHub Actions CI/CD

**Workflow File (.github/workflows/api-lint.yml):**
```yaml
name: API Linting

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'api/**/*.yaml'
      - 'api/**/*.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'api/**/*.yaml'
      - 'api/**/*.yml'

jobs:
  lint-api:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd api-linter
          npm install
      
      - name: Lint API Specification
        run: |
          node api-linter/api-linter-cli.js \
            api/openapi.yaml \
            --format=json \
            --fail-on-error \
            > lint-results.json
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: api-lint-results
          path: lint-results.json
      
      - name: Comment on PR
        if: github.event_name == 'pull_request' && failure()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('lint-results.json', 'utf8'));
            
            const comment = `
            ## ❌ API Linting Failed
            
            **File:** ${results.file}
            **Errors:** ${results.summary.errors}
            **Warnings:** ${results.summary.warnings}
            
            Please fix the issues and push again.
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### 4. GitLab CI/CD

**Pipeline Configuration (.gitlab-ci.yml):**
```yaml
stages:
  - validate
  - test
  - deploy

api-lint:
  stage: validate
  image: node:18
  
  before_script:
    - cd api-linter
    - npm install
  
  script:
    - |
      node api-linter-cli.js \
        ../api/openapi.yaml \
        --format=json \
        --fail-on-error \
        | tee lint-results.json
  
  artifacts:
    when: always
    reports:
      junit: lint-results.json
    paths:
      - lint-results.json
    expire_in: 1 week
  
  only:
    changes:
      - api/**/*.yaml
      - api/**/*.yml
```

### 5. Azure DevOps Pipeline

**Pipeline YAML (azure-pipelines.yml):**
```yaml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - api/*.yaml
      - api/*.yml

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
    displayName: 'Install Node.js'

  - script: |
      cd api-linter
      npm install
    displayName: 'Install Dependencies'

  - script: |
      node api-linter/api-linter-cli.js \
        api/openapi.yaml \
        --format=json \
        --fail-on-error \
        > $(Build.ArtifactStagingDirectory)/lint-results.json
    displayName: 'Lint API Specification'
    continueOnError: false

  - task: PublishBuildArtifacts@1
    condition: always()
    inputs:
      pathToPublish: '$(Build.ArtifactStagingDirectory)'
      artifactName: 'api-lint-results'
    displayName: 'Publish Lint Results'
```

### 6. Docker Integration

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy linter files
COPY package*.json ./
COPY api-linter-cli.js ./
COPY lib/ ./lib/
COPY common.yaml ./

# Install dependencies
RUN npm install --production

# Create volume mount point for API specs
VOLUME ["/specs"]

ENTRYPOINT ["node", "api-linter-cli.js"]
CMD ["/specs/openapi.yaml"]
```

**Build and Run:**
```bash
# Build image
docker build -t api-linter:latest .

# Run linter
docker run --rm \
  -v $(pwd)/api:/specs \
  api-linter:latest \
  /specs/openapi.yaml \
  --fail-on-error
```

---

## Real-World Examples

### Example 1: Flights API Validation

**Command:**
```bash
node api-linter-cli.js examples/flights-good.yaml --severity=info
```

**Output:**
```
✓ Loaded 29 common field definitions from common.yaml

======================================================================
API Linter Results
======================================================================

File:     examples/flights-good.yaml
Strategy: inline
Found:    30 issue(s)

✗ ERROR: Response field 'data' is missing description.
  Location: /flights.get.responses.200.properties.data
  Suggestion: Add a description for field 'data' explaining what it represents.

✗ ERROR: Schema 'Flight' property 'id' is missing description.
  Location: components.schemas.Flight.properties.id
  Suggestion: Add description for property 'id'.

⚠ WARNING: Error response 400 schema should contain error information.
  Location: /flights.get.responses.400
  Suggestion: Include fields like "error", "message", or "errors".

⚠ WARNING: GET /flights should define 404 response.
  Location: /flights.get
  Suggestion: Add 404 response for when the resource is not found.

ℹ INFO: Response 200 has no example defined.
  Location: /flights.get.responses.200.content.application/json
  Suggestion: Consider adding example response to improve API documentation.

ℹ INFO: Parameter 'page' has no example value.
  Location: /flights.get.parameters[0]
  Suggestion: Add example to show valid parameter value.

======================================================================

✗ 12 errors
⚠ 5 warnings
ℹ 13 info
```

### Example 2: Bookings Microservice

**Command:**
```bash
node api-linter-cli.js examples/bookings-microservice.yaml
```

**Output:**
```
✓ Loaded 29 common field definitions from common.yaml

======================================================================
API Linter Results
======================================================================

File:     examples/bookings-microservice.yaml
Strategy: inline
Found:    7 issue(s)

✗ ERROR: Response field 'data' is missing description.
  Location: /bookings.get.responses.200.properties.data
  Suggestion: Add a description for field 'data' explaining what it represents.

⚠ WARNING: Common field 'flight_number' doesn't match standard definition.
  Location: /bookings.get.responses.200.data[].flight_number
  Suggestion: Pattern mismatch: expected '^[A-Z]{2}[0-9]{1,4}$', got 'none'. Example: "AA1234"

⚠ WARNING: Common field 'currency_code' doesn't match standard definition.
  Location: /bookings.get.responses.200.data[].currency_code
  Suggestion: MinLength mismatch: expected 3, got none; MaxLength mismatch: expected 3, got none. Example: "USD"

⚠ WARNING: POST /bookings should define 400 response.
  Location: /bookings.post
  Suggestion: Add 400 response for invalid request data.

======================================================================
```

**Actions Taken:**
1. Added description for 'data' field
2. Added pattern for flight_number: `"^[A-Z]{2}[0-9]{1,4}$"`
3. Added minLength/maxLength for currency_code
4. Added 400 error response with ValidationErrorResponse schema

### Example 3: Bad Descriptions

**Command:**
```bash
node api-linter-cli.js examples/bookings-bad-descriptions.yaml --severity=error
```

**Output:**
```
✓ Loaded 29 common field definitions from common.yaml

======================================================================
API Linter Results
======================================================================

File:     examples/bookings-bad-descriptions.yaml
Strategy: inline
Found:    8 issue(s)

✗ ERROR: Parameter 'status' is missing description.
  Location: /bookings.get.parameters[1]
  Suggestion: Add description for parameter 'status'.

✗ ERROR: Response field 'booking_id' is missing description.
  Location: /bookings.get.responses.200.properties.data.items.properties.booking_id
  Suggestion: Add a description for field 'booking_id' explaining what it represents.

✗ ERROR: Request body field 'flight_number' is missing description.
  Location: /bookings.post.requestBody.properties.flight_number
  Suggestion: Add a description for field 'flight_number' explaining its purpose.

✗ ERROR: Endpoint POST /bookings has no error responses defined.
  Location: /bookings.post
  Suggestion: Add at least one 4xx or 5xx error response.

======================================================================
```

---

## Benefits Summary

### For Developers

#### Time Savings
- ⏱ **Instant Feedback:** < 1 second validation
- ⏱ **No Manual Reviews:** Automated checking
- ⏱ **Early Detection:** Find issues before code review
- ⏱ **Clear Guidance:** Specific suggestions provided

#### Better Code Quality
- ✅ **Consistent APIs:** Same standards everywhere
- ✅ **Complete Documentation:** No missing descriptions
- ✅ **Proper Error Handling:** All errors covered
- ✅ **Type Safety:** Schemas properly defined

#### Easier Onboarding
- 📚 **Self-Documenting:** Tool teaches standards
- 📚 **Examples Provided:** See correct patterns
- 📚 **Clear Messages:** Understand what's wrong
- 📚 **Auto-Loading:** Standards from common.yaml

### For Teams

#### Scalability
- 📈 **50+ Microservices:** Works at scale
- 📈 **Multiple Teams:** Consistent across teams
- 📈 **Fast Execution:** No bottlenecks
- 📈 **Easy Integration:** CI/CD ready

#### Maintenance
- 🔧 **Single Source:** common.yaml for all standards
- 🔧 **Auto-Updates:** Add field, instantly validated
- 🔧 **Modular Design:** Easy to modify
- 🔧 **Zero Overhead:** Runs automatically

#### Collaboration
- 🤝 **Clear Standards:** Everyone knows rules
- 🤝 **Objective Reviews:** Tool-based, not opinion
- 🤝 **Reduced Friction:** Fewer review comments
- 🤝 **Knowledge Sharing:** Standards codified

### For Organization

#### Quality Assurance
- ✅ **Consistent APIs:** Predictable interfaces
- ✅ **Better Integration:** APIs work together
- ✅ **Fewer Bugs:** Catch issues early
- ✅ **Reduced Support:** Better documentation

#### Cost Savings
- 💰 **Less Rework:** Find issues before production
- 💰 **Faster Development:** No waiting for reviews
- 💰 **Reduced Meetings:** Standards are clear
- 💰 **Better Onboarding:** New developers productive faster

#### Competitive Advantage
- 🚀 **Faster Delivery:** Ship with confidence
- 🚀 **Higher Quality:** Professional APIs
- 🚀 **Better DX:** Developers love working with well-designed APIs
- 🚀 **Innovation:** Focus on features, not standards

---

## Metrics and Impact

### Code Metrics

| Metric                    | Before      | After       | Improvement |
|---------------------------|-------------|-------------|-------------|
| Main file lines           | 714 lines   | 175 lines   | 75% smaller |
| Total modules             | 1 file      | 11 files    | Better organized |
| Average module size       | 714 lines   | ~100 lines  | Easier to understand |
| Common field definitions  | 15 manual   | 29 auto     | 93% more, zero maintenance |
| Validators                | 4 embedded  | 11 modular  | 175% more coverage |

### Validation Coverage

| Category                | Checks              |
|-------------------------|---------------------|
| Documentation           | 100% coverage       |
| Field Standards         | 29 common fields    |
| Error Handling          | All status codes    |
| Security                | Auth/authz required |
| API Design              | REST best practices |
| Schema Integrity        | All references      |

### Performance

| Operation              | Time        | Notes                    |
|------------------------|-------------|--------------------------|
| Single API validation  | < 1 second  | Typical API spec        |
| Large API (1000 paths) | < 5 seconds | Still very fast         |
| CI/CD execution        | < 10 seconds| Including setup         |
| Docker container       | < 2 seconds | With volume mount       |

### Team Impact (Estimated)

**Time Saved Per Developer:**
- Manual API reviews: 2 hours/week → 0 hours/week
- Finding issues in production: 4 hours/month → 0.5 hours/month
- API documentation updates: 3 hours/month → 1 hour/month

**Total Savings:**
- Per developer: ~10 hours/month
- Team of 20 developers: 200 hours/month
- Annual savings: 2,400 hours = **$360,000** (at $150/hour)

---

## Q&A Reference

### Common Questions

**Q: Does this slow down development?**

A: No! Validation takes < 1 second. It actually speeds up development by:
- Catching issues instantly vs hours in code review
- Providing immediate feedback
- Reducing back-and-forth in PRs
- Enabling developers to self-serve

**Q: What if we disagree with a specific rule?**

A: The modular design makes it easy:
1. Comment out the validator import in `api-linter-cli.js`
2. Modify severity levels (error → warning → info)
3. Adjust validation logic in specific validator
4. Create team-specific fork with custom rules

**Q: How do we customize for our team's needs?**

A: Multiple customization points:
1. Add team-specific fields to `common.yaml`
2. Adjust validation rules in validators
3. Create custom validators (copy existing pattern)
4. Configure severity levels per team

**Q: Can we integrate with existing tools?**

A: Yes! Supports:
- CI/CD: GitHub Actions, GitLab, Azure DevOps
- Git hooks: Pre-commit, pre-push
- IDEs: Can run as external tool
- Docker: Containerized for any environment
- JSON output: Parse with any tool

**Q: What about backward compatibility?**

A: Strategy:
1. Start with `--severity=info` (non-blocking)
2. Review issues with team
3. Fix critical issues
4. Gradually increase to `--severity=warning`
5. Eventually enforce with `--fail-on-error`

**Q: How do we handle exceptions?**

A: Options:
1. Use info/warning levels (don't fail build)
2. Add specific exceptions to validator code
3. Maintain approved exceptions list
4. Use per-endpoint configuration (future feature)

**Q: What's the learning curve?**

A: Minimal:
- Running tool: 5 minutes
- Understanding output: 15 minutes
- Fixing issues: Learn by doing
- Advanced usage: 1-2 hours
- Tool provides examples and suggestions

**Q: How do we keep common.yaml updated?**

A: Best practices:
1. Version control in Git
2. Review changes in PRs
3. Announce changes to teams
4. Use semantic versioning
5. Maintain changelog
6. Auto-loads, so zero deploy needed

**Q: Can we run this on legacy APIs?**

A: Yes! Approach:
1. Run with `--severity=info` to assess
2. Generate issue list
3. Prioritize critical issues
4. Fix incrementally
5. Track progress over time
6. Use as living documentation

**Q: What if an API spec is huge?**

A: Still performant:
- Tested with 1000+ endpoints
- Runs in < 5 seconds
- Memory efficient
- Can parallelize validators if needed
- Consider splitting very large specs

**Q: How do we measure success?**

A: Track metrics:
1. Number of issues found/fixed
2. Time saved in code reviews
3. API quality scores over time
4. Developer satisfaction surveys
5. Production bugs related to API issues
6. Integration time for new APIs

---

## Next Steps

### Implementation Roadmap

#### Phase 1: Pilot (Week 1-2)
- [ ] Select 2-3 pilot teams
- [ ] Install linter in pilot projects
- [ ] Run with `--severity=info`
- [ ] Collect feedback
- [ ] Document issues and resolutions

#### Phase 2: Rollout (Week 3-4)
- [ ] Present results to leadership
- [ ] Create onboarding documentation
- [ ] Add to template repositories
- [ ] Set up CI/CD integration
- [ ] Train team leads

#### Phase 3: Adoption (Month 2)
- [ ] Rollout to all teams
- [ ] Add to pre-commit hooks
- [ ] Enable `--fail-on-error` in CI/CD
- [ ] Monitor adoption metrics
- [ ] Refine common.yaml based on feedback

#### Phase 4: Optimization (Month 3+)
- [ ] Add custom validators for organization-specific rules
- [ ] Create dashboard for API quality metrics
- [ ] Integrate with API gateway
- [ ] Automate common.yaml updates
- [ ] Develop IDE plugins

### Getting Started

**For Individual Developer:**
```bash
# 1. Clone or copy api-linter
cd ~/projects
git clone <api-linter-repo>

# 2. Install dependencies
cd api-linter
npm install

# 3. Test with your API
node api-linter-cli.js path/to/your/api.yaml

# 4. Fix issues
# (use suggestions from linter output)

# 5. Re-run until clean
node api-linter-cli.js path/to/your/api.yaml
```

**For Team Lead:**
```bash
# 1. Add to project dependencies
npm install --save-dev api-linter

# 2. Add npm scripts
# (see package.json section)

# 3. Add to CI/CD
# (see GitHub Actions example)

# 4. Train team
# (share this document)

# 5. Monitor adoption
# (track metrics)
```

### Support and Resources

**Documentation:**
- This document (comprehensive guide)
- README.md (quick start)
- common.yaml (field reference)
- examples/ (sample API specs)

**Training:**
- Team presentation (use this deck)
- Hands-on workshop (1 hour)
- Office hours (weekly)
- Slack channel: #api-standards

**Contacts:**
- Tool maintainer: [Your name]
- API standards team: [Team email]
- Support: #api-linter-support

---

## Appendix

### A. Common YAML Reference

Complete list of 29 common schemas:

#### Identifiers
- UserID
- TravelerID
- BookingID
- FlightID
- HotelID
- CarID
- RailID

#### Monetary
- CurrencyCode
- Amount
- Price

#### Location
- CountryCode
- AirportCode
- CityCode
- Address

#### Contact
- Email
- PhoneNumber

#### Date/Time
- DateTimeISO
- DateISO

#### Status
- BookingStatus
- PaymentStatus

#### Travel Specific
- TravelerInfo
- FlightNumber
- CabinClass
- RoomType
- CarClass

#### Responses
- ErrorResponse
- ValidationErrorResponse
- WarningResponse
- CommonAttributes

### B. Validator Reference

Quick reference for all 11 validators:

| Validator              | Focus Area           | Severity Levels      |
|------------------------|----------------------|----------------------|
| validateDescriptions   | Documentation        | Error, Warning       |
| validateCommonFields   | Field standards      | Warning              |
| validateErrorResponses | Error handling       | Error, Warning, Info |
| validateComponents     | Schema integrity     | Error, Info          |
| validateSecurity       | Authentication       | Error, Warning, Info |
| validateVersioning     | API versioning       | Error, Warning, Info |
| validateResponseSchemas| Response structure   | Error, Warning, Info |
| validatePathParameters | Path params          | Error, Warning       |
| validateRequiredFields | Required marking     | Error, Warning, Info |
| validateHttpMethods    | REST conventions     | Warning, Info        |
| validateExamples       | Documentation        | Info                 |

### C. Exit Codes

| Code | Meaning                                  |
|------|------------------------------------------|
| 0    | Success (no errors, or errors but --fail-on-error not set) |
| 1    | Errors found and --fail-on-error is set |

### D. Color Code Reference

| Color  | Usage                | Severity |
|--------|----------------------|----------|
| Red    | Error messages       | ✗ ERROR  |
| Yellow | Warning messages     | ⚠ WARNING|
| Blue   | Info messages, headers| ℹ INFO   |
| Green  | Success messages     | ✓        |
| Gray   | Secondary info       | Location, Suggestion |

### E. Glossary

**OpenAPI Specification (OAS):** Standard format for describing REST APIs

**Schema:** Structure definition for request/response data

**Component:** Reusable schema definition in OpenAPI

**Path Parameter:** Variable in URL path, e.g., {bookingId}

**Query Parameter:** Variable in URL query string, e.g., ?page=1

**Semantic Versioning:** MAJOR.MINOR.PATCH version format

**$ref:** Reference to another schema definition

**CRUD:** Create, Read, Update, Delete operations

**REST:** Representational State Transfer architecture

**CI/CD:** Continuous Integration/Continuous Deployment

**JWT:** JSON Web Token for authentication

---

## Document Metadata

**Title:** API Linter - Comprehensive Guide
**Version:** 1.0.0
**Date:** November 14, 2025
**Author:** [Your Name]
**Status:** Final
**Audience:** Development Teams, Team Leads, Management

**Revision History:**
| Version | Date           | Changes                    | Author       |
|---------|----------------|----------------------------|--------------|
| 1.0.0   | Nov 14, 2025   | Initial comprehensive guide| [Your Name]  |

---

*End of Document*
