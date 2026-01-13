// LeetCode-Style Comprehensive Validation System for Kernel Learning
// Handles all problem types with pre-compilation, compilation, and post-compilation testing

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const DirectKernelCompiler = require('./direct-kernel-compiler');
const generatedTestDefinitions = require('./generated-test-definitions');

const execAsync = promisify(exec);

class LeetCodeStyleValidator {
    constructor(workingDirectory = './work') {
        this.workingDirectory = workingDirectory;
        this.timeout = 30000;
        this.directCompiler = new DirectKernelCompiler(workingDirectory);
        this.initializeTestDefinitions();
    }

    initializeTestDefinitions() {
        // Start with generated test definitions from framework
        this.testDefinitions = new Map(generatedTestDefinitions);
    }

    // Parse checkpatch.pl output and extract style feedback
    parseCheckpatchOutput(rawOutput) {
        const lines = rawOutput.split('\n');
        const feedback = [];
        const regex = /^(WARNING|ERROR|CHECK):\s*(.*)/;

        for (const line of lines) {
            const match = line.match(regex);
            if (match) {
                feedback.push({
                    type: match[1].toLowerCase(), // 'warning', 'error', or 'check'
                    message: match[2].trim()
                });
            }
        }
        
        return feedback;
    }

    // Helper method to extract code string from both legacy and multi-file formats
    extractCodeString(codeOrFiles) {
        if (typeof codeOrFiles === 'string') {
            // Legacy single-file format
            return codeOrFiles;
        } else if (Array.isArray(codeOrFiles)) {
            // Multi-file format: combine all non-readonly C files
            return codeOrFiles
                .filter(file => !file.readOnly && (file.name.endsWith('.c') || file.name.endsWith('.h')))
                .map(file => file.content)
                .join('\n');
        }
        return '';
    }

    // Main validation function - LeetCode style
    // Supports both legacy single-file and new multi-file formats
    async validateSolution(codeOrFiles, problemId, moduleName) {
        const sessionId = this.generateSessionId();
        const results = {
            sessionId,
            problemId,
            overallResult: 'PENDING',
            score: 0,
            maxScore: 100,
            testResults: [],
            compilationResult: null,
            executionTime: 0,
            feedback: []
        };

        const startTime = Date.now();

        try {
            // Step 1: Get test definition
            const testDef = this.testDefinitions.get(problemId) || 
                           this.testDefinitions.get(parseInt(problemId)) ||
                           this.getGenericTestDef(problemId);
            
            if (!testDef) {
                throw new Error(`No test definition found for problem: ${problemId}`);
            }

            // Step 2: Pre-compilation validation
            const preValidation = await this.preCompilationValidation(codeOrFiles, testDef);
            results.testResults.push(...preValidation.tests);
            
            if (preValidation.criticalFailure) {
                results.overallResult = 'PRE_COMPILATION_ERROR';
                results.feedback = preValidation.feedback;
                return results;
            }

            // Step 3: Compilation (with testScenario support for kernel_project_test)
            const kernelProjectTest = testDef.testCases?.find(tc => tc.type === 'kernel_project_test');
            let testScenario = kernelProjectTest?.testScenario || null;

            // 🔒 SECURITY: Pass Makefile from test definition to compiler
            // This ensures compilation uses server-controlled Makefile, not user-provided one
            if (testDef.makefile) {
                testScenario = testScenario || {};
                testScenario.makefile = testDef.makefile;
            }

            const compilation = await this.compileModule(codeOrFiles, moduleName, sessionId, testScenario);
            results.compilationResult = compilation;
            
            if (!compilation.success) {
                results.overallResult = 'COMPILATION_ERROR';
                results.feedback.push({
                    type: 'error',
                    message: 'Compilation failed',
                    details: compilation.output
                });
                return results;
            }

            // Step 3.5: Process style check results from checkpatch.pl
            if (compilation.directResults?.styleCheck?.output) {
                const styleFeedback = this.parseCheckpatchOutput(compilation.directResults.styleCheck.output);
                if (styleFeedback.length > 0) {
                    // Add style feedback as non-critical information
                    results.feedback.push({
                        type: 'style_guide',
                        message: 'Kernel Coding Style Analysis (checkpatch.pl)',
                        details: styleFeedback.map(f => `[${f.type.toUpperCase()}] ${f.message}`).join('\n'),
                        styleFeedback: styleFeedback // Raw feedback for frontend processing
                    });
                    console.log(`🎨 Style feedback added: ${styleFeedback.length} issues found`);
                } else {
                    // No style issues found
                    results.feedback.push({
                        type: 'style_guide',
                        message: 'Kernel Coding Style Analysis (checkpatch.pl)',
                        details: '✅ No style issues detected - code follows kernel coding standards!',
                        styleFeedback: []
                    });
                }
            }

            // Step 4: Post-compilation testing (Direct compilation results analysis)
            // Add original code to directResults for code analysis tests
            const directResultsWithCode = {
                ...compilation.directResults,
                code: codeOrFiles
            };
            const postTests = await this.analyzeDirectResults(
                directResultsWithCode, 
                testDef, 
                sessionId
            );
            results.testResults.push(...postTests.tests);

            // Step 5: Calculate score and result
            this.calculateResults(results, testDef);

        } catch (error) {
            results.overallResult = 'SYSTEM_ERROR';
            results.feedback.push({
                type: 'error',
                message: 'System error during validation',
                details: error.message
            });
        } finally {
            await this.cleanup(sessionId);
            results.executionTime = Date.now() - startTime;
        }

        return results;
    }

