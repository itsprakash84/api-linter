// ============================================================================
// AI Suggestion Module (CLI)
// ============================================================================
// Provides AI-powered suggestions in CLI output

const configManager = require('../config/config-manager');

class AISuggestionCLI {
    
    constructor() {
        this.aiConfig = configManager.getAIConfig();
        this.enabled = configManager.isAIEnabled();
    }

    /**
     * Format AI suggestions for CLI output
     */
    formatForCLI(issue, colors = true) {
        if (!issue.aiSuggestion) return '';
        
        const lines = [];
        
        if (colors) {
            lines.push('\x1b[35m    🤖 AI Suggestion:\x1b[0m');
            lines.push(`\x1b[35m       ${issue.aiSuggestion}\x1b[0m`);
        } else {
            lines.push('    🤖 AI Suggestion:');
            lines.push(`       ${issue.aiSuggestion}`);
        }
        
        return lines.join('\n');
    }

    /**
     * Display AI status in CLI
     */
    displayStatus() {
        if (this.enabled) {
            console.log(`\x1b[35m🤖 AI-Enhanced Validation (${this.aiConfig.provider})\x1b[0m`);
        } else {
            console.log(`\x1b[90mℹ  AI suggestions disabled (set ${this.getApiKeyEnvVar()} to enable)\x1b[0m`);
        }
    }

    /**
     * Get environment variable name for API key
     */
    getApiKeyEnvVar() {
        const vars = {
            'gemini': 'GEMINI_API_KEY',
            'openai': 'OPENAI_API_KEY',
            'anthropic': 'ANTHROPIC_API_KEY'
        };
        return vars[this.aiConfig.provider] || 'AI_API_KEY';
    }

    /**
     * Format AI general recommendations
     */
    formatRecommendations(recommendations, colors = true) {
        if (!recommendations) return '';
        
        const lines = [];
        
        if (colors) {
            lines.push('');
            lines.push('\x1b[35m' + '='.repeat(70) + '\x1b[0m');
            lines.push('\x1b[35m🤖 AI General Recommendations\x1b[0m');
            lines.push('\x1b[35m' + '='.repeat(70) + '\x1b[0m');
            lines.push('\x1b[35m' + recommendations + '\x1b[0m');
            lines.push('\x1b[35m' + '='.repeat(70) + '\x1b[0m');
        } else {
            lines.push('');
            lines.push('='.repeat(70));
            lines.push('🤖 AI General Recommendations');
            lines.push('='.repeat(70));
            lines.push(recommendations);
            lines.push('='.repeat(70));
        }
        
        return lines.join('\n');
    }

    /**
     * Add AI badge to summary
     */
    getAIBadge(colors = true) {
        if (!this.enabled) return '';
        
        if (colors) {
            return '\x1b[35m [AI-Enhanced] \x1b[0m';
        }
        return ' [AI-Enhanced] ';
    }
}

module.exports = new AISuggestionCLI();
