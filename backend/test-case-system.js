// LeetCode-Style Test Case System for Kernel Learning
// Provides comprehensive test case management and execution

class TestCaseSystem {
    constructor() {
        this.testCases = new Map();
        this.problemTestCases = new Map();
        this.initializeDefaultTestCases();
    }

    // Initialize default test cases for common kernel problems
    initializeDefaultTestCases() {
        // Hello World Module Test Cases
        this.addProblemTestCases('hello_world_module', [
            {
                id: 'sample_1',
                visible: true,
                name: 'Basic Module Load/Unload',
                description: 'Test basic module initialization and cleanup',
                expectedOutput: [
                    /Hello.*World.*kernel/i // Flexible pattern matching
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            },
            {
                id: 'hidden_1',
                visible: false,
                name: 'Module Structure Check',
                description: 'Verify basic module structure',
                expectedOutput: [
                    /Hello.*World.*kernel/i
                ],
                additionalChecks: [
                    {
                        type: 'basic_structure',
                        required: true
                    }
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            }
        ]);

        // Variable Declaration and Usage
        this.addProblemTestCases('variable_usage_module', [
            {
                id: 'sample_1',
                visible: true,
                name: 'Integer Variable Declaration',
                description: 'Test integer variable declaration and printing',
                expectedOutput: [
                    /Integer value: \d+/
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            },
            {
                id: 'hidden_1',
                visible: false,
                name: 'Multiple Variable Types',
                description: 'Test multiple variable types and format specifiers',
                expectedOutput: [
                    /Integer value: \d+/,
                    /Character value: [a-zA-Z]/
                ],
                additionalChecks: [
                    {
                        type: 'variable_types',
                        checks: ['int', 'char']
                    }
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            },
            {
                id: 'hidden_2',
                visible: false,
                name: 'Format Specifier Correctness',
                description: 'Ensure correct format specifiers are used',
                expectedOutput: [
                    /Integer value: \d+/
                ],
                additionalChecks: [
                    {
                        type: 'format_validation',
                        checks: ['no_format_mismatch']
                    }
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            }
        ]);

        // Loop Implementation Test Cases  
        this.addProblemTestCases('loop_module', [
            {
                id: 'sample_1',
                visible: true,
                name: 'Basic Loop Implementation',
                description: 'Test basic loop implementation with any range',
                expectedOutput: [
                    /\d+/ // Accept any number output
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            },
            {
                id: 'hidden_1',
                visible: false,
                name: 'Loop Structure Check',
                description: 'Test that code contains a loop structure',
                expectedOutput: [
                    /\d+/ // Accept any number output
                ],
                additionalChecks: [
                    {
                        type: 'code_contains_loop',
                        required: true
                    }
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            }
        ]);

        // Add generic problem test cases that work for any problem
        this.addProblemTestCases('problem_1', [ // Hello Kernel World
            {
                id: 'sample_1',
                visible: true,
                name: 'Basic Compilation',
                description: 'Test that the code compiles successfully',
                expectedOutput: [],
                timeout: 15000,
                memoryLimit: '50MB'
            }
        ]);

        this.addProblemTestCases('problem_2', [ // Variables and Data Types
            {
                id: 'sample_1',
                visible: true,
                name: 'Variable Output Test',
                description: 'Test variable declaration and output',
                expectedOutput: [
                    /\d+/, // Any number
                    /./ // Any character
                ],
                timeout: 15000,
                memoryLimit: '50MB'
            }
        ]);

        // Add test cases for problems 3-50 (basic compilation + output validation)
        for (let i = 3; i <= 50; i++) {
            this.addProblemTestCases(`problem_${i}`, [
                {
                    id: 'sample_1',
                    visible: true,
                    name: 'Compilation and Basic Output',
                    description: 'Test compilation and basic functionality',
                    expectedOutput: [
                        /.+/ // Any non-empty output
                    ],
                    timeout: 15000,
                    memoryLimit: '50MB'
                },
                {
                    id: 'hidden_1',
                    visible: false,
                    name: 'Module Structure',
                    description: 'Verify proper module structure',
                    expectedOutput: [],
                    additionalChecks: [
                        {
                            type: 'basic_structure',
                            required: true
                        }
                    ],
                    timeout: 15000,
                    memoryLimit: '50MB'
                }
            ]);
        }

        // Memory Allocation Test Cases
        this.addProblemTestCases('memory_allocation_module', [
            {
                id: 'sample_1',
                visible: true,
                name: 'Basic Memory Allocation',
                description: 'Test basic kmalloc and kfree',
                expectedOutput: [
                    /Memory allocated successfully/,
                    /Memory freed successfully/
                ],
                timeout: 15000,
                memoryLimit: '50MB'
            },
            {
                id: 'hidden_1',
                visible: false,
                name: 'Null Pointer Check',
                description: 'Test proper null pointer checking',
                expectedOutput: [
                    /Memory allocated successfully/,
                    /Memory freed successfully/
                ],
                additionalChecks: [
                    {
                        type: 'null_check',
                        required: true
                    }
                ],
                timeout: 15000,
                memoryLimit: '50MB'
            },
            {
                id: 'hidden_2',
                visible: false,
                name: 'Memory Leak Detection',
                description: 'Test that all allocated memory is properly freed',
                expectedOutput: [
                    /Memory allocated successfully/,
                    /Memory freed successfully/
                ],
                additionalChecks: [
                    {
                        type: 'memory_leak',
                        tolerance: 0
                    }
                ],
                timeout: 15000,
                memoryLimit: '50MB'
            },
            {
                id: 'hidden_3',
                visible: false,
                name: 'Large Allocation Test',
                description: 'Test handling of larger memory allocations',
                input: {
                    allocation_size: 1024 * 1024 // 1MB
                },
                expectedOutput: [
                    /Memory allocated successfully/,
                    /Memory freed successfully/
                ],
                timeout: 20000,
                memoryLimit: '100MB'
            }
        ]);

        // Function Definition Test Cases
        this.addProblemTestCases('function_definition_module', [
            {
                id: 'sample_1',
                visible: true,
                name: 'Basic Function Definition',
                description: 'Test custom function definition and call',
                expectedOutput: [
                    /Function called successfully/,
                    /Function result: \d+/
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            },
            {
                id: 'hidden_1',
                visible: false,
                name: 'Function Parameter Handling',
                description: 'Test function with parameters',
                expectedOutput: [
                    /Function result: \d+/
                ],
                additionalChecks: [
                    {
                        type: 'function_params',
                        minParams: 1
                    }
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            },
            {
                id: 'hidden_2',
                visible: false,
                name: 'Return Value Validation',
                description: 'Test function return value usage',
                expectedOutput: [
                    /Function result: \d+/
                ],
                additionalChecks: [
                    {
                        type: 'return_value',
                        used: true
                    }
                ],
                timeout: 10000,
                memoryLimit: '10MB'
            }
        ]);

        // Advanced Kernel Concepts
        this.addProblemTestCases('proc_fs_module', [
            {
                id: 'sample_1',
                visible: true,
                name: 'Basic Proc Entry Creation',
                description: 'Test /proc entry creation and basic read',
                expectedOutput: [
                    /Proc entry created successfully/
                ],
                additionalChecks: [
                    {
                        type: 'proc_entry',
                        path: '/proc/kernel_academy_test',
                        readable: true
                    }
                ],
                timeout: 15000,
                memoryLimit: '20MB'
            },
            {
                id: 'hidden_1',
                visible: false,
                name: 'Proc Entry Content Validation',
                description: 'Test proc entry returns correct content',
                expectedOutput: [
                    /Proc entry created successfully/
                ],
                additionalChecks: [
                    {
                        type: 'proc_content',
                        path: '/proc/kernel_academy_test',
                        expectedContent: /Hello from proc/
                    }
                ],
                timeout: 15000,
                memoryLimit: '20MB'
            },
            {
                id: 'hidden_2',
                visible: false,
                name: 'Proper Cleanup',
                description: 'Test proc entry is properly removed on module unload',
                expectedOutput: [
                    /Proc entry created successfully/,
                    /Proc entry removed successfully/
                ],
                additionalChecks: [
                    {
                        type: 'proc_cleanup',
                        path: '/proc/kernel_academy_test',
                        shouldNotExistAfterUnload: true
                    }
                ],
                timeout: 15000,
                memoryLimit: '20MB'
            }
        ]);
    }

    // Add test cases for a specific problem
    addProblemTestCases(problemId, testCases) {
        this.problemTestCases.set(problemId, testCases);
    }

    // Get test cases for a problem (visible only or all)
    getTestCases(problemId, includeHidden = false) {
        let testCases = this.problemTestCases.get(problemId) || [];
        
        // If no test cases exist, create default ones
        if (testCases.length === 0) {
            testCases = this.createDefaultTestCases(problemId);
            this.problemTestCases.set(problemId, testCases);
        }
        
        if (includeHidden) {
            return testCases;
        }
        
        return testCases.filter(tc => tc.visible);
    }

    // Create default test cases for any problem
    createDefaultTestCases(problemId) {
        return [
            {
                id: 'default_compile',
                visible: true,
                name: 'Compilation Test',
                description: 'Test that the code compiles successfully',
                expectedOutput: [], // Any output is fine
                timeout: 15000,
                memoryLimit: '50MB'
            },
            {
                id: 'default_structure',
                visible: false,
                name: 'Basic Structure Check',
                description: 'Verify basic module structure',
                expectedOutput: [],
                additionalChecks: [
                    {
                        type: 'basic_structure',
                        required: true
                    }
                ],
                timeout: 15000,
                memoryLimit: '50MB'
            }
        ];
    }

    // Get visible test cases for frontend display
    getVisibleTestCases(problemId) {
        return this.getTestCases(problemId, false);
    }

    // Get all test cases for backend execution
    getAllTestCases(problemId) {
        return this.getTestCases(problemId, true);
    }

    // Validate test case structure
    validateTestCase(testCase) {
        const required = ['id', 'name', 'description', 'expectedOutput', 'timeout', 'memoryLimit'];
        const missing = required.filter(field => !(field in testCase));
        
        if (missing.length > 0) {
            throw new Error(`Test case missing required fields: ${missing.join(', ')}`);
        }

        // Validate expectedOutput format
        if (!Array.isArray(testCase.expectedOutput)) {
            throw new Error('expectedOutput must be an array of strings or regex patterns');
        }

        return true;
    }

    // Create a new test case
    createTestCase(problemId, testCaseData) {
        this.validateTestCase(testCaseData);
        
        const existingTestCases = this.problemTestCases.get(problemId) || [];
        existingTestCases.push(testCaseData);
        this.problemTestCases.set(problemId, existingTestCases);
        
        return testCaseData;
    }

    // Update existing test case
    updateTestCase(problemId, testCaseId, updates) {
        const testCases = this.problemTestCases.get(problemId) || [];
        const testCaseIndex = testCases.findIndex(tc => tc.id === testCaseId);
        
        if (testCaseIndex === -1) {
            throw new Error(`Test case ${testCaseId} not found for problem ${problemId}`);
        }
        
        const updatedTestCase = { ...testCases[testCaseIndex], ...updates };
        this.validateTestCase(updatedTestCase);
        
        testCases[testCaseIndex] = updatedTestCase;
        this.problemTestCases.set(problemId, testCases);
        
        return updatedTestCase;
    }

    // Delete test case
    deleteTestCase(problemId, testCaseId) {
        const testCases = this.problemTestCases.get(problemId) || [];
        const filteredTestCases = testCases.filter(tc => tc.id !== testCaseId);
        
        if (filteredTestCases.length === testCases.length) {
            throw new Error(`Test case ${testCaseId} not found for problem ${problemId}`);
        }
        
        this.problemTestCases.set(problemId, filteredTestCases);
        return true;
    }

    // Get test case statistics
    getTestCaseStats(problemId) {
        const testCases = this.getAllTestCases(problemId);
        const visible = testCases.filter(tc => tc.visible).length;
        const hidden = testCases.filter(tc => !tc.visible).length;
        
        return {
            total: testCases.length,
            visible,
            hidden,
            problems: Array.from(this.problemTestCases.keys()).length
        };
    }

    // Export test cases for backup/sharing
    exportTestCases(problemId = null) {
        if (problemId) {
            return {
                [problemId]: this.problemTestCases.get(problemId) || []
            };
        }
        
        return Object.fromEntries(this.problemTestCases);
    }

    // Import test cases from backup
    importTestCases(testCaseData) {
        for (const [problemId, testCases] of Object.entries(testCaseData)) {
            // Validate each test case before importing
            testCases.forEach(tc => this.validateTestCase(tc));
            this.problemTestCases.set(problemId, testCases);
        }
        
        return true;
    }
}

module.exports = TestCaseSystem;