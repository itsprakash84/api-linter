// ============================================================================
// API Linter - Frontend Application
// ============================================================================

// Configuration
const CONFIG = {
    apiBaseUrl: 'http://localhost:3000/api/v1',  // Local dev server URL
    useBackend: true,  // Use backend validation engine
    autoValidate: true,
    theme: 'dark'
};

// State Management
const state = {
    currentFile: null,
    currentYaml: null,
    validationResults: null,
    editor: null,
    commonFieldRegistry: null
};

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeEditor();
    initializeEventListeners();
    loadTheme();
    loadCommonFields();
    showToast('Welcome to API Linter! 👋', 'info');
});

// ============================================================================
// CodeMirror Editor Setup
// ============================================================================

function initializeEditor() {
    const textarea = document.getElementById('yamlEditor');
    state.editor = CodeMirror.fromTextArea(textarea, {
        mode: 'yaml',
        theme: CONFIG.theme === 'dark' ? 'material-darker' : 'eclipse',
        lineNumbers: true,
        lineWrapping: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Cmd-S': saveYaml,
            'Ctrl-S': saveYaml
        }
    });

    // Auto-validate on change (if enabled)
    state.editor.on('change', () => {
        if (CONFIG.autoValidate && state.currentYaml) {
            debounce(validateYaml, 1000)();
        }
    });
}

// ============================================================================
// Event Listeners
// ============================================================================

function initializeEventListeners() {
    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Settings
    document.getElementById('settingsBtn').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.toggle('hidden');
    });
    document.getElementById('closeSettings').addEventListener('click', () => {
        document.getElementById('settingsPanel').classList.add('hidden');
    });

    // Upload Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchUploadTab(btn.dataset.tab));
    });

    // Editor Tabs
    document.querySelectorAll('.editor-tab').forEach(btn => {
        btn.addEventListener('click', () => switchEditorTab(btn.dataset.editorTab));
    });

    // File Upload
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');

    fileInput.addEventListener('change', handleFileUpload);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    // Paste YAML
    document.getElementById('validatePaste').addEventListener('click', handlePasteValidation);

    // GitHub Fetch
    document.getElementById('fetchGithub').addEventListener('click', handleGithubFetch);

    // Examples
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => loadExample(btn.dataset.example));
    });

    // Validation
    document.getElementById('validateBtn').addEventListener('click', validateYaml);
    document.getElementById('clearBtn').addEventListener('click', clearEditor);

    // Toolbar Actions
    document.getElementById('formatYaml').addEventListener('click', formatYaml);
    document.getElementById('downloadYaml').addEventListener('click', downloadYaml);
    document.getElementById('exportJson').addEventListener('click', exportJson);
    document.getElementById('exportHtml').addEventListener('click', exportHtml);
    document.getElementById('shareResults').addEventListener('click', shareResults);

    // Filter and Search
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => filterIssues(btn.dataset.filter));
    });
    document.getElementById('searchIssues').addEventListener('input', searchIssues);

    // Settings
    document.getElementById('strategySelect').addEventListener('change', (e) => {
        CONFIG.validationStrategy = e.target.value;
    });
    document.getElementById('severitySelect').addEventListener('change', (e) => {
        CONFIG.minSeverity = e.target.value;
        if (state.validationResults) {
            displayResults(state.validationResults);
        }
    });
    document.getElementById('autoValidate').addEventListener('change', (e) => {
        CONFIG.autoValidate = e.target.checked;
    });
}

// ============================================================================
// Tab Management
// ============================================================================

function switchUploadTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function switchEditorTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.editor-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.editorTab === tabName);
    });

    // Update panels
    if (tabName === 'editor') {
        document.getElementById('editorPanel').classList.add('active');
        document.getElementById('resultsPanel').classList.remove('active');
    } else {
        document.getElementById('editorPanel').classList.remove('active');
        document.getElementById('resultsPanel').classList.add('active');
    }
}

// ============================================================================
// File Upload Handlers
// ============================================================================

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        loadFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
        loadFile(file);
    } else {
        showToast('Please drop a YAML file (.yaml or .yml)', 'error');
    }
}

