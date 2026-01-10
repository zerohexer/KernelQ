const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt'); // For password hashing
const DirectKernelCompiler = require('./direct-kernel-compiler');
const LeetCodeStyleValidator = require('./leetcode-style-validator');
const { initializeDatabase, getDatabase } = require('./database');
const {
    generateAccessToken,
    generateRefreshToken,
    protectUserEndpoints,
    authLimiter,
    authenticateJWT
} = require('./middleware/jwt-auth');

// Google OAuth integration
const { initializeGoogleOAuth, googleAuthRoutes } = require('./middleware/google-oauth');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Cloudflare/tunnels (fixes rate limiting behind proxy)
app.set('trust proxy', true);

// Initialize the direct kernel compiler
const compiler = new DirectKernelCompiler('./work');

// Initialize the new comprehensive LeetCode-style validator
const leetcodeValidator = new LeetCodeStyleValidator('./work');

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://kernel-frontend.tunnel.com',
        'https://kernelq.com',  // Production domain
        /\.tunnel\.com$/,  // Allow any cloudflared tunnel domain
        /\.trycloudflare\.com$/  // Allow temporary cloudflared domains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Initialize Google OAuth (must be after CORS and before routes)
initializeGoogleOAuth(app);

// 🔒 SECURITY: JWT Authentication for User Endpoints
app.use((req, res, next) => {
    // Only apply JWT security to /api/user/ endpoints
    if (!req.path.startsWith('/api/user/')) {
        return next();
    }
    
    // Apply JWT protection to user endpoints
    protectUserEndpoints(req, res, next);
});

// New comprehensive validation endpoint - LeetCode style with exact requirements
app.post('/api/validate-solution-comprehensive', async (req, res) => {
    const { code, files, moduleName, problemId } = req.body;
    
    // Support both legacy single-file and new multi-file formats
    const codeOrFiles = files || code;
    
    if (!codeOrFiles || !moduleName || !problemId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Code/files, module name, and problem ID are required' 
        });
    }

    try {
        console.log(`🔍 Starting comprehensive validation for problem: ${problemId} (type: ${typeof problemId})`);
        
        if (Array.isArray(codeOrFiles)) {
            console.log(`📁 Multi-file project with ${codeOrFiles.length} files`);
        } else {
            console.log(`📝 Single-file project with ${codeOrFiles.length} characters`);
        }
        
        console.log(`🏗️ Module name: ${moduleName}`);
        
        // Use the new comprehensive LeetCode-style validator
        const validationResults = await leetcodeValidator.validateSolution(
            codeOrFiles, 
            problemId, 
            moduleName
        );
        
        console.log(`✅ Validation completed with result: ${validationResults.overallResult}`);
        console.log(`📊 Score: ${validationResults.score}, Tests: ${validationResults.testResults?.length || 0}`);
        
        res.json({
            success: true,
            ...validationResults
        });

    } catch (error) {
        console.error('Comprehensive validation error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stage: 'comprehensive_validation'
        });
    }
});

