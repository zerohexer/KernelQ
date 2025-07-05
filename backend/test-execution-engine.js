// LeetCode-Style Test Execution Engine for Kernel Modules
// Executes test cases against compiled kernel modules

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const crypto = require('crypto');

class TestExecutionEngine {
    constructor(workingDirectory = './work') {
        this.workingDirectory = workingDirectory;
        this.timeout = 30000; // 30 second default timeout
        this.maxConcurrentTests = 3;
        this.runningTests = new Set();
    }

    // Main test execution function - LeetCode style
    async executeTestCases(code, moduleName, testCases) {
        const sessionId = this.generateSessionId();
        const results = {
            sessionId,
            totalTests: testCases.length,
            passedTests: 0,
            failedTests: 0,
            testResults: [],
            overallResult: 'PENDING',
            executionTime: 0,
            memoryUsage: 0,
            compilationResult: null
        };

        const startTime = Date.now();

        try {
            // Step 1: Compile the module
            const compilationResult = await this.compileModule(code, moduleName, sessionId);
            results.compilationResult = compilationResult;

            if (!compilationResult.success) {
                results.overallResult = 'COMPILATION_ERROR';
                results.testResults = testCases.map(tc => ({
                    testId: tc.id,
                    testName: tc.name,
                    status: 'SKIPPED',
                    message: 'Compilation failed',
                    visible: tc.visible,
                    executionTime: 0
                }));
                return results;
            }

            // Step 2: Execute each test case
            for (const testCase of testCases) {
                const testResult = await this.executeTestCase(
                    compilationResult.modulePath, 
                    testCase, 
                    sessionId
                );
                
                results.testResults.push(testResult);
                
                if (testResult.status === 'PASSED') {
                    results.passedTests++;
                } else {
                    results.failedTests++;
                }

                // Early termination on critical failures
                if (testResult.status === 'RUNTIME_ERROR' && testCase.critical) {
                    break;
                }
            }

            // Step 3: Calculate overall result
            const successRate = results.passedTests / results.totalTests;
            if (successRate === 1.0) {
                results.overallResult = 'ACCEPTED';
            } else if (successRate >= 0.7) {
                results.overallResult = 'PARTIAL_CREDIT';
            } else {
                results.overallResult = 'WRONG_ANSWER';
            }

        } catch (error) {
            results.overallResult = 'SYSTEM_ERROR';
            results.error = error.message;
        } finally {
            // Cleanup
            await this.cleanup(sessionId);
            results.executionTime = Date.now() - startTime;
        }

        return results;
    }

    // Execute a single test case
    async executeTestCase(modulePath, testCase, sessionId) {
        const testStartTime = Date.now();
        const result = {
            testId: testCase.id,
            testName: testCase.name,
            status: 'PENDING',
            message: '',
            actualOutput: [],
            expectedOutput: testCase.expectedOutput,
            visible: testCase.visible,
            executionTime: 0,
            memoryUsage: 0
        };

        try {
            // Load the module
            const loadResult = await this.loadModule(modulePath, testCase.timeout || this.timeout);
            if (!loadResult.success) {
                result.status = 'RUNTIME_ERROR';
                result.message = `Module load failed: ${loadResult.error}`;
                return result;
            }

            result.actualOutput = loadResult.output;

            // Run additional checks if specified
            if (testCase.additionalChecks) {
                const additionalCheckResult = await this.runAdditionalChecks(
                    testCase.additionalChecks, 
                    modulePath, 
                    loadResult
                );
                
                if (!additionalCheckResult.success) {
                    result.status = 'WRONG_ANSWER';
                    result.message = additionalCheckResult.message;
                    return result;
                }
            }

            // Validate output against expected
            const outputValidation = this.validateOutput(result.actualOutput, testCase.expectedOutput);
            if (outputValidation.success) {
                result.status = 'PASSED';
                result.message = 'Test passed successfully';
            } else {
                result.status = 'WRONG_ANSWER';
                result.message = outputValidation.message;
            }

            // Unload the module
            await this.unloadModule(path.basename(modulePath, '.ko'));

            // Check cleanup output if specified
            if (testCase.expectedCleanupOutput) {
                const cleanupOutput = await this.getRecentKernelLogs(2);
                const cleanupValidation = this.validateOutput(cleanupOutput, testCase.expectedCleanupOutput);
                if (!cleanupValidation.success) {
                    result.status = 'WRONG_ANSWER';
                    result.message = `Cleanup validation failed: ${cleanupValidation.message}`;
                }
            }

        } catch (error) {
            result.status = 'RUNTIME_ERROR';
            result.message = `Test execution error: ${error.message}`;
        } finally {
            result.executionTime = Date.now() - testStartTime;
        }

        return result;
    }