    async preCompilationValidation(codeOrFiles, testDef) {
        const results = {
            tests: [],
            criticalFailure: false,
            feedback: []
        };

        // Convert to string for security and requirements checking
        const codeString = this.extractCodeString(codeOrFiles);

        // Security checks
        const securityIssues = this.checkSecurity(codeString);
        if (securityIssues.length > 0) {
            results.criticalFailure = true;
            results.feedback.push({
                type: 'security_error',
                message: 'Security violations detected',
                details: securityIssues
            });
            return results;
        }

        // Check exact requirements if defined (non-critical for pre-compilation)
        if (testDef.exactRequirements) {
            const exactChecks = await this.checkExactRequirements(codeString, testDef.exactRequirements);
            results.tests.push(...exactChecks.tests);
            
            // Don't fail pre-compilation on exact requirements - save for post-compilation
            // if (exactChecks.criticalFailure) {
            //     results.criticalFailure = true;
            //     results.feedback = exactChecks.feedback;
            // }
        }

        return results;
    }

    async checkExactRequirements(code, requirements) {
        const results = {
            tests: [],
            criticalFailure: false,
            feedback: []
        };

        // Check exact function names
        if (requirements.functionNames) {
            for (const funcName of requirements.functionNames) {
                const regex = new RegExp(`\\b${funcName}\\b`);
                const found = regex.test(code);
                
                results.tests.push({
                    id: `function_${funcName}`,
                    name: `Function: ${funcName}`,
                    status: found ? 'PASSED' : 'FAILED',
                    critical: true
                });

                if (!found) {
                    // Don't set critical failure for pre-compilation - allow code to compile first
                    // results.criticalFailure = true;
                    results.feedback.push({
                        type: 'warning',
                        message: `Missing required function: ${funcName}`,
                        hint: `Your function must be named exactly "${funcName}"`
                    });
                }
            }
        }

        // Check exact variable names
        if (requirements.variables) {
            for (const variable of requirements.variables) {
                // Escape regex metacharacters in variable name to handle arrays like student_grades[MAX_GRADES]
                const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                // For array names, use word boundary before the name but not after (since ] is not a word char)
                const regex = variable.name.includes('[') 
                    ? new RegExp(`\\b${escapedName}`)
                    : new RegExp(`\\b${escapedName}\\b`);
                const found = regex.test(code);
                
                results.tests.push({
                    id: `variable_${variable.name}`,
                    name: `Variable: ${variable.name}`,
                    status: found ? 'PASSED' : 'FAILED',
                    critical: true
                });

                if (!found) {
                    // Don't set critical failure for pre-compilation - allow code to compile first
                    // results.criticalFailure = true;
                    results.feedback.push({
                        type: 'warning',
                        message: `Missing required variable: ${variable.name}`,
                        hint: `Your variable must be named exactly "${variable.name}"`
                    });
                }
            }
        }

        return results;
    }

