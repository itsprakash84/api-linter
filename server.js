// Simple Express server for development
const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const validationEngine = require('./lib/validation-engine');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow CDN resources
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'web/frontend')));

// API proxy endpoints (optional - if you want to test without Spring Boot backend)
app.post('/api/v1/validate', async (req, res) => {
    try {
        console.log('Validation request received');
        
        const { apiSpec, strategy, minSeverity, validators, enableAI, industry } = req.body;
        
        if (!apiSpec) {
            return res.status(400).json({
                error: 'Missing apiSpec in request body'
            });
        }
        
        // Use the real validation engine with AI support
        const results = await validationEngine.runValidation(apiSpec, {
            strategy: strategy || 'inline',
            minSeverity: minSeverity || 'info',
            validators: validators,
            fileName: 'uploaded-spec.yaml',
            enableAI: enableAI || false,
            industry: industry || 'general'
        });
        
        console.log(`Validation complete: ${results.summary.total} issues found${results.metadata.aiEnhanced ? ' (AI enhanced)' : ''}`);
        
        res.json({
            validationId: 'web-' + Date.now(),
            ...results
        });
        
    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            error: 'Validation failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Catch-all route - serve index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/frontend', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔍 API Linter - Web Interface                          ║
║                                                           ║
║   Server running at: http://localhost:${PORT}              ║
║                                                           ║
║   Frontend:  http://localhost:${PORT}                     ║
║   Health:    http://localhost:${PORT}/health              ║
║                                                           ║
║   Press Ctrl+C to stop                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
