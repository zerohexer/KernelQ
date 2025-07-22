const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // For password hashing
const DirectKernelCompiler = require('./direct-kernel-compiler');
const TestCaseSystem = require('./test-case-system');
const TestExecutionEngine = require('./test-execution-engine');
const LeetCodeStyleValidator = require('./leetcode-style-validator');
const { initializeDatabase, getDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize the direct kernel compiler
const compiler = new DirectKernelCompiler('./work');

// Initialize LeetCode-style test system
const testCaseSystem = new TestCaseSystem();
const testExecutionEngine = new TestExecutionEngine('/home/zerohexer/WebstormProjects/kernel-learning/backend/work');

// Initialize the new comprehensive LeetCode-style validator
const leetcodeValidator = new LeetCodeStyleValidator('./work');

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://kernel-frontend.tunnel.com',
        /\.tunnel\.com$/,  // Allow any cloudflared tunnel domain
        /\.trycloudflare\.com$/  // Allow temporary cloudflared domains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-user-id']
}));
app.use(express.json({ limit: '10mb' }));

// 🔒 SECURITY: Prevent User ID Parameter Tampering
// This middleware protects all endpoints that start with /api/user/
app.use((req, res, next) => {
    // Only apply security to /api/user/ endpoints
    if (!req.path.startsWith('/api/user/')) {
        return next();
    }
    console.log('🔒 Security Check - User ID Authorization');
    
    // Get authenticated user ID from headers (temporary - will be JWT later)
    const authUserId = req.headers['x-user-id'];
    
    // Extract userId from URL path like /api/user/123/progress -> 123
    const urlParts = req.path.split('/');
    const requestedUserId = urlParts[3]; // /api/user/[userId]/...
    
    console.log(`📋 Full URL path: ${req.path}`);
    console.log(`📋 Route params: ${JSON.stringify(req.params)}`);
    console.log(`📋 Auth User ID: ${authUserId}, Requested User ID: ${requestedUserId}`);
    
    // Require authentication
    if (!authUserId) {
        console.log('❌ Authentication required - no user ID provided');
        return res.status(401).json({ 
            success: false, 
            error: 'Authentication required - please log in' 
        });
    }
    
    // Prevent horizontal privilege escalation (ensure both are strings for comparison)
    const authUserIdStr = authUserId ? authUserId.toString() : null;
    const requestedUserIdStr = requestedUserId ? requestedUserId.toString() : null;
    
    if (authUserIdStr !== requestedUserIdStr) {
        console.log('❌ Access denied - user trying to access another user\'s data');
        console.log(`📋 Comparison failed: "${authUserIdStr}" !== "${requestedUserIdStr}"`);
        return res.status(403).json({ 
            success: false, 
            error: 'Access denied - you can only access your own data' 
        });
    }
    
    console.log('✅ Authorization passed - user can access their own data');
    next();
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

        // Fallback to basic compilation for legacy support
        const securityCheck = validateKernelCode(code);
        if (!securityCheck.safe) {
            return res.status(400).json({
                success: false,
                error: `Security violation: ${securityCheck.reason}`,
                stage: 'security_check'
            });
        }

        const result = await compiler.compileKernelModule(code, moduleName);
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
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

// LeetCode-style problem validation endpoint
app.post('/api/validate-solution', async (req, res) => {
    const { code, moduleName, problemId } = req.body;
    
    if (!code || !moduleName || !problemId) {
        return res.status(400).json({ 
            success: false, 
            error: 'Code, module name, and problem ID are required' 
        });
    }

    try {
        // Security check
        const securityCheck = validateKernelCode(code);
        if (!securityCheck.safe) {
            return res.status(400).json({
                success: false,
                error: `Security violation: ${securityCheck.reason}`,
                stage: 'security_check'
            });
        }

        // Get test cases for the problem
        const testCases = testCaseSystem.getAllTestCases(problemId);
        if (testCases.length === 0) {
            return res.status(404).json({
                success: false,
                error: `No test cases found for problem: ${problemId}`,
                stage: 'test_case_lookup'
            });
        }

        // Execute test cases using LeetCode-style system
        const validationResults = await testExecutionEngine.executeTestCases(
            code, 
            moduleName, 
            testCases
        );
        
        res.json({
            success: true,
            ...validationResults
        });

    } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stage: 'validation_execution'
        });
    }
});