    // Analyze Direct compilation and testing results
    async analyzeDirectResults(directResults, testDef, sessionId) {
        const results = {
            tests: []
        };

        if (!directResults) {
            results.tests.push({
                id: 'direct_execution',
                name: 'Direct Compilation',
                status: 'ERROR',
                message: 'No compilation results available'
            });
            return results;
        }

        // Extract output from compilation and testing
        let output = '';
        if (directResults.compilation) {
            output += directResults.compilation.output || '';
        }
        if (directResults.testing) {
            output += directResults.testing.output || '';
            output += directResults.testing.dmesg || '';
        }

        // Run each test case based on direct compilation output
        for (const testCase of testDef.testCases) {
            let testResult = {
                id: testCase.id,
                name: testCase.name,
                status: 'PENDING',
                message: '',
                executionTime: 0
            };

            const testStart = Date.now();

            try {
                switch (testCase.type) {
                    case 'symbol_check':
                        testResult = this.analyzeDirectSymbols(output, testCase);
                        break;
                    case 'output_match':
                        testResult = this.analyzeDirectOutput(output, testCase);
                        break;
                    case 'structure_check':
                        testResult = this.analyzeDirectStructure(output, testCase);
                        break;
                    case 'code_analysis':
                        testResult = this.analyzeCodeAnalysis(this.extractCodeString(directResults.code || ''), testCase);
                        break;
                    case 'variable_check':
                        testResult = this.analyzeVariableCheck(output, testCase);
                        break;
                    case 'kernel_project_test':
                        testResult = await this.analyzeKernelProjectTest(directResults, testCase);
                        break;
                    default:
                        testResult.status = 'PASSED';
                        testResult.message = 'Direct compilation and testing completed';
                }
            } catch (error) {
                testResult.status = 'ERROR';
                testResult.message = `Test analysis failed: ${error.message}`;
            }

            testResult.executionTime = Date.now() - testStart;
            testResult.critical = testCase.critical || false; // Add critical flag
            results.tests.push(testResult);
        }

        return results;
    }

    // Analyze Direct compilation output for required symbols/functions
    analyzeDirectSymbols(output, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        // Check if compilation was successful (BTF generation and module creation)
        if (output.includes('LD [M]') && output.includes('.ko')) {
            result.status = 'PASSED';
            result.message = 'Module compiled successfully - required symbols present';
        } else {
            const missingSymbols = [];
            for (const symbol of testCase.expected) {
                // Check for compilation errors mentioning missing symbols
                if (output.includes(`undefined reference to \`${symbol}'`) || 
                    output.includes(`'${symbol}' undeclared`)) {
                    missingSymbols.push(symbol);
                }
            }
            
            if (missingSymbols.length > 0) {
                result.message = `Missing symbols detected: ${missingSymbols.join(', ')}`;
            } else {
                result.message = 'Compilation failed - check source code';
            }
        }

        return result;
    }

    // Analyze Direct compilation output for expected messages
    analyzeDirectOutput(output, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        const missingOutputs = [];
        for (const expected of testCase.expected) {
            const pattern = expected.exact ? 
                expected.pattern : 
                new RegExp(expected.pattern, 'i');
            
            const found = expected.exact ? 
                output.includes(expected.pattern) :
                pattern.test(output);
            
            if (!found) {
                missingOutputs.push(expected.pattern);
            }
        }

        if (missingOutputs.length === 0) {
            result.status = 'PASSED';
            result.message = 'All expected outputs found in module execution';
        } else {
            result.message = `Missing outputs: ${missingOutputs.join(', ')}`;
        }

        return result;
    }

    // Analyze Direct compilation output for structure validation
    analyzeDirectStructure(output, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        // If module compiled successfully, structure is likely correct
        if (output.includes('LD [M]') && output.includes('.ko')) {
            result.status = 'PASSED';
            result.message = 'Module structure validated by successful compilation';
        } else {
            result.message = 'Module structure validation failed - compilation error';
        }

        return result;
    }

    // Analyze code for required symbols and patterns (code_analysis type)
    analyzeCodeAnalysis(code, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: '',
            critical: testCase.critical
        };

        const missingSymbols = [];
        const foundProhibited = [];

        // Check expected symbols
        if (testCase.expectedSymbols) {
            for (const symbol of testCase.expectedSymbols) {
                if (!code.includes(symbol)) {
                    missingSymbols.push(symbol);
                }
            }
        }

        // Check prohibited symbols
        if (testCase.prohibitedSymbols) {
            for (const symbol of testCase.prohibitedSymbols) {
                if (code.includes(symbol)) {
                    foundProhibited.push(symbol);
                }
            }
        }

