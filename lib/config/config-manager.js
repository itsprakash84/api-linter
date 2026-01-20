// ============================================================================
// Configuration Management Module
// ============================================================================
// Centralized configuration for API Linter
// Supports environment variables and config.yaml file

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from multiple sources (priority order):
     * 1. Environment variables
     * 2. config.yaml file
     * 3. Default values
     */
    loadConfig() {
        const defaultConfig = {
            // AI Configuration
            ai: {
                gemini: {
                    apiKey: process.env.GEMINI_API_KEY || '',
                    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
                    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
                    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8192')
                }
            },

            // Validation Configuration
            validation: {
                defaultStrategy: process.env.VALIDATION_STRATEGY || 'inline',
                minSeverity: process.env.MIN_SEVERITY || 'warning',
                failOnError: process.env.FAIL_ON_ERROR === 'true' || false
            },

            // Output Configuration
            output: {
                format: process.env.OUTPUT_FORMAT || 'text',
                colorize: process.env.COLORIZE !== 'false',
                verbose: process.env.VERBOSE === 'true' || false
            },

            // Web Server Configuration
            server: {
                port: parseInt(process.env.PORT || '3000'),
                host: process.env.HOST || 'localhost',
                corsEnabled: process.env.CORS_ENABLED !== 'false'
            }
        };

        // Try to load from config.yaml
        const configPath = path.join(process.cwd(), 'config', 'config.yaml');
        if (fs.existsSync(configPath)) {
            try {
                const fileConfig = yaml.load(fs.readFileSync(configPath, 'utf8'));
                return this.mergeConfig(defaultConfig, fileConfig);
            } catch (error) {
                console.warn('⚠️  Warning: Could not load config.yaml, using defaults');
            }
        }

        return defaultConfig;
    }

    /**
     * Deep merge two configuration objects
     */
    mergeConfig(target, source) {
        const output = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = this.mergeConfig(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        }
        return output;
    }

    /**
     * Get configuration value by path (e.g., 'ai.gemini.apiKey')
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    /**
     * Set configuration value by path
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.config);
        target[lastKey] = value;
    }

    /**
     * Get AI provider configuration
     */
    getAIConfig() {
        return this.config.ai.gemini;
    }

    /**
     * Check if AI is enabled
     */
    isAIEnabled() {
        return !!this.config.ai.gemini.apiKey;
    }

    /**
     * Save current configuration to file
     */
    saveConfig(filePath = null) {
        const targetPath = filePath || path.join(process.cwd(), 'config', 'config.yaml');
        fs.writeFileSync(targetPath, yaml.dump(this.config, { indent: 2, lineWidth: 120 }));
        console.log(`✅ Configuration saved to ${targetPath}`);
    }

    /**
     * Display current configuration
     */
    display() {
        console.log('\n📋 Current Configuration:\n');
        console.log('AI Settings:');
        console.log(`  Enabled: ${this.isAIEnabled() ? '✅' : '❌'}`);
        console.log(`  Model: ${this.config.ai.gemini.model}`);
        console.log(`  API Key: ${this.config.ai.gemini.apiKey ? '***' + this.config.ai.gemini.apiKey.slice(-4) : 'Not set'}`);
        
        console.log('\nValidation:');
        console.log(`  Strategy: ${this.config.validation.defaultStrategy}`);
        console.log(`  Min Severity: ${this.config.validation.minSeverity}`);
        console.log(`  Fail on Error: ${this.config.validation.failOnError ? '✅' : '❌'}`);
        
        console.log('\nOutput:');
        console.log(`  Format: ${this.config.output.format}`);
        console.log(`  Colorize: ${this.config.output.colorize ? '✅' : '❌'}`);
        
        console.log('\nServer:');
        console.log(`  Port: ${this.config.server.port}`);
        console.log(`  Host: ${this.config.server.host}`);
        console.log('');
    }
}

// Singleton instance
const configManager = new ConfigManager();

module.exports = configManager;