// Get visible test cases for a problem (for frontend display)
app.get('/api/test-cases/:problemId', async (req, res) => {
    try {
        const { problemId } = req.params;
        const visibleTestCases = testCaseSystem.getVisibleTestCases(problemId);
        
        res.json({
            success: true,
            problemId,
            testCases: visibleTestCases,
            totalVisible: visibleTestCases.length,
            totalHidden: testCaseSystem.getAllTestCases(problemId).length - visibleTestCases.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get test case statistics
app.get('/api/test-stats/:problemId', async (req, res) => {
    try {
        const { problemId } = req.params;
        const stats = testCaseSystem.getTestCaseStats(problemId);
        
        res.json({
            success: true,
            problemId,
            ...stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Quick compile check (without test execution)
app.post('/api/quick-compile', async (req, res) => {
    const { code, moduleName } = req.body;
    
    if (!code || !moduleName) {
        return res.status(400).json({ 
            success: false, 
            error: 'Code and module name are required' 
        });
    }

    try {
        // Security check
        const securityCheck = validateKernelCode(code);
        if (!securityCheck.safe) {
            return res.status(400).json({
                success: false,
                error: `Security violation: ${securityCheck.reason}`,
                stage: 'security_check'
            });
        }

        // Quick compilation check only
        const sessionId = Math.random().toString(36).substr(2, 9);
        const compilationResult = await testExecutionEngine.compileModule(code, moduleName, sessionId);
        
        res.json({
            success: compilationResult.success,
            compilation: compilationResult,
            stage: 'compilation_only'
        });

    } catch (error) {
        console.error('Quick compile error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            stage: 'quick_compile'
        });
    }
});

// Security validation for kernel code
function validateKernelCode(code) {
    const dangerousPatterns = [
        // System calls that could be dangerous
        /sys_call_table/i,
        /hijack/i,
        /rootkit/i,
        
        // File system operations
        /vfs_write/i,
        /vfs_read/i,
        /filp_open.*O_RDWR/i,
        
        // Network operations outside normal scope
        /raw_socket/i,
        /netfilter.*drop/i,
        
        // Memory operations that could be dangerous
        /copy_to_user.*\/etc\/passwd/i,
        /copy_from_user.*\/etc\/shadow/i,
        
        // Process manipulation
        /find_task_by_pid.*kill/i,
        /force_sig/i,
        
        // Disable security features
        /selinux_disabled/i,
        /security_.*disable/i
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
            return {
                safe: false,
                reason: `Potentially dangerous pattern detected: ${pattern.source}`
            };
        }
    }

    // Check for required kernel module basics
    if (!code.includes('MODULE_LICENSE')) {
        return {
            safe: false,
            reason: 'Missing MODULE_LICENSE declaration'
        };
    }

    if (!code.includes('module_init') || !code.includes('module_exit')) {
        return {
            safe: false,
            reason: 'Missing module_init or module_exit'
        };
    }

    return { safe: true };
}

// Generate Makefile for kernel module compilation
function generateMakefile(moduleName) {
    return `# Kernel module Makefile
obj-m := ${moduleName}.o

# Use host kernel version for compilation
KERNEL_VERSION ?= \$(shell uname -r)
KERNEL_DIR ?= /lib/modules/\$(KERNEL_VERSION)/build

all:
\tmake -C \$(KERNEL_DIR) M=\$(PWD) modules

clean:
\tmake -C \$(KERNEL_DIR) M=\$(PWD) clean

install:
\tmake -C \$(KERNEL_DIR) M=\$(PWD) modules_install

.PHONY: all clean install
`;
}

// Compile kernel module using Docker for isolation
async function compileKernelModule(sessionDir, moduleName) {
    return new Promise((resolve) => {
        const dockerCommand = [
            'docker', 'run', '--rm',
            '-v', `${sessionDir}:/workspace`,
            '-w', '/workspace',
            'kernel-dev-env:latest',  // Custom Docker image with kernel headers
            'make'
        ];

        const compilation = spawn(dockerCommand[0], dockerCommand.slice(1), {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        compilation.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        compilation.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        compilation.on('close', (code) => {
            const output = stdout + stderr;
            
            if (code === 0) {
                resolve({
                    success: true,
                    output: output,
                    message: 'Kernel module compiled successfully'
                });
            } else {
                resolve({
                    success: false,
                    error: 'Compilation failed',
                    output: output,
                    exitCode: code
                });
            }
        });

        compilation.on('error', (error) => {
            resolve({
                success: false,
                error: `Compilation process error: ${error.message}`,
                output: ''
            });
        });
    });
}

// Test kernel module in QEMU virtual machine
async function testModuleInQEMU(sessionDir, moduleName, sessionId) {
    return new Promise((resolve) => {
        // QEMU command to boot minimal Linux with our module
        const qemuCommand = [
            'timeout', '30',  // 30 second timeout
            'qemu-system-x86_64',
            '-kernel', '/boot/vmlinuz',  // Host kernel
            '-initrd', '/boot/initrd.img',
            '-m', '256M',
            '-nographic',
            '-serial', 'stdio',
            '-append', `console=ttyS0 init=/bin/bash quiet`,
            '-drive', `file=${sessionDir}/${moduleName}.ko,format=raw,if=virtio`
        ];

        const qemu = spawn(qemuCommand[0], qemuCommand.slice(1), {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let dmesgOutput = '';

        // Send commands to test the module
        const testCommands = [
            `insmod /dev/vda`,  // Load our module
            `dmesg | tail -10`,  // Check kernel messages
            `lsmod | grep ${moduleName}`,  // Verify module loaded
            `rmmod ${moduleName}`,  // Unload module
            `dmesg | tail -5`,  // Check unload messages
            'poweroff'  // Shutdown VM
        ].join('\n');

        qemu.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            
            // Extract dmesg output
            if (text.includes('[') && text.includes(']')) {
                dmesgOutput += text;
            }
        });

        qemu.stderr.on('data', (data) => {
            output += data.toString();
        });

        // Send test commands after boot
        setTimeout(() => {
            qemu.stdin.write(testCommands);
            qemu.stdin.end();
        }, 2000);

        qemu.on('close', (code) => {
            resolve({
                success: code === 0,
                output: output,
                dmesg: dmesgOutput,
                message: code === 0 ? 'Module tested successfully in QEMU' : 'Module testing failed',
                exitCode: code
            });
        });

        qemu.on('error', (error) => {
            resolve({
                success: false,
                error: `QEMU error: ${error.message}`,
                output: output,
                dmesg: dmesgOutput
            });
        });
    });
}

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
                    output: result.feedback?.map(f => f.message).join('\n') || 'Compilation failed'
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

// Authentication Endpoints
app.post('/api/auth/register', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
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
            progress: progress
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed'
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
app.post('/api/admin/database/backup', async (req, res) => {
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