// Real kernel module compilation endpoint using direct compilation
app.post('/api/compile-kernel-module', async (req, res) => {
    const { code, files, moduleName, problemId } = req.body;
    
    // Support both legacy single-file and new multi-file formats
    const codeOrFiles = files || code;
    
    if (!codeOrFiles || !moduleName) {
        return res.status(400).json({ 
            success: false, 
            error: 'Code/files and module name are required' 
        });
    }

    try {
        // ALWAYS use comprehensive validation (QEMU-based)
        if (true) { // Always use QEMU validation instead of host compilation
            console.log(`🔄 Redirecting to comprehensive validation for problem: ${problemId}`);
            
            if (Array.isArray(codeOrFiles)) {
                console.log(`📁 Multi-file project with ${codeOrFiles.length} files`);
            } else {
                console.log(`📝 Single-file project with ${codeOrFiles.length} characters`);
            }
            
            console.log(`🏗️ Module name: ${moduleName}`);
            
            const validationResults = await leetcodeValidator.validateSolution(
                codeOrFiles, 
                problemId || 'generic', // Use generic if no problemId
                moduleName
            );
            
            console.log(`📊 Validation result: ${validationResults.overallResult}`);
            console.log(`🔢 Score: ${validationResults.score}/${validationResults.maxScore}`);
            if (validationResults.feedback && validationResults.feedback.length > 0) {
                console.log(`💬 Feedback:`, validationResults.feedback.map(f => f.message));
            }
            
            // Format response to match expected compile format
            const response = {
                success: validationResults.overallResult === 'ACCEPTED' || 
                        validationResults.overallResult === 'PARTIAL_CREDIT',
                output: validationResults.feedback.map(f => f.message).join('\n'),
                stage: 'comprehensive_validation',
                validationResults: validationResults,
                score: validationResults.score,
                maxScore: validationResults.maxScore
            };
            
            if (response.success) {
                res.json(response);
            } else {
                res.status(400).json(response);
            }
            return;
        }
    } catch (error) {
        console.error('Compilation error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stage: 'internal_error'
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check kernel headers availability
        const headerCheck = await compiler.checkKernelHeaders();
        
        res.json({ 
            status: 'OK', 
            message: 'Direct kernel compilation service is running',
            features: {
                directCompilation: true,
                kernelHeaders: headerCheck.available,
                kernelVersion: headerCheck.kernelVersion || 'unknown',
                qemu: true
            },
            method: 'Direct host kernel compilation (no Docker needed!)'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Simple playground compilation endpoint (no validation)
app.post('/api/playground-compile', async (req, res) => {
    const { code, moduleName } = req.body;
    
    if (!code || !moduleName) {
        return res.status(400).json({ 
            success: false, 
            error: 'Code and module name are required' 
        });
    }

    try {
        console.log(`🎮 Playground compilation for module: ${moduleName}`);
        console.log(`📝 Code length: ${code.length} characters`);
        
        // Use direct compiler for simple compilation + QEMU testing
        const result = await compiler.compileKernelModule(code, moduleName);
        
        console.log(`📊 Compilation result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        // Format response for playground (no validation, just compilation + testing)
        const response = {
            success: result.success,
            compilation: {
                success: result.compilation?.success || result.success,
                output: result.compilation?.output || result.error || 'Compilation completed'
            },
            testing: {
                success: result.testing?.success || false,
                dmesg: result.testing?.dmesg || result.testing?.output || '',
                output: result.testing?.output || result.testing?.dmesg || ''
            },
            stage: 'playground_compilation'
        };
        
        if (response.success) {
            res.json(response);
        } else {
            // Even compilation errors should return 200 for playground
            res.json({
                ...response,
                compilation: {
                    success: false,
                    output: result.output || result.error || 'Compilation failed'
                }
            });
        }

    } catch (error) {
        console.error('Playground compilation error:', error);
        res.json({
            success: false,
            compilation: {
                success: false,
                output: `Compilation failed: ${error.message}`
            },
            testing: {
                success: false,
                output: ''
            },
            stage: 'playground_error'
        });
    }
});

// Concept example compilation endpoint (clean output for learning)
app.post('/api/concept-run', async (req, res) => {
    const { code, moduleName } = req.body;

    if (!code || !moduleName) {
        return res.status(400).json({
            success: false,
            error: 'Code and module name are required'
        });
    }

    try {
        console.log(`📚 Concept example compilation for module: ${moduleName}`);
        console.log(`📝 Code length: ${code.length} characters`);

        // Use direct compiler for compilation + QEMU testing
        const result = await compiler.compileKernelModule(code, moduleName);

        console.log(`📊 Compilation result: ${result.success ? 'SUCCESS' : 'FAILED'}`);

        // Extract and clean output - filter for [OUT] prefix
        const rawOutput = result.testing?.output || result.testing?.dmesg || '';

        // Clean output: extract only lines with [OUT] prefix, dedupe, and strip prefix
        const seen = new Set();
        const cleanOutput = rawOutput
            .split('\n')
            .filter(line => line.includes('[OUT]'))
            .map(line => {
                const match = line.match(/\[OUT\]\s*(.+)/);
                return match ? match[1].trim() : '';
            })
            .filter(line => {
                if (!line || seen.has(line)) return false;
                seen.add(line);
                return true;
            })
            .join('\n');

        // If no [OUT] lines found, check for any printk output as fallback
        let displayOutput = cleanOutput;
        if (!displayOutput && result.success) {
            // Look for any kernel module output (lines containing the module name)
            const moduleOutput = rawOutput
                .split('\n')
                .filter(line =>
                    line.includes(moduleName) ||
                    line.includes('printk') ||
                    (line.includes(']:') && !line.includes('insmod') && !line.includes('rmmod'))
                )
                .map(line => {
                    // Try to extract just the message part
                    const colonMatch = line.match(/\]:\s*(.+)/);
                    return colonMatch ? colonMatch[1].trim() : line.trim();
                })
                .filter(Boolean)
                .join('\n');

            displayOutput = moduleOutput || 'Module loaded successfully (no printk output)';
        }

        if (result.success) {
            res.json({
                success: true,
                output: displayOutput,
                rawOutput: rawOutput // Include raw for debugging if needed
            });
        } else {
            res.json({
                success: false,
                error: result.output || result.error || 'Compilation failed',
                output: displayOutput || '',
                rawOutput: rawOutput
            });
        }

    } catch (error) {
        console.error('Concept compilation error:', error);
        res.json({
            success: false,
            error: `Compilation failed: ${error.message}`,
            output: ''
        });
    }
});

// Authentication Endpoints
app.post('/api/auth/register', authLimiter, async (req, res) => {
    const { username, email, password, memberStatus = 'Standard Free User' } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username, email, and password are required'
        });
    }
    
    try {
        const db = getDatabase();
        const passwordHash = await bcrypt.hash(password, 10);
        
        const result = await db.createUser(username, email, passwordHash, memberStatus);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'User created successfully',
                userId: result.userId
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed'
        });
    }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required'
        });
    }
    
    try {
        const db = getDatabase();
        const user = db.statements.getUserByEmail.get(email);
        
        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        
        // Update last login
        db.statements.updateLastLogin.run(user.id);
        
        // Get user progress
        const progress = await db.getUserProgress(user.id);
        
        // Generate JWT tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                memberStatus: user.member_status,
                createdAt: user.created_at,
                lastLogin: user.last_login
            },
            progress: progress,
            accessToken: accessToken,
            refreshToken: refreshToken
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
        });
    }
});

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
    const authHeader = req.headers.authorization;
    const refreshToken = authHeader && authHeader.split(' ')[1];

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            error: 'Refresh token required'
        });
    }

    const { JWT_SECRET, generateAccessToken } = require('./middleware/jwt-auth');
    const jwt = require('jsonwebtoken');

    try {
        const decoded = jwt.verify(refreshToken, JWT_SECRET);
        const db = getDatabase();
        const user = db.statements.getUserById.get(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid refresh token'
            });
        }

        const newAccessToken = generateAccessToken(user);
        
        res.json({
            success: true,
            accessToken: newAccessToken
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid refresh token'
        });
    }
});

// Google OAuth Authentication Endpoints
app.get('/api/auth/google', googleAuthRoutes.initiateAuth);

app.get('/api/auth/google/callback', googleAuthRoutes.handleCallback);

// OAuth Session Exchange Endpoint
// Securely retrieves auth data from httpOnly cookie (set during OAuth callback)
// This prevents tokens from being exposed in URLs, browser history, or referer headers
app.get('/api/auth/session', (req, res) => {
    console.log('🔐 Session exchange request received');

    const sessionCookie = req.cookies.kernelq_oauth_session;

    if (!sessionCookie) {
        console.log('❌ No OAuth session cookie found');
        return res.status(401).json({
            success: false,
            error: 'No OAuth session found. Please sign in again.'
        });
    }

    try {
        const authData = JSON.parse(sessionCookie);

        // Clear the cookie immediately after reading (one-time use)
        res.clearCookie('kernelq_oauth_session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            path: '/'
        });

        console.log('✅ Session exchange successful for user:', authData.user_data?.username);

        return res.json({
            success: true,
            accessToken: authData.access_token,
            refreshToken: authData.refresh_token,
            userData: authData.user_data,
            progressData: authData.progress_data,
            isNewUser: authData.is_new_user
        });

    } catch (error) {
        console.error('❌ Failed to parse session cookie:', error);

        // Clear invalid cookie
        res.clearCookie('kernelq_oauth_session', { path: '/' });

        return res.status(400).json({
            success: false,
            error: 'Invalid session data. Please sign in again.'
        });
    }
});

// User Progress Endpoints
app.get('/api/user/:userId/progress', async (req, res) => {
    try {
        const db = getDatabase();
        const progress = await db.getUserProgress(parseInt(req.params.userId));
        
        if (!progress) {
            return res.status(404).json({
                success: false,
                error: 'User progress not found'
            });
        }
        
        res.json({
            success: true,
            progress: {
                ...progress,
                phaseCompletions: JSON.parse(progress.phase_completions || '{}'),
                skills: JSON.parse(progress.skills || '{}'),
                preferences: JSON.parse(progress.preferences || '{}')
            }
        });
        
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user progress'
        });
    }
});

app.put('/api/user/:userId/progress', async (req, res) => {
    try {
        const db = getDatabase();
        const userId = parseInt(req.params.userId);
        
        await db.updateUserProgress(userId, req.body);
        
        res.json({
            success: true,
            message: 'Progress updated successfully'
        });
        
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update progress'
        });
    }
});

// Problem Completion Endpoints
app.post('/api/user/:userId/problems/solved', async (req, res) => {
    try {
        const db = getDatabase();
        const userId = parseInt(req.params.userId);
        
        const result = await db.recordProblemSolution(userId, req.body);
        
        if (result.success === false) {
            return res.status(400).json(result);
        }
        
        res.json({
            success: true,
            message: 'Problem solution recorded'
        });
        
    } catch (error) {
        console.error('Record solution error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record solution'
        });
    }
});

app.get('/api/user/:userId/problems/solved', async (req, res) => {
    try {
        const db = getDatabase();
        const userId = parseInt(req.params.userId);
        const phase = req.query.phase;
        
        const problems = await db.getUserSolvedProblems(userId, phase);
        
        res.json({
            success: true,
            problems: problems.map(p => ({
                ...p,
                testResults: JSON.parse(p.test_results || '{}')
            }))
        });
        
    } catch (error) {
        console.error('Get solved problems error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get solved problems'
        });
    }
});

app.get('/api/user/:userId/stats', async (req, res) => {
    try {
        const db = getDatabase();
        const userId = parseInt(req.params.userId);
        
        const stats = await db.getUserStatistics(userId);
        
        res.json({
            success: true,
            stats: stats
        });
        
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user statistics'
        });
    }
});

// Database Management Endpoints
app.post('/api/admin/database/backup', authenticateJWT, async (req, res) => {
    try {
        const db = getDatabase();
        const backupPath = await db.backup();
        
        res.json({
            success: true,
            backupPath: backupPath
        });
        
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({
            success: false,
            error: 'Backup failed'
        });
    }
});

// Start server
async function startServer() {
    try {
        // Initialize database first
        console.log('🔧 Initializing KernelQ database...');
        await initializeDatabase();
        
        // Then initialize compiler
        await compiler.ensureDirectories();
        
        app.listen(PORT, () => {
            console.log(`🚀 KernelQ Server running on port ${PORT}`);
            console.log(`📁 Work directory: ${compiler.workDir}`);
            console.log(`⚡ Method: Direct host kernel compilation`);
            console.log(`🖥️  QEMU testing: Enabled`);
            console.log(`💾 Database: SQLite with WAL mode`);
            console.log(`🎯 No Docker required!`);
        });
        
    } catch (error) {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    }
}

startServer().catch(console.error);

module.exports = app;
