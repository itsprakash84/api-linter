# API Linter - Smart OpenAPI Validation Tool

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/yourusername/api-linter)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)

> AI-powered OpenAPI validator that enforces standards, suggests fixes, and learns from your existing APIs

## 📝 Featured Article

**[Building an AI-Enhanced API Validator: A Weekend Developer's Journey](https://dev.to/itsprakash84/building-an-ai-enhanced-api-validator-a-weekend-developers-journey-386a)**

Read the story behind this tool - from production chaos to consistent APIs.

---

## ✨ Why This Tool?

**Problem:** You have multiple APIs with inconsistent field names, missing descriptions, poor error handling.

**Solution:** Run one command to find **all mistakes** automatically:

```bash
node bin/api-linter.js your-api.yaml
```

**Features:**

- 🤖 **AI-Enhanced Suggestions** - Get context-aware fixes powered by Google Gemini
- 🔍 **11 Modular Validators** - Comprehensive validation beyond syntax checking
- 📚 **Auto-Discovery** - Learn standards from your existing APIs
- ⚡ **Fast & Modular** - 50ms startup, easy to extend
- 🎨 **Multiple Outputs** - CLI, Web UI, JSON for CI/CD
- 🏭 **Industry Templates** - Tailored rules for Banking, Travel, E-commerce


---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/api-linter.git
cd api-linter

# Install dependencies
npm install

# Run validation
node bin/api-linter.js examples/flights-good.yaml
```

### Basic Usage

```bash
# Validate with default settings
node bin/api-linter.js your-api.yaml

# JSON output for CI/CD
node bin/api-linter.js your-api.yaml --format=json

# Summary only
node bin/api-linter.js your-api.yaml --format=summary

# Fail build on errors
node bin/api-linter.js your-api.yaml --fail-on-error

# With AI suggestions (requires GEMINI_API_KEY)
export GEMINI_API_KEY=your-key-here
node bin/api-linter.js your-api.yaml
```

### Web Interface

```bash
# Start web server
npm start

# Open browser
open http://localhost:3000
```

---

## 📖 Documentation

### For First-Time Users

- 📘 **[First Time Medium Guide](docs/FIRST_TIME_MEDIUM_GUIDE.md)** - Complete publishing walkthrough
- 📄 **[Medium Article](docs/MEDIUM_ARTICLE_READY.md)** - Ready-to-publish article
- ✅ **[Publishing Checklist](docs/MEDIUM_PUBLISHING_CHECKLIST.md)** - Step-by-step checklist
- 🎨 **[Visual Content Guide](docs/VISUAL_CONTENT_GUIDE.md)** - Create images and diagrams

### Technical Documentation

- 🏗️ **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and decisions
- 📚 **[API Linter Guide](docs/API_LINTER_GUIDE.md)** - Complete user guide


---

## 🎯 What Gets Validated

### 1. Descriptions (Errors if missing/poor)

Every field needs proper description:
- Starts with uppercase
- Ends with punctuation
- At least 10 characters

```yaml
# ✅ GOOD
booking_id:
  type: string
  description: Unique identifier for the booking.

# ❌ ERROR
booking_id:
  type: string  # Missing description
```

### 2. Common Fields (Warnings for best practices)

```yaml
# ✅ GOOD
currency_code:
  type: string
  pattern: '^[A-Z]{3}$'
  description: ISO 4217 currency code.

# ⚠️ WARNING - missing pattern
currency_code:
  type: string
  description: Currency code.
```

## Validation Strategies

| Strategy | Use Case | Dependencies |
|----------|----------|--------------|
| **INLINE** ⭐ | Microservices | None |
| REF | Single API | Internal |
| SHARED | Enterprise | External |
| HYBRID | Migration | Optional |

### INLINE (Recommended)

No dependencies, self-contained:

```bash
node api-linter-cli.js your-api.yaml --strategy=inline
```

```yaml
paths:
  /bookings:
    get:
      responses:
        '200':
          properties:
            user_id:
              type: string  # ✅ Inline, no $ref needed
              description: Unique user identifier.
```

### REF (Strict)

Requires $ref to components:

```bash
node api-linter-cli.js your-api.yaml --strategy=ref
```

### SHARED (Enterprise)

External common spec:

```bash
node api-linter-cli.js your-api.yaml --strategy=shared --common-spec=common.yaml
```

## Description Rules

Requirements:
1. Start with uppercase (A-Z)
2. End with punctuation (. ! ? :)
3. At least 10 characters

```yaml
# ✅ PERFECT
description: Unique identifier for the booking record.

# ❌ ERROR - too short
description: ID.

# ❌ ERROR - no uppercase
description: unique identifier.
```

## Common Fields

Recognized fields with guidance:

| Field | Type | Pattern | Example |
|-------|------|---------|---------|
| `user_id` | string | - | "usr_123" |
| `currency_code` | string | `^[A-Z]{3}$` | "USD" |
| `amount` | number | - | 99.99 |
| `email` | string | email | "user@example.com" |
| `created_at` | string | date-time | "2024-01-15T10:30:00Z" |

## CLI Options

```bash
node api-linter-cli.js <file> [options]
```

| Option | Values | Description |
|--------|--------|-------------|
| `--strategy` | ref, inline, shared, hybrid | Validation mode |
| `--common-spec` | file path | For shared strategy |
| `--format` | text, json, summary | Output format |
| `--severity` | error, warning, info | Min level |
| `--fail-on-error` | - | Exit 1 on errors |
| `--no-color` | - | Plain text |

### Common Commands

```bash
# Basic
node api-linter-cli.js api.yaml

# Microservices
node api-linter-cli.js api.yaml --strategy=inline

# JSON
node api-linter-cli.js api.yaml --format=json

# CI/CD
node api-linter-cli.js api.yaml --strategy=inline --fail-on-error
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Validate API
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: node api-linter-cli.js api/openapi.yaml --strategy=inline --fail-on-error
```

### GitLab CI

```yaml
api-validation:
  image: node:18
  script:
    - npm install
    - node api-linter-cli.js api/openapi.yaml --strategy=inline --fail-on-error
```

### Pre-commit Hook

```bash
#!/bin/bash
node api-linter-cli.js api/openapi.yaml --strategy=inline --fail-on-error
if [ $? -ne 0 ]; then
    echo "❌ Validation failed!"
    exit 1
fi
```

## Examples

### Validate Microservice

```bash
node api-linter-cli.js api/flights.yaml --strategy=inline
```

### Validate Multiple APIs

```bash
for api in api/services/*.yaml; do
    node api-linter-cli.js "$api" --strategy=inline --fail-on-error
done
```

### CI/CD Pipeline

```bash
node api-linter-cli.js api.yaml --strategy=inline --format=json --fail-on-error

if [ $? -eq 0 ]; then
    echo "✅ Deploying"
    kubectl apply -f k8s/
fi
```

## Troubleshooting

### Missing description errors

```yaml
# Solution: Add proper description
user_id:
  type: string
  description: Unique identifier for the user.
```

### Description quality warnings

Ensure:
- Uppercase start
- Punctuation end
- 10+ characters

### Common field warnings

Add recommended patterns:

```yaml
currency_code:
  type: string
  pattern: '^[A-Z]{3}$'
  description: ISO 4217 three-letter currency code.
```

## Project Files

```
├── api-linter-cli.js       # Main CLI tool
├── package.json             # Dependencies
├── common.yaml             # Example shared components
├── demo-strategies.js      # Interactive demo
├── examples/
│   ├── bookings-microservice.yaml      # ✅ Good
│   ├── bookings-bad-descriptions.yaml  # ❌ Bad
│   ├── flights-inline.yaml
│   └── flights-good.yaml
└── README.md
```

## Summary

### Key Benefits

1. **One Command** - Validates everything instantly
2. **Microservices-Friendly** - No forced dependencies
3. **Quality Enforcement** - Proper descriptions required
4. **Smart Guidance** - Warnings for best practices
5. **CI/CD Ready** - Automatic build failures

### Quick Reference

```bash
# Microservices (most common)
node api-linter-cli.js your-api.yaml --strategy=inline

# CI/CD
node api-linter-cli.js your-api.yaml --strategy=inline --fail-on-error

# Help
node api-linter-cli.js --help
```

## 👤 Author

**Sathya Prakash MC**

Software Engineer passionate about API design, microservices architecture, and developer tooling. Created this tool to solve real-world API consistency challenges in production environments.

- 💼 LinkedIn: [sathyaprakash1260](https://www.linkedin.com/in/sathyaprakash1260/)
- 🐙 GitHub: [itsprakash84](https://github.com/itsprakash84)
- 📧 Email: [itsprakash84@gmail.com](mailto:itsprakash84@gmail.com)
- 🔗 Project Repository: [api-linter](https://github.com/itsprakash84/api-linter/)

## 📄 License

MIT

---

**Need help?** Run `node api-linter-cli.js --help` or check `examples/` directory.
