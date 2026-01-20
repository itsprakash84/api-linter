// ============================================================================
// Common Fields Discovery Module
// ============================================================================
// Scans multiple API specs to discover and suggest common fields

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class CommonFieldsDiscovery {
    
    /**
     * Scan directory for API spec files
     */
    scanDirectory(directory, options = {}) {
        const {
            extensions = ['.yaml', '.yml'],
            recursive = true,
            exclude = ['node_modules', 'dist', 'build']
        } = options;

        const files = [];
        
        const scan = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    if (recursive && !exclude.includes(entry.name)) {
                        scan(fullPath);
                    }
                } else if (extensions.some(ext => entry.name.endsWith(ext))) {
                    files.push(fullPath);
                }
            }
        };
        
        scan(directory);
        return files;
    }

    /**
     * Extract all fields from an API spec
     */
    extractFields(apiSpec) {
        const fields = new Map();
        
        const extractFromObject = (obj, parentPath = '') => {
            if (!obj || typeof obj !== 'object') return;
            
            if (obj.properties) {
                for (const [fieldName, fieldDef] of Object.entries(obj.properties)) {
                    const fieldPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;
                    
                    if (!fields.has(fieldName)) {
                        fields.set(fieldName, []);
                    }
                    
                    fields.get(fieldName).push({
                        path: fieldPath,
                        type: fieldDef.type,
                        format: fieldDef.format,
                        description: fieldDef.description,
                        pattern: fieldDef.pattern,
                        example: fieldDef.example,
                        required: obj.required?.includes(fieldName) || false
                    });
                    
                    // Recurse into nested objects
                    if (fieldDef.type === 'object' || fieldDef.properties) {
                        extractFromObject(fieldDef, fieldPath);
                    }
                    
                    // Handle arrays of objects
                    if (fieldDef.type === 'array' && fieldDef.items) {
                        extractFromObject(fieldDef.items, fieldPath);
                    }
                }
            }
            
            // Recurse through all object properties
            for (const value of Object.values(obj)) {
                if (typeof value === 'object' && value !== null) {
                    extractFromObject(value, parentPath);
                }
            }
        };
        
        extractFromObject(apiSpec);
        return fields;
    }

    /**
     * Discover common fields across multiple API specs
     */
    discoverCommonFields(directory, options = {}) {
        const {
            minOccurrences = 2,
            minConsistencyScore = 0.8
        } = options;

        console.log(`🔍 Scanning directory: ${directory}`);
        const files = this.scanDirectory(directory);
        console.log(`📄 Found ${files.length} API spec files`);
        
        const allFields = new Map();
        let totalSpecs = 0;
        
        // Extract fields from each file
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                const spec = yaml.load(content);
                
                if (!spec.openapi && !spec.swagger) {
                    continue; // Not an OpenAPI spec
                }
                
                totalSpecs++;
                const fields = this.extractFields(spec);
                
                for (const [fieldName, occurrences] of fields.entries()) {
                    if (!allFields.has(fieldName)) {
                        allFields.set(fieldName, []);
                    }
                    allFields.get(fieldName).push({
                        file: path.relative(directory, file),
                        occurrences
                    });
                }
            } catch (error) {
                console.warn(`⚠️  Warning: Could not parse ${file}`);
            }
        }
        
        console.log(`✅ Analyzed ${totalSpecs} API specifications\n`);
        
        // Analyze consistency and suggest common fields
        const suggestions = [];
        
        for (const [fieldName, fileOccurrences] of allFields.entries()) {
            const specCount = fileOccurrences.length;
            
            if (specCount >= minOccurrences) {
                const consistency = this.calculateConsistency(fileOccurrences);
                
                if (consistency.score >= minConsistencyScore) {
                    suggestions.push({
                        fieldName,
                        occurrenceCount: specCount,
                        totalSpecs,
                        frequency: specCount / totalSpecs,
                        consistency: consistency.score,
                        canonical: consistency.canonical,
                        files: fileOccurrences.map(f => f.file)
                    });
                }
            }
        }
        
        // Sort by frequency and consistency
        suggestions.sort((a, b) => {
            const scoreA = a.frequency * a.consistency;
            const scoreB = b.frequency * b.consistency;
            return scoreB - scoreA;
        });
        
        return {
            totalSpecs,
            totalFields: allFields.size,
            suggestions
        };
    }

    /**
     * Calculate consistency score for a field across specs
     */
    calculateConsistency(fileOccurrences) {
        const allDefs = fileOccurrences.flatMap(f => f.occurrences);
        
        // Group by type
        const typeGroups = {};
        for (const def of allDefs) {
            const key = `${def.type}|${def.format || ''}|${def.pattern || ''}`;
            if (!typeGroups[key]) {
                typeGroups[key] = [];
            }
            typeGroups[key].push(def);
        }
        
        // Find most common definition
        let maxGroup = [];
        for (const group of Object.values(typeGroups)) {
            if (group.length > maxGroup.length) {
                maxGroup = group;
            }
        }
        
        const consistencyScore = maxGroup.length / allDefs.length;
        
        // Create canonical definition
        const canonical = {
            type: maxGroup[0].type,
            format: maxGroup[0].format,
            pattern: maxGroup[0].pattern,
            description: this.findMostCommonDescription(maxGroup),
            example: maxGroup[0].example
        };
        
        return {
            score: consistencyScore,
            canonical,
            inconsistencies: allDefs.length - maxGroup.length
        };
    }

    /**
     * Find most common description among definitions
     */
    findMostCommonDescription(definitions) {
        const descriptions = definitions
            .map(d => d.description)
            .filter(d => d);
        
        if (descriptions.length === 0) return undefined;
        
        const counts = {};
        for (const desc of descriptions) {
            counts[desc] = (counts[desc] || 0) + 1;
        }
        
        return Object.keys(counts).reduce((a, b) => 
            counts[a] > counts[b] ? a : b
        );
    }

    /**
     * Generate common.yaml from discoveries
     */
    generateCommonYaml(suggestions, outputPath) {
        const commonFields = {};
        
        for (const suggestion of suggestions) {
            const { fieldName, canonical } = suggestion;
            
            commonFields[fieldName] = {
                type: canonical.type,
                ...(canonical.format && { format: canonical.format }),
                ...(canonical.pattern && { pattern: canonical.pattern }),
                ...(canonical.description && { description: canonical.description }),
                ...(canonical.example && { example: canonical.example }),
                _metadata: {
                    foundIn: suggestion.occurrenceCount,
                    consistency: Math.round(suggestion.consistency * 100) + '%',
                    frequency: Math.round(suggestion.frequency * 100) + '%'
                }
            };
        }
        
        const yamlContent = yaml.dump({
            version: '1.0',
            generatedAt: new Date().toISOString(),
            commonFields
        }, { indent: 2, lineWidth: -1 });
        
        fs.writeFileSync(outputPath, yamlContent);
        console.log(`✅ Generated common.yaml with ${suggestions.length} fields`);
        console.log(`📁 Saved to: ${outputPath}`);
    }

    /**
     * Validate API spec against common fields
     */
    validateAgainstCommon(apiSpec, commonFields) {
        const issues = [];
        const fields = this.extractFields(apiSpec);
        
        for (const [fieldName, occurrences] of fields.entries()) {
            if (commonFields[fieldName]) {
                const common = commonFields[fieldName];
                
                for (const occurrence of occurrences) {
                    // Check type mismatch
                    if (occurrence.type !== common.type) {
                        issues.push({
                            field: fieldName,
                            path: occurrence.path,
                            severity: 'error',
                            message: `Type mismatch: expected '${common.type}', found '${occurrence.type}'`,
                            suggestion: `Change type to '${common.type}' to match common field definition`
                        });
                    }
                    
                    // Check format mismatch
                    if (common.format && occurrence.format !== common.format) {
                        issues.push({
                            field: fieldName,
                            path: occurrence.path,
                            severity: 'warning',
                            message: `Format mismatch: expected '${common.format}', found '${occurrence.format || 'none'}'`,
                            suggestion: `Add format: '${common.format}' to match common field definition`
                        });
                    }
                    
                    // Check description mismatch
                    if (common.description && occurrence.description !== common.description) {
                        issues.push({
                            field: fieldName,
                            path: occurrence.path,
                            severity: 'info',
                            message: `Description differs from common field definition`,
                            expected: common.description,
                            actual: occurrence.description,
                            suggestion: `Consider using: "${common.description}"`
                        });
                    }
                    
                    // Check pattern mismatch
                    if (common.pattern && occurrence.pattern !== common.pattern) {
                        issues.push({
                            field: fieldName,
                            path: occurrence.path,
                            severity: 'warning',
                            message: `Pattern mismatch: expected '${common.pattern}', found '${occurrence.pattern || 'none'}'`,
                            suggestion: `Add pattern: '${common.pattern}' to match common field definition`
                        });
                    }
                }
            }
        }
        
        return issues;
    }

    /**
     * Display discovery results
     */
    displayResults(results) {
        console.log('\n📊 Common Fields Discovery Results:\n');
        console.log(`Total API Specs Analyzed: ${results.totalSpecs}`);
        console.log(`Unique Fields Found: ${results.totalFields}`);
        console.log(`Common Fields Suggested: ${results.suggestions.length}\n`);
        
        console.log('Top Common Fields:\n');
        
        for (const suggestion of results.suggestions.slice(0, 20)) {
            console.log(`📌 ${suggestion.fieldName}`);
            console.log(`   Occurrences: ${suggestion.occurrenceCount}/${results.totalSpecs} specs (${Math.round(suggestion.frequency * 100)}%)`);
            console.log(`   Consistency: ${Math.round(suggestion.consistency * 100)}%`);
            console.log(`   Type: ${suggestion.canonical.type}${suggestion.canonical.format ? ` (${suggestion.canonical.format})` : ''}`);
            if (suggestion.canonical.description) {
                console.log(`   Description: ${suggestion.canonical.description}`);
            }
            console.log('');
        }
    }
}

module.exports = new CommonFieldsDiscovery();