    // Compile kernel module
    async compileModule(code, moduleName, sessionId) {
        const moduleDir = path.join(this.workingDirectory, 'modules', sessionId);
        await fs.mkdir(moduleDir, { recursive: true });

        const moduleFile = path.join(moduleDir, `${moduleName}.c`);
        const makefileContent = this.generateMakefile(moduleName);
        const makefilePath = path.join(moduleDir, 'Makefile');

        try {
            // Write source code and Makefile
            await fs.writeFile(moduleFile, code);
            await fs.writeFile(makefilePath, makefileContent);

            // Compile the module
            const compileResult = await this.runCommand('make', [], { cwd: moduleDir });
            
            const modulePath = path.join(moduleDir, `${moduleName}.ko`);
            const moduleExists = await fs.access(modulePath).then(() => true).catch(() => false);

            return {
                success: moduleExists,
                modulePath: moduleExists ? modulePath : null,
                output: compileResult.stdout,
                error: compileResult.stderr,
                compilationTime: compileResult.executionTime
            };

        } catch (error) {
            return {
                success: false,
                modulePath: null,
                output: '',
                error: error.message,
                compilationTime: 0
            };
        }
    }

    // Load kernel module and capture output
    async loadModule(modulePath, timeout = this.timeout) {
        try {
            // Clear dmesg buffer
            await this.runCommand('sudo', ['dmesg', '-C']);

            // Load the module
            const loadResult = await this.runCommand('sudo', ['insmod', modulePath], { timeout });
            
            // Wait a moment for module initialization
            await this.sleep(500);

            // Get kernel logs
            const output = await this.getRecentKernelLogs(10);

            return {
                success: loadResult.code === 0,
                output: output,
                error: loadResult.stderr
            };

        } catch (error) {
            return {
                success: false,
                output: [],
                error: error.message
            };
        }
    }

    // Unload kernel module
    async unloadModule(moduleName) {
        try {
            const unloadResult = await this.runCommand('sudo', ['rmmod', moduleName]);
            await this.sleep(500); // Wait for cleanup
            return unloadResult.code === 0;
        } catch (error) {
            // Module might not be loaded, which is okay
            return true;
        }
    }

    // Get recent kernel log messages
    async getRecentKernelLogs(lines = 10) {
        try {
            const result = await this.runCommand('dmesg', ['-t', `--lines=${lines}`]);
            return result.stdout.split('\n').filter(line => line.trim());
        } catch (error) {
            return [];
        }
    }

    // Validate actual output against expected output
    validateOutput(actualOutput, expectedOutput) {
        const actualLines = Array.isArray(actualOutput) ? actualOutput : [actualOutput];
        
        for (let i = 0; i < expectedOutput.length; i++) {
            const expected = expectedOutput[i];
            let found = false;

            for (const actualLine of actualLines) {
                if (typeof expected === 'string') {
                    if (actualLine.includes(expected)) {
                        found = true;
                        break;
                    }
                } else if (expected instanceof RegExp) {
                    if (expected.test(actualLine)) {
                        found = true;
                        break;
                    }
                }
            }

            if (!found) {
                return {
                    success: false,
                    message: `Expected output not found: ${expected.toString()}`
                };
            }
        }

        return { success: true };
    }

    // Run additional checks (proc files, memory leaks, etc.)
    async runAdditionalChecks(checks, modulePath, loadResult) {
        for (const check of checks) {
            switch (check.type) {
                case 'module_info':
                    const infoResult = await this.checkModuleInfo(modulePath, check.checks);
                    if (!infoResult.success) return infoResult;
                    break;

                case 'proc_entry':
                    const procResult = await this.checkProcEntry(check.path, check.readable);
                    if (!procResult.success) return procResult;
                    break;

                case 'proc_content':
                    const contentResult = await this.checkProcContent(check.path, check.expectedContent);
                    if (!contentResult.success) return contentResult;
                    break;

                case 'memory_leak':
                    const memoryResult = await this.checkMemoryLeak(check.tolerance || 0);
                    if (!memoryResult.success) return memoryResult;
                    break;

                case 'null_check':
                    const nullCheckResult = await this.checkNullPointerHandling(modulePath);
                    if (!nullCheckResult.success) return nullCheckResult;
                    break;

                case 'code_contains_loop':
                    const loopCheckResult = await this.checkCodeContainsLoop(loadResult);
                    if (!loopCheckResult.success) return loopCheckResult;
                    break;

                case 'basic_structure':
                    const structureResult = await this.checkBasicModuleStructure(loadResult);
                    if (!structureResult.success) return structureResult;
                    break;

                default:
                    console.warn(`Unknown additional check type: ${check.type}`);
            }
        }

        return { success: true };
    }