        if (missingSymbols.length === 0 && foundProhibited.length === 0) {
            result.status = 'PASSED';
            result.message = 'All code analysis checks passed';
        } else {
            const issues = [];
            if (missingSymbols.length > 0) {
                issues.push(`Missing expected symbols: ${missingSymbols.join(', ')}`);
            }
            if (foundProhibited.length > 0) {
                issues.push(`Found prohibited symbols: ${foundProhibited.join(', ')}`);
            }
            result.message = issues.join('; ');
        }

        return result;
    }

    // Analyze variable declarations and usage
    analyzeVariableCheck(output, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        // If module compiled successfully, variable checks likely passed
        if (output.includes('LD [M]') && output.includes('.ko')) {
            result.status = 'PASSED';
            result.message = 'Variable validation passed by successful compilation';
        } else {
            result.message = 'Variable validation failed - compilation error';
        }

        return result;
    }

    async postCompilationTesting(modulePath, testDef, sessionId) {
        const results = {
            tests: []
        };

        for (const testCase of testDef.testCases) {
            let testResult = {
                id: testCase.id,
                name: testCase.name,
                status: 'PENDING',
                message: '',
                executionTime: 0
            };

            const testStart = Date.now();

            try {
                switch (testCase.type) {
                    case 'symbol_check':
                        testResult = await this.runSymbolCheck(modulePath, testCase);
                        break;
                    case 'output_match':
                        testResult = await this.runOutputMatch(modulePath, testCase);
                        break;
                    case 'driver_test':
                        testResult = await this.runDriverTest(modulePath, testCase, sessionId);
                        break;
                    case 'structure_check':
                        testResult = await this.runStructureCheck(modulePath, testCase);
                        break;
                    default:
                        testResult.status = 'SKIPPED';
                        testResult.message = `Unknown test type: ${testCase.type}`;
                }
            } catch (error) {
                testResult.status = 'ERROR';
                testResult.message = `Test execution failed: ${error.message}`;
            }

            testResult.executionTime = Date.now() - testStart;
            results.tests.push(testResult);
        }

        return results;
    }

    async runSymbolCheck(modulePath, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        try {
            const { stdout } = await execAsync(`objdump -t "${modulePath}"`);
            const missingSymbols = [];

            for (const symbol of testCase.expected) {
                if (!stdout.includes(symbol)) {
                    missingSymbols.push(symbol);
                }
            }

            if (missingSymbols.length === 0) {
                result.status = 'PASSED';
                result.message = 'All required symbols found';
            } else {
                result.message = `Missing symbols: ${missingSymbols.join(', ')}`;
            }
        } catch (error) {
            result.status = 'ERROR';
            result.message = `Symbol check failed: ${error.message}`;
        }

        return result;
    }

    async runOutputMatch(modulePath, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        try {
            // Load module and capture output
            await execAsync(`cp "${modulePath}" /tmp/test_module.ko`);
            await execAsync('dmesg -C'); // Clear dmesg
            await execAsync('insmod /tmp/test_module.ko');
            await execAsync('rmmod test_module');
            
            const { stdout: dmesgOutput } = await execAsync('dmesg');
            
            const missingOutputs = [];
            for (const expected of testCase.expected) {
                const pattern = expected.exact ? 
                    expected.pattern : 
                    new RegExp(expected.pattern, 'i');
                
                const found = expected.exact ? 
                    dmesgOutput.includes(expected.pattern) :
                    pattern.test(dmesgOutput);
                
                if (!found) {
                    missingOutputs.push(expected.pattern);
                }
            }

            if (missingOutputs.length === 0) {
                result.status = 'PASSED';
                result.message = 'All expected outputs found';
            } else {
                result.message = `Missing outputs: ${missingOutputs.join(', ')}`;
            }

            // Cleanup
            await execAsync('rm -f /tmp/test_module.ko').catch(() => {});
            
        } catch (error) {
            result.status = 'ERROR';
            result.message = `Output test failed: ${error.message}`;
        }

        return result;
    }

    async runDriverTest(modulePath, testCase, sessionId) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        try {
            // Write test script to temporary file
            const scriptPath = `/tmp/test_script_${sessionId}.sh`;
            await fs.writeFile(scriptPath, testCase.script, { mode: 0o755 });
            
            // Copy module to expected location
            await execAsync(`cp "${modulePath}" /tmp/student_module.ko`);
            
            // Run test script
            const { stdout, stderr } = await execAsync(scriptPath, { timeout: this.timeout });
            
            if (stdout.includes('ALL') && stdout.includes('TESTS PASSED')) {
                result.status = 'PASSED';
                result.message = 'Driver test completed successfully';
            } else {
                result.message = `Driver test failed: ${stderr || 'Unknown error'}`;
            }
            
            // Cleanup
            await fs.unlink(scriptPath).catch(() => {});
            await execAsync('rm -f /tmp/student_module.ko').catch(() => {});
            
        } catch (error) {
            result.status = 'ERROR';
            result.message = `Driver test error: ${error.message}`;
        }

        return result;
    }

    async runStructureCheck(modulePath, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: ''
        };

        try {
            const { stdout } = await execAsync(`objdump -t "${modulePath}"`);
            const missingStructures = [];

            for (const structure of testCase.expected) {
                if (!stdout.includes(structure)) {
                    missingStructures.push(structure);
                }
            }

            if (missingStructures.length === 0) {
                result.status = 'PASSED';
                result.message = 'All required structures found';
            } else {
                result.message = `Missing structures: ${missingStructures.join(', ')}`;
            }
        } catch (error) {
            result.status = 'ERROR';
            result.message = `Structure check failed: ${error.message}`;
        }

        return result;
    }

    calculateResults(results, testDef) {
        const totalTests = results.testResults.length;
        const passedTests = results.testResults.filter(t => t.status === 'PASSED').length;
        const criticalTests = results.testResults.filter(t => t.critical);
        const passedCritical = criticalTests.filter(t => t.status === 'PASSED').length;
        const failedTests = results.testResults.filter(t => t.status === 'FAILED');

        // Score calculation
        results.score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

        // Result determination - stricter for exact requirements
        if (criticalTests.length > 0 && passedCritical < criticalTests.length) {
            results.overallResult = 'WRONG_ANSWER';
            const failedCritical = criticalTests.filter(t => t.status === 'FAILED');
            results.feedback.push({
                type: 'error',
                message: 'Critical requirements not met',
                details: `Failed: ${failedCritical.map(t => t.name).join(', ')}`
            });
        } else if (results.score === 100) {
            results.overallResult = 'ACCEPTED';
            results.feedback.push({
                type: 'success',
                message: 'All tests passed! Solution accepted.',
                details: 'Your solution meets all requirements'
            });
        } else {
            // For Phase 1 problems, any failed test should be WRONG_ANSWER
            results.overallResult = 'WRONG_ANSWER';
            results.feedback.push({
                type: 'error',
                message: 'Solution incorrect',
                details: `Failed tests: ${failedTests.map(t => t.name).join(', ')}`
            });
        }

        // Add QEMU output to feedback for debugging
        if (results.compilationResult && results.compilationResult.directResults) {
            const qemuOutput = results.compilationResult.directResults.testing?.output || '';
            if (qemuOutput.length > 0) {
                results.feedback.push({
                    type: 'qemu_output',
                    message: 'QEMU Test Output',
                    details: qemuOutput
                });
            }
        }
    }

    checkSecurity(code) {
        const issues = [];

        // Forbidden patterns in kernel code
        const forbidden = [
            { pattern: /\bprintf\s*\(/, message: 'Use printk() instead of printf() in kernel code' },
            { pattern: /\bmalloc\s*\(/, message: 'Use kmalloc() instead of malloc() in kernel code' },
            { pattern: /\bfree\s*\(/, message: 'Use kfree() instead of free() in kernel code' },
            { pattern: /#include\s*<stdio\.h>/, message: 'Remove stdio.h - not available in kernel space' },
            { pattern: /system\s*\(/, message: 'system() calls are forbidden in kernel code' },
            { pattern: /exec\w*\s*\(/, message: 'exec() calls are forbidden in kernel code' },
            // 🔒 SECURITY: Block absolute path includes to prevent info disclosure via GCC errors
            // e.g., #include "/etc/passwd" could leak file contents in error messages
            { pattern: /#include\s*["<]\//, message: 'Absolute path includes are forbidden - use relative paths only' },
            // 🔒 SECURITY: Block path traversal in includes
            { pattern: /#include\s*["<]\.\./, message: 'Path traversal in includes is forbidden' }
        ];

        for (const check of forbidden) {
            if (check.pattern.test(code)) {
                issues.push(check.message);
            }
        }

        return issues;
    }

    async compileModule(codeOrFiles, moduleName, sessionId, testScenario = null) {
        try {
            console.log(`🔨 Direct Compiling module: ${moduleName}`);
            const result = await this.directCompiler.compileKernelModule(codeOrFiles, moduleName, testScenario);
            
            if (result.success) {
                return {
                    success: true,
                    output: (result.compilation?.output || '') + (result.testing?.output || ''),
                    directResults: result
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'Direct compilation/testing failed',
                    output: result.output || (result.compilation?.output || '') + (result.testing?.output || ''),
                    directResults: result
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                output: ''
            };
        }
    }

    // Analyze kernel_project_test results
    async analyzeKernelProjectTest(directResults, testCase) {
        const result = {
            id: testCase.id,
            name: testCase.name,
            status: 'FAILED',
            message: '',
            details: []
        };

        try {
            const testScenario = testCase.testScenario;
            const expected = testScenario?.expected || {};
            const qemuOutput = directResults.testing?.output || '';

            console.log('🔍 Analyzing kernel_project_test results...');

            // Check if QEMU test completed successfully
            if (!qemuOutput.includes('QEMU_TEST_COMPLETE: SUCCESS')) {
                if (qemuOutput.includes('QEMU_TEST_COMPLETE: LOAD_FAILED')) {
                    result.message = 'Module failed to load in QEMU test environment';
                    return result;
                } else {
                    result.message = 'QEMU test did not complete successfully';
                    return result;
                }
            }

            let allChecksPass = true;
            const failedChecks = [];

            // Check expected dmesg patterns
            if (expected.dmesg && expected.dmesg.length > 0) {
                for (const pattern of expected.dmesg) {
                    const regex = new RegExp(pattern, 'i');
                    if (!regex.test(qemuOutput)) {
                        allChecksPass = false;
                        failedChecks.push(`Missing dmesg pattern: "${pattern}"`);
                    } else {
                        result.details.push(`✅ Found dmesg pattern: "${pattern}"`);
                    }
                }
            }

            // Check expected stdout patterns
            if (expected.stdout && expected.stdout.length > 0) {
                for (const pattern of expected.stdout) {
                    const regex = new RegExp(pattern, 'i');
                    if (!regex.test(qemuOutput)) {
                        allChecksPass = false;
                        failedChecks.push(`Missing stdout pattern: "${pattern}"`);
                    } else {
                        result.details.push(`✅ Found stdout pattern: "${pattern}"`);
                    }
                }
            }

            // Check expected stderr patterns
            if (expected.stderr && expected.stderr.length > 0) {
                for (const pattern of expected.stderr) {
                    const regex = new RegExp(pattern, 'i');
                    if (!regex.test(qemuOutput)) {
                        allChecksPass = false;
                        failedChecks.push(`Missing stderr pattern: "${pattern}"`);
                    } else {
                        result.details.push(`✅ Found stderr pattern: "${pattern}"`);
                    }
                }
            }

            // Check file existence and content (simulated through QEMU output)
            if (expected.files && expected.files.length > 0) {
                for (const fileCheck of expected.files) {
                    const filePath = fileCheck.path;
                    const shouldExist = fileCheck.exists !== false;
                    
                    // Look for evidence in QEMU output that file was checked
                    if (shouldExist) {
                        // This would need to be implemented in the test commands
                        // For now, we assume file checks are handled by test commands
                        result.details.push(`ℹ️ File check for ${filePath} (implement in testCommands)`);
                    }
                }
            }

            // Determine final status
            if (allChecksPass) {
                result.status = 'PASSED';
                result.message = 'All kernel project test expectations met';
            } else {
                result.status = 'FAILED';
                result.message = `Test failed: ${failedChecks.join(', ')}`;
            }

            // Add summary details
            result.details.push(`📊 QEMU test completed with ${failedChecks.length} failed checks`);

        } catch (error) {
            result.status = 'ERROR';
            result.message = `Kernel project test analysis failed: ${error.message}`;
        }

        return result;
    }

    getGenericTestDef(problemId) {
        // Fallback test definition for unknown problems
        return {
            name: `Generic Test for ${problemId}`,
            category: 'generic',
            testCases: [
                {
                    id: 'basic_compilation',
                    name: 'Basic Compilation',
                    type: 'structure_check',
                    expected: ['module_init', 'module_exit']
                }
            ]
        };
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async cleanup(sessionId) {
        // Cleanup temporary files and loaded modules
        try {
            await execAsync(`rm -f /tmp/*${sessionId}*`).catch(() => {});
            await execAsync('rmmod student_module 2>/dev/null || true').catch(() => {});
        } catch (error) {
            console.warn('Cleanup warning:', error.message);
        }
    }
}

module.exports = LeetCodeStyleValidator;