function loadFile(file) {
    state.currentFile = file.name;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        state.currentYaml = content;
        state.editor.setValue(content);
        document.getElementById('fileName').textContent = file.name;
        showEditorSection();
        showToast(`Loaded ${file.name}`, 'success');
    };
    
    reader.onerror = () => {
        showToast('Error reading file', 'error');
    };
    
    reader.readAsText(file);
}

function handlePasteValidation() {
    const content = document.getElementById('pasteInput').value.trim();
    if (!content) {
        showToast('Please paste YAML content first', 'error');
        return;
    }
    
    state.currentFile = 'pasted.yaml';
    state.currentYaml = content;
    state.editor.setValue(content);
    document.getElementById('fileName').textContent = 'Pasted YAML';
    showEditorSection();
    validateYaml();
}

async function handleGithubFetch() {
    const url = document.getElementById('githubUrl').value.trim();
    if (!url) {
        showToast('Please enter a GitHub URL', 'error');
        return;
    }

    try {
        // Convert GitHub URL to raw URL
        let rawUrl = url;
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
            rawUrl = url.replace('github.com', 'raw.githubusercontent.com')
                         .replace('/blob/', '/');
        }

        showToast('Fetching from GitHub...', 'info');
        const response = await fetch(rawUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        
        const content = await response.text();
        state.currentFile = url.split('/').pop();
        state.currentYaml = content;
        state.editor.setValue(content);
        document.getElementById('fileName').textContent = state.currentFile;
        showEditorSection();
        showToast('Successfully fetched from GitHub', 'success');
        
    } catch (error) {
        showToast(`Error fetching from GitHub: ${error.message}`, 'error');
    }
}

function loadExample(exampleName) {
    // In production, this would fetch from the backend
    // For now, we'll create sample YAML
    const examples = {
        'flights-good': `openapi: 3.0.3
info:
  title: Travel Flights API
  version: 1.0.0
  description: API for flight booking and management.

paths:
  /flights:
    get:
      summary: Search for available flights
      parameters:
        - name: origin
          in: query
          required: true
          schema:
            type: string
          description: Departure airport code.
          example: "AKL"
      responses:
        '200':
          description: List of available flights.`,
        
        'bookings': `openapi: 3.0.3
info:
  title: Bookings API
  version: 1.0.0
paths:
  /bookings:
    get:
      summary: Get all bookings`,
        
        'hotels-bad': `openapi: 3.0.3
info:
  title: Hotels API
  version: 1.0.0
paths:
  /hotels:
    get:
      responses:
        '200':
          description: hotels`
    };

    const content = examples[exampleName] || examples['flights-good'];
    state.currentFile = `${exampleName}.yaml`;
    state.currentYaml = content;
    state.editor.setValue(content);
    document.getElementById('fileName').textContent = `${exampleName}.yaml`;
    showEditorSection();
    showToast(`Loaded ${exampleName} example`, 'success');
}

// ============================================================================
// Validation Logic
// ============================================================================

async function validateYaml() {
    const content = state.editor.getValue();
    
    if (!content.trim()) {
        showToast('Please add YAML content first', 'error');
        return;
    }

    // Show loading state
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('initialState').classList.add('hidden');
    document.getElementById('resultsDisplay').classList.add('hidden');

    try {
        // Try to parse YAML first
        const apiSpec = jsyaml.load(content);
        state.currentYaml = apiSpec;

        // Call validation (backend API or local)
        const results = await performValidation(apiSpec);
        
        state.validationResults = results;
        displayResults(results);
        
        // Switch to results tab
        switchEditorTab('results');
        
    } catch (error) {
        showToast(`YAML Parse Error: ${error.message}`, 'error');
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('initialState').classList.remove('hidden');
    }
}

async function performValidation(apiSpec) {
    // Option 1: Call Spring Boot Backend API
    if (CONFIG.useBackend) {
        return await callBackendValidation(apiSpec);
    }
    
    // Option 2: Run validation locally (using existing CLI logic)
    return await runLocalValidation(apiSpec);
}