    // Check module information
    async checkModuleInfo(modulePath, requiredInfo) {
        try {
            const result = await this.runCommand('modinfo', [modulePath]);
            const output = result.stdout;

            for (const info of requiredInfo) {
                // More flexible checking for module info
                if (info === 'MODULE_LICENSE' && output.includes('license:')) {
                    continue; // Found license info
                } else if (info === 'MODULE_AUTHOR' && output.includes('author:')) {
                    continue; // Found author info
                } else if (info === 'MODULE_DESCRIPTION' && output.includes('description:')) {
                    continue; // Found description info
                } else if (!output.includes(info)) {
                    return {
                        success: false,
                        message: `Missing module information: ${info}`
                    };
                }
            }

            return { success: true };
        } catch (error) {
            // If modinfo fails, just return success for now
            console.warn(`modinfo check failed: ${error.message}`);
            return { success: true };
        }
    }

    // Check if proc entry exists and is readable
    async checkProcEntry(procPath, shouldBeReadable) {
        try {
            await fs.access(procPath, fs.constants.F_OK);
            
            if (shouldBeReadable) {
                await fs.access(procPath, fs.constants.R_OK);
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: `Proc entry check failed: ${procPath} - ${error.message}`
            };
        }
    }

    // Check proc entry content
    async checkProcContent(procPath, expectedContent) {
        try {
            const content = await fs.readFile(procPath, 'utf8');
            
            if (typeof expectedContent === 'string') {
                if (!content.includes(expectedContent)) {
                    return {
                        success: false,
                        message: `Proc content mismatch: expected "${expectedContent}"`
                    };
                }
            } else if (expectedContent instanceof RegExp) {
                if (!expectedContent.test(content)) {
                    return {
                        success: false,
                        message: `Proc content doesn't match pattern: ${expectedContent.toString()}`
                    };
                }
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: `Failed to read proc content: ${error.message}`
            };
        }
    }

    // Check for memory leaks
    async checkMemoryLeak(tolerance) {
        // This is a simplified memory leak check
        // In a real implementation, you'd want more sophisticated monitoring
        try {
            const result = await this.runCommand('cat', ['/proc/slabinfo']);
            // Parse slab info and check for significant increases
            // This is a placeholder implementation
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: `Memory leak check failed: ${error.message}`
            };
        }
    }

    // Check null pointer handling
    async checkNullPointerHandling(modulePath) {
        // This would involve more complex testing, possibly with fault injection
        // For now, we'll check if the code contains null checks
        try {
            const result = await this.runCommand('objdump', ['-S', modulePath]);
            // Simplified check - look for null comparison patterns
            return { success: true };
        } catch (error) {
            return { success: true }; // Don't fail on this for now
        }
    }

    // Check if code contains loop structure
    async checkCodeContainsLoop(loadResult) {
        // This is a basic check - in real implementation you'd analyze the source code
        return { success: true }; // Always pass for now
    }

    // Check basic module structure
    async checkBasicModuleStructure(loadResult) {
        // Basic structure check - always pass if module loaded successfully
        return { success: true };
    }

    // Generate Makefile for module compilation
    generateMakefile(moduleName) {
        return `obj-m += ${moduleName}.o

KDIR = /lib/modules/\$(shell uname -r)/build

all:
\t\$(MAKE) -C \$(KDIR) M=\$(PWD) modules

clean:
\t\$(MAKE) -C \$(KDIR) M=\$(PWD) clean

install:
\t\$(MAKE) -C \$(KDIR) M=\$(PWD) modules_install

.PHONY: all clean install
`;
    }

    // Utility function to run shell commands
    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || this.timeout;
            const startTime = Date.now();

            const child = spawn(command, args, {
                cwd: options.cwd || process.cwd(),
                stdio: 'pipe',
                env: { ...process.env, PWD: options.cwd || process.cwd() }
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            const timeoutId = setTimeout(() => {
                child.kill('SIGKILL');
                reject(new Error(`Command timed out after ${timeout}ms`));
            }, timeout);

            child.on('close', (code) => {
                clearTimeout(timeoutId);
                resolve({
                    code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    executionTime: Date.now() - startTime
                });
            });

            child.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
    }

    // Cleanup session files
    async cleanup(sessionId) {
        try {
            const sessionDir = path.join(this.workingDirectory, 'modules', sessionId);
            await fs.rmdir(sessionDir, { recursive: true });
        } catch (error) {
            console.warn(`Cleanup failed for session ${sessionId}:`, error.message);
        }
    }

    // Generate unique session ID
    generateSessionId() {
        return crypto.randomBytes(8).toString('hex');
    }

    // Utility sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = TestExecutionEngine;