async function callBackendValidation(apiSpec) {
    try {
        // Get settings from UI
        const strategy = document.getElementById('strategySelect')?.value || 'inline';
        const minSeverity = document.getElementById('severitySelect')?.value || 'warning';
        const enableAI = document.getElementById('enableAI')?.checked || false;
        const industry = document.getElementById('industrySelect')?.value || 'general';
        
        const response = await fetch(`${CONFIG.apiBaseUrl}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                apiSpec: apiSpec,
                strategy: strategy,
                minSeverity: minSeverity,
                enableAI: enableAI,
                industry: industry
            })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        showToast(`Backend API unavailable, using local validation`, 'warning');
        return await runLocalValidation(apiSpec);
    }
}

async function runLocalValidation(apiSpec) {
    // Use the shared validation engine from CLI
    // This requires copying lib/ directory to web/frontend/ or making it accessible
    
    // For browser environment, we'll implement a lightweight version
    // In production, you would:
    // 1. Bundle the CLI validators with webpack/browserify
    // 2. Or always use the Spring Boot backend
    
    const results = [];
    
    // Run simplified validators (browser-compatible)
    validateDescriptions(apiSpec, results);
    validateCommonFields(apiSpec, results);
    validateErrorResponses(apiSpec, results);
    validateSecurity(apiSpec, results);
    
    return {
        file: state.currentFile,
        strategy: 'inline',
        timestamp: new Date().toISOString(),
        summary: {
            total: results.length,
            errors: results.filter(r => r.level === 'error').length,
            warnings: results.filter(r => r.level === 'warning').length,
            info: results.filter(r => r.level === 'info').length
        },
        results: results
    };
}

// NOTE: In production, you should either:
// 1. Use webpack/browserify to bundle ../../../lib/validation-engine.js
// 2. Always call the Spring Boot backend API
// 3. Copy validators to frontend and adapt for browser

// Example of how to use bundled validation engine:
// const validationEngine = require('../../../lib/validation-engine');
// return validationEngine.runValidation(apiSpec, {
//     strategy: 'inline',
//     minSeverity: 'warning',
//     fileName: state.currentFile
// });

// ============================================================================
// Simplified Validators (Browser-side)
// ============================================================================

function validateDescriptions(apiSpec, results) {
    // Check if info.description exists
    if (!apiSpec.info?.description) {
        results.push({
            level: 'error',
            message: 'API info is missing description.',
            location: 'info',
            suggestion: 'Add a description to your API info section.'
        });
    }

    // Check paths
    if (apiSpec.paths) {
        Object.keys(apiSpec.paths).forEach(path => {
            Object.keys(apiSpec.paths[path]).forEach(method => {
                const operation = apiSpec.paths[path][method];
                
                if (!operation.description && !operation.summary) {
                    results.push({
                        level: 'warning',
                        message: `Endpoint ${method.toUpperCase()} ${path} is missing description or summary.`,
                        location: `paths.${path}.${method}`,
                        suggestion: 'Add a description or summary to this endpoint.'
                    });
                }
            });
        });
    }
}

function validateCommonFields(apiSpec, results) {
    // This would check against common.yaml definitions
    // Simplified for demo
    if (apiSpec.components?.schemas) {
        Object.keys(apiSpec.components.schemas).forEach(schemaName => {
            const schema = apiSpec.components.schemas[schemaName];
            
            if (schema.properties) {
                Object.keys(schema.properties).forEach(propName => {
                    const prop = schema.properties[propName];
                    
                    // Check if it matches a common field pattern
                    if (propName.includes('currency') || propName.includes('amount')) {
                        if (!prop.type) {
                            results.push({
                                level: 'warning',
                                message: `Common field '${propName}' in ${schemaName} is missing type definition.`,
                                location: `components.schemas.${schemaName}.properties.${propName}`,
                                suggestion: 'Add type definition for this field.'
                            });
                        }
                    }
                });
            }
        });
    }
}

function validateErrorResponses(apiSpec, results) {
    if (apiSpec.paths) {
        Object.keys(apiSpec.paths).forEach(path => {
            Object.keys(apiSpec.paths[path]).forEach(method => {
                const operation = apiSpec.paths[path][method];
                const responses = operation.responses || {};
                
                // Check for error responses
                const hasErrorResponse = Object.keys(responses).some(code => 
                    code.startsWith('4') || code.startsWith('5')
                );
                
                if (!hasErrorResponse) {
                    results.push({
                        level: 'warning',
                        message: `Endpoint ${method.toUpperCase()} ${path} has no error responses defined.`,
                        location: `paths.${path}.${method}.responses`,
                        suggestion: 'Add at least one 4xx or 5xx error response.'
                    });
                }
            });
        });
    }
}

function validateSecurity(apiSpec, results) {
    const hasGlobalSecurity = apiSpec.security && apiSpec.security.length > 0;
    const hasSecuritySchemes = apiSpec.components?.securitySchemes && 
        Object.keys(apiSpec.components.securitySchemes).length > 0;

    if (!hasGlobalSecurity && !hasSecuritySchemes) {
        results.push({
            level: 'info',
            message: 'No security schemes defined in the API.',
            location: 'components.securitySchemes',
            suggestion: 'Consider adding authentication/authorization schemes.'
        });
    }
}

// ============================================================================
// Display Results
// ============================================================================

function displayResults(results) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('initialState').classList.add('hidden');
    document.getElementById('resultsDisplay').classList.remove('hidden');

    // Update summary counts
    document.getElementById('errorCount').textContent = results.summary.errors;
    document.getElementById('warningCount').textContent = results.summary.warnings;
    document.getElementById('infoCount').textContent = results.summary.info;
    
    // Show AI status if AI was used
    if (results.aiEnhanced || results.aiRecommendations) {
        showAIStatus(results);
    }

    // Display issues
    const issuesList = document.getElementById('issuesList');
    issuesList.innerHTML = '';

    const minSeverity = CONFIG.minSeverity || 'warning';
    const severityOrder = { error: 0, warning: 1, info: 2 };
    const minLevel = severityOrder[minSeverity];

    results.results
        .filter(issue => severityOrder[issue.level] <= minLevel)
        .forEach((issue, index) => {
            const issueCard = createIssueCard(issue, index);
            issuesList.appendChild(issueCard);
        });

    if (issuesList.children.length === 0) {
        issuesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✅</div>
                <h3>No Issues Found!</h3>
                <p>Your API specification looks good.</p>
            </div>
        `;
    }

    showToast(`Validation complete: ${results.summary.total} issues found`, 'success');
}

function showAIStatus(results) {
    const resultsSummary = document.getElementById('resultsSummary');
    
    // Add AI status badge
    const existingBadge = resultsSummary.querySelector('.ai-status-badge');
    if (!existingBadge) {
        const aiBadge = document.createElement('div');
        aiBadge.className = 'ai-status-badge';
        aiBadge.innerHTML = '🤖 AI-Enhanced Results';
        resultsSummary.insertBefore(aiBadge, resultsSummary.firstChild);
    }
    
    // Show AI general recommendations if available
    if (results.aiRecommendations) {
        const issuesList = document.getElementById('issuesList');
        const recommendationsCard = document.createElement('div');
        recommendationsCard.className = 'ai-recommendations-card';
        recommendationsCard.innerHTML = `
            <div class="ai-recommendations-header">
                <span class="ai-recommendations-icon">🤖</span>
                <span class="ai-recommendations-title">AI General Recommendations</span>
            </div>
            <div class="ai-recommendations-content">${results.aiRecommendations}</div>
        `;
        issuesList.insertBefore(recommendationsCard, issuesList.firstChild);
    }
}

function createIssueCard(issue, index) {
    const card = document.createElement('div');
    card.className = `issue-card issue-${issue.level}`;
    card.dataset.level = issue.level;
    card.dataset.index = index;

    const icon = {
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    }[issue.level];

    card.innerHTML = `
        <div class="issue-header">
            <span class="issue-icon ${issue.level}-icon">${icon}</span>
            <span class="issue-level">${issue.level.toUpperCase()}</span>
            <span class="issue-location">${issue.location}</span>
        </div>
        <div class="issue-message">${issue.message}</div>
        ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
        ${issue.aiSuggestion ? `
            <div class="issue-ai-suggestion">
                <div class="ai-header">
                    <span class="ai-label">🤖 AI-Enhanced Suggestion</span>
                    <span class="ai-badge">Powered by Gemini</span>
                </div>
                <div class="ai-content">${issue.aiSuggestion}</div>
            </div>
        ` : ''}
        <div class="issue-actions">
            <button class="issue-action-btn" onclick="jumpToLine('${issue.location}')">
                📍 Jump to Location
            </button>
        </div>
    `;

    return card;
}

// ============================================================================
// Filtering and Search
// ============================================================================

function filterIssues(filter) {
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    // Filter issues
    document.querySelectorAll('.issue-card').forEach(card => {
        if (filter === 'all' || card.dataset.level === filter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function searchIssues(event) {
    const query = event.target.value.toLowerCase();
    
    document.querySelectorAll('.issue-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
    });
}

// ============================================================================
// Export Functions
// ============================================================================

function exportJson() {
    if (!state.validationResults) {
        showToast('No validation results to export', 'error');
        return;
    }

    const json = JSON.stringify(state.validationResults, null, 2);
    downloadFile(json, 'validation-results.json', 'application/json');
    showToast('Results exported as JSON', 'success');
}

function exportHtml() {
    if (!state.validationResults) {
        showToast('No validation results to export', 'error');
        return;
    }

    const html = generateHtmlReport(state.validationResults);
    downloadFile(html, 'validation-results.html', 'text/html');
    showToast('Results exported as HTML', 'success');
}

function generateHtmlReport(results) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>API Validation Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .issue { margin: 10px 0; padding: 10px; border-left: 4px solid; }
        .error { border-color: #dc3545; background: #f8d7da; }
        .warning { border-color: #ffc107; background: #fff3cd; }
        .info { border-color: #17a2b8; background: #d1ecf1; }
    </style>
</head>
<body>
    <h1>API Validation Results</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Errors: ${results.summary.errors}</p>
        <p>Warnings: ${results.summary.warnings}</p>
        <p>Info: ${results.summary.info}</p>
        <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    <div class="issues">
        ${results.results.map(issue => `
            <div class="issue ${issue.level}">
                <strong>${issue.level.toUpperCase()}</strong>: ${issue.message}<br>
                <small>Location: ${issue.location}</small><br>
                ${issue.suggestion ? `<em>Suggestion: ${issue.suggestion}</em>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>`;
}

function shareResults() {
    if (!state.validationResults) {
        showToast('No validation results to share', 'error');
        return;
    }

    // In production, this would upload to backend and generate a shareable link
    const shareData = {
        title: 'API Validation Results',
        text: `Validation found ${state.validationResults.summary.total} issues`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(state.validationResults, null, 2));
        showToast('Results copied to clipboard', 'success');
    }
}

// ============================================================================
// Editor Actions
// ============================================================================

function formatYaml() {
    try {
        const content = state.editor.getValue();
        const parsed = jsyaml.load(content);
        const formatted = jsyaml.dump(parsed, { indent: 2, lineWidth: 120 });
        state.editor.setValue(formatted);
        showToast('YAML formatted successfully', 'success');
    } catch (error) {
        showToast(`Format error: ${error.message}`, 'error');
    }
}

function downloadYaml() {
    const content = state.editor.getValue();
    downloadFile(content, state.currentFile || 'api-spec.yaml', 'text/yaml');
    showToast('YAML downloaded', 'success');
}

function clearEditor() {
    if (confirm('Are you sure you want to clear the editor?')) {
        state.editor.setValue('');
        state.currentFile = null;
        state.currentYaml = null;
        state.validationResults = null;
        document.getElementById('fileName').textContent = '';
        document.getElementById('editorSection').classList.add('hidden');
        document.getElementById('resultsDisplay').classList.add('hidden');
        document.getElementById('initialState').classList.remove('hidden');
        showToast('Editor cleared', 'info');
    }
}

function saveYaml() {
    downloadYaml();
    return false; // Prevent default
}

// ============================================================================
// Theme Management
// ============================================================================

function toggleTheme() {
    CONFIG.theme = CONFIG.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme', CONFIG.theme === 'light');
    
    // Update editor theme
    state.editor.setOption('theme', CONFIG.theme === 'dark' ? 'material-darker' : 'eclipse');
    
    // Update icon
    document.querySelector('.theme-icon').textContent = CONFIG.theme === 'dark' ? '🌙' : '☀️';
    
    localStorage.setItem('theme', CONFIG.theme);
    showToast(`Switched to ${CONFIG.theme} mode`, 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    CONFIG.theme = savedTheme;
    document.body.classList.toggle('light-theme', savedTheme === 'light');
    document.querySelector('.theme-icon').textContent = savedTheme === 'dark' ? '🌙' : '☀️';
}

// ============================================================================
// Utility Functions
// ============================================================================

function showEditorSection() {
    document.getElementById('editorSection').classList.remove('hidden');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => container.removeChild(toast), 300);
    }, 3000);
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function jumpToLine(location) {
    // Parse location and jump to line in editor
    try {
        // Switch to editor tab first
        switchEditorTab('editor');
        
        if (!state.editor) {
            showToast('Editor not initialized', 'error');
            return;
        }
        
        // Parse location string to find the path in YAML
        // Location formats:
        // - "info.description"
        // - "paths./flights.get.responses.200"
        // - "components.schemas.Flight.properties.id"
        
        const editorContent = state.editor.getValue();
        const lines = editorContent.split('\n');
        
        // Convert location to search patterns
        const locationParts = location.split('.');
        let searchPattern = '';
        let lineNumber = -1;
        
        // Try to find the location in the YAML
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // Look for the last part of the location (most specific)
            for (let j = locationParts.length - 1; j >= 0; j--) {
                const part = locationParts[j];
                // Remove leading slash if present (for paths)
                const cleanPart = part.replace(/^\//, '');
                
                // Check if line contains the key
                if (trimmedLine.startsWith(`${cleanPart}:`) || 
                    trimmedLine.startsWith(`"${cleanPart}":`) ||
                    trimmedLine.startsWith(`'${cleanPart}':`)) {
                    lineNumber = i;
                    break;
                }
            }
            
            if (lineNumber !== -1) break;
        }
        
        if (lineNumber !== -1) {
            // Jump to the line (CodeMirror uses 0-based line numbers)
            state.editor.setCursor({ line: lineNumber, ch: 0 });
            
            // Scroll the line into view
            state.editor.scrollIntoView({ line: lineNumber, ch: 0 }, 100);
            
            // Highlight the line temporarily
            const marker = state.editor.markText(
                { line: lineNumber, ch: 0 },
                { line: lineNumber, ch: lines[lineNumber].length },
                { 
                    className: 'highlighted-line',
                    clearOnEnter: true
                }
            );
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                try {
                    marker.clear();
                } catch (e) {
                    // Marker might already be cleared
                }
            }, 3000);
            
            // Focus the editor
            state.editor.focus();
            
            showToast(`Jumped to: ${location}`, 'success');
        } else {
            showToast(`Could not find location: ${location}`, 'warning');
            console.log('Location not found:', location);
        }
        
    } catch (error) {
        console.error('Error jumping to location:', error);
        showToast(`Error: ${error.message}`, 'error');
    }
}

// ============================================================================
// Common Fields Registry
// ============================================================================

async function loadCommonFields() {
    try {
        // In production, fetch from backend
        // For now, we'll use a static version
        state.commonFieldRegistry = {
            'currency_code': { type: 'string', pattern: '^[A-Z]{3}$' },
            'user_id': { type: 'string' },
            'booking_id': { type: 'string' },
            // ... more fields
        };
    } catch (error) {
        console.warn('Could not load common fields:', error);
    }
}

async function ensureCommonFieldsLoaded() {
    if (!state.commonFieldRegistry) {
        await loadCommonFields();
    }
}

// ============================================================================
// Global Functions (called from HTML)
// ============================================================================

window.jumpToLine = jumpToLine;
