// Enhanced Flexible Validation System for Kernel Learning
// Integrates logical correctness validation to prevent conceptual errors

class ValidationSystem {
    constructor() {
        this.successThreshold = 60;
        this.initializeLogicalValidation();
    }

    initializeLogicalValidation() {
        // Import logical validation patterns
        this.logicalPatterns = {
            rcu: {
                required: [
                    { pattern: /rcu_read_lock\s*\(\s*\)/, name: 'rcu_read_lock', weight: 25 },
                    { pattern: /rcu_read_unlock\s*\(\s*\)/, name: 'rcu_read_unlock', weight: 25 },
                    { pattern: /list_add_rcu\s*\(/, name: 'list_add_rcu', weight: 20 },
                    { pattern: /call_rcu\s*\(/, name: 'call_rcu', weight: 20 }
                ],
                forbidden: [
                    { pattern: /list_add\s*\([^_]/, name: 'unsafe_list_add', message: 'Use list_add_rcu() instead of list_add() for RCU synchronization' },
                    { pattern: /list_for_each_entry\s*\([^_]/, name: 'unsafe_list_traversal', message: 'Use list_for_each_entry_rcu() with proper RCU protection' },
                    { pattern: /list_del\s*\([^_]/, name: 'unsafe_list_deletion', message: 'Use list_del_rcu() instead of list_del() for safe concurrent access' }
                ]
            },
            foundations: {
                required: [
                    { pattern: /module_init\s*\(/, name: 'module_init', weight: 20 },
                    { pattern: /module_exit\s*\(/, name: 'module_exit', weight: 20 },
                    { pattern: /MODULE_LICENSE\s*\(/, name: 'MODULE_LICENSE', weight: 15 }
                ],
                forbidden: [
                    { pattern: /\bprintf\s*\(/, name: 'printf_in_kernel', message: 'Use printk() instead of printf() in kernel code' },
                    { pattern: /\bmalloc\s*\(/, name: 'malloc_in_kernel', message: 'Use kmalloc() instead of malloc() in kernel code' },
                    { pattern: /\bfree\s*\(/, name: 'free_in_kernel', message: 'Use kfree() instead of free() in kernel code' },
                    { pattern: /#include\s*<stdio\.h>/, name: 'stdio_header', message: 'Remove stdio.h - not available in kernel space' },
                    { pattern: /\/\/.*❌.*Illogical|\/\*.*❌.*Illogical/, name: 'template_bad_code', message: 'Remove template comments marked as incorrect (❌ Illogical)' },
                    { pattern: /Illogical.*but.*compilable/, name: 'template_description', message: 'This appears to be template/example code marked as "Illogical but compilable"' }
                ]
            },
            synchronization: {
                required: [
                    { pattern: /DEFINE_(SPINLOCK|MUTEX)\s*\(/, name: 'lock_definition', weight: 20 },
                    { pattern: /(spin|mutex)_(lock|unlock)\s*\(/, name: 'lock_usage', weight: 25 }
                ],
                forbidden: [
                    { pattern: /pthread_mutex/, name: 'pthread_in_kernel', message: 'Use kernel synchronization primitives instead of pthread' }
                ]
            },
            memory: {
                required: [],
                forbidden: [
                    { pattern: /\bmalloc\s*\(/, name: 'userspace_malloc', message: 'Use kmalloc() instead of malloc() in kernel' },
                    { pattern: /\bcalloc\s*\(/, name: 'userspace_calloc', message: 'Use kzalloc() instead of calloc() in kernel' }
                ]
            },
            character_device: {
                required: [],
                forbidden: [
                    { pattern: /alloc_chrdev_region\s*\([^,]*,\s*[^,]*,\s*[^,]*,\s*NULL\s*\)/, name: 'null_device_name', message: 'Device name cannot be NULL in alloc_chrdev_region()' },
                    { pattern: /major_number\s*=\s*\d+(?!\s*=\s*MAJOR)/, name: 'hardcoded_major', message: 'Do not hardcode major numbers. Use alloc_chrdev_region() and MAJOR() instead' }
                ]
                // NOTE: Removed logical_checks - these will be verified by post-compilation testing
            },
            pci_driver: {
                required: [],
                forbidden: [
                    // Keep only obvious safety violations and template detection
                    { pattern: /\/\/.*❌.*Illogical|\/\*.*❌.*Illogical/, name: 'intentional_bad_code', message: 'This code contains intentionally incorrect patterns marked as "Illogical"' },
                    { pattern: /printk.*".*probed.*not.*properly.*initialized"/, name: 'admission_of_improper_init', message: 'Code admits device is not properly initialized' },
                    { pattern: /printk.*".*without.*cleanup"/, name: 'admission_of_no_cleanup', message: 'Code admits to missing cleanup operations' }
                ]
                // NOTE: Removed complex logical_checks - these will be verified by post-compilation testing
            },
            module_parameters: {
                required: [
                    { pattern: /module_param\s*\(/, name: 'parameter_definition', weight: 25 },
                    { pattern: /MODULE_PARM_DESC\s*\(/, name: 'parameter_description', weight: 15 }
                ],
                logical_checks: [
                    {
                        name: 'parameter_permissions',
                        check: (code) => {
                            const paramMatches = code.match(/module_param\s*\([^,]+,[^,]+,\s*(\w+)\s*\)/g);
                            if (!paramMatches) return true;
                            // Check for valid permission values (0, 0444, 0644, etc.)
                            return paramMatches.every(match => /0[0-7]{3}|0\b/.test(match));
                        },
                        message: 'Module parameter permissions should be octal values like 0, 0444, or 0644'
                    }
                ]
            }
        };
    }

    // Main validation function with better error reporting
    async validateProblemSolution(problem, userCode) {
        const results = {
            allPassed: false,
            testResults: [],
            compilationResult: null,
            runtimeResult: null,
            score: 0,
            feedback: []
        };

        // STEP 1: Enhanced logical correctness validation (NEW)
        const logicalValidation = this.performLogicalValidation(userCode, problem);
        if (!logicalValidation.passed) {
            results.testResults.push({
                name: 'Logical Correctness Check',
                passed: false,
                message: `Critical Error: ${logicalValidation.error}`,
                suggestions: logicalValidation.fix,
                severity: 'critical'
            });
            results.feedback.push(logicalValidation.fix);
            
            // If critical logical errors, fail immediately
            if (logicalValidation.critical) {
                results.allPassed = false;
                results.score = 0;
                results.feedback.unshift('⚠️ CRITICAL: Code contains dangerous patterns that violate kernel development principles');
                return results;
            }
        } else {
            results.testResults.push({
                name: 'Logical Correctness Check', 
                passed: true,
                message: 'Code follows proper kernel development practices ✓'
            });
        }

        // STEP 2: Basic code quality checks
        const qualityCheck = this.validateCodeQuality(userCode);
        if (!qualityCheck.valid) {
            results.testResults.push({
                name: 'Code Quality Check',
                passed: false,
                message: `Quality Issue: ${qualityCheck.error}`,
                suggestions: qualityCheck.suggestion
            });
            results.feedback.push(qualityCheck.suggestion);
        } else {
            results.testResults.push({
                name: 'Code Quality Check',
                passed: true,
                message: 'Basic code structure looks good ✓'
            });
        }

        // Run flexible tests
        if (problem.tests) {
            for (const test of problem.tests) {
                const result = this.runFlexibleTest(test, userCode);
                results.testResults.push(result);
                
                if (!result.passed && result.suggestions) {
                    results.feedback.push(result.suggestions);
                }
            }
        }

        // Calculate score and provide overall feedback
        const passedTests = results.testResults.filter(t => t.passed).length;
        const totalTests = results.testResults.length;
        results.score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        results.allPassed = results.score >= this.successThreshold;

        // Add encouraging feedback
        if (!results.allPassed) {
            results.feedback.push(this.generateEncouragingFeedback(results.score, passedTests, totalTests));
        }

        return results;
    }

    // Enhanced test runner with syntax checking
    runFlexibleTest(test, userCode) {
        try {
            // First run syntax validation if test supports it
            if (test.syntaxCheck) {
                const syntaxResult = test.syntaxCheck(userCode);
                if (!syntaxResult.valid) {
                    return {
                        name: test.name,
                        passed: false,
                        message: `Syntax Error: ${syntaxResult.error}`,
                        suggestions: syntaxResult.suggestion || 'Check your code syntax'
                    };
                }
            }

            const passed = test.check ? test.check(userCode) : this.flexibleCheck(test, userCode);
            return {
                name: test.name,
                passed: passed,
                message: passed ? 'Test passed ✓' : this.generateHelpfulMessage(test, userCode),
                suggestions: passed ? null : this.generateSuggestions(test, userCode)
            };
        } catch (error) {
            return {
                name: test.name,
                passed: false,
                message: 'Test validation error',
                suggestions: 'Please check your code syntax and try again.'
            };
        }
    }

    // Flexible checking that allows multiple valid approaches
    flexibleCheck(test, userCode) {
        if (test.flexible) {
            return test.flexible.some(check => check(userCode));
        }
        return test.check ? test.check(userCode) : false;
    }

    // Generate helpful error messages
    generateHelpfulMessage(test, userCode) {
        const baseMessage = `${test.name}: Not detected`;
        
        if (test.hints) {
            return `${baseMessage}. Hint: ${test.hints}`;
        }
        
        if (test.examples) {
            return `${baseMessage}. Example: ${test.examples[0]}`;
        }
        
        return baseMessage;
    }

    // Generate specific suggestions for improvement
    generateSuggestions(test, userCode) {
        if (test.suggestions) {
            return test.suggestions;
        }

        // Generic suggestions based on test type
        if (test.name.includes('function')) {
            return 'Try defining a function with appropriate parameters and return type.';
        }
        if (test.name.includes('variable')) {
            return 'Try declaring a variable of the appropriate type.';
        }
        if (test.name.includes('loop')) {
            return 'Try using a loop structure (for, while, or do-while).';
        }
        
        return 'Review the requirements and try a different approach.';
    }

    // Encouraging feedback for partial progress
    generateEncouragingFeedback(score, passed, total) {
        if (score >= 40) {
            return `Good progress! You've passed ${passed}/${total} tests (${score.toFixed(1)}%). You're almost there!`;
        } else if (score >= 20) {
            return `You're on the right track! ${passed}/${total} tests passed. Keep working on the requirements.`;
        } else {
            return `Keep trying! Review the problem requirements and examples. You can do this!`;
        }
    }

    // Overall code quality validation
    validateCodeQuality(code) {
        const validators = this.createSyntaxValidators();
        
        // Run all basic checks
        const basicCheck = validators.checkBasicSyntax(code);
        if (!basicCheck.valid) return basicCheck;
        
        const printkCheck = validators.checkPrintkSyntax(code);
        if (!printkCheck.valid) return printkCheck;
        
        const variableCheck = validators.checkVariableUsage(code);
        if (!variableCheck.valid) return variableCheck;
        
        // Check for bool type usage (requires linux/types.h)
        if (code.includes('bool') && !code.includes('#include <linux/types.h>')) {
            return {
                valid: false,
                error: 'bool type used without including <linux/types.h>',
                suggestion: 'Add #include <linux/types.h> at the top for bool support'
            };
        }
        
        // Check for balanced braces
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            return {
                valid: false,
                error: `Unbalanced braces: ${openBraces} opening, ${closeBraces} closing`,
                suggestion: 'Make sure every { has a matching }'
            };
        }
        
        return { valid: true };
    }

    // Comprehensive syntax validation functions
    createSyntaxValidators() {
        return {
            // Check for basic C syntax errors
            checkBasicSyntax: (code) => {
                // Check for missing semicolons after statements
                const lines = code.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i].trim();
                    
                    // Remove comments from line for analysis
                    line = line.replace(/\/\/.*$/, '').trim();
                    
                    // Skip empty lines, comments, preprocessor directives, and control structures
                    if (!line || line.startsWith('/*') || line.startsWith('*') ||
                        line.startsWith('#') || 
                        line.includes('{') || line.includes('}') ||
                        /^(if|else|for|while|do|switch|case|default|return\s*;)/i.test(line)) {
                        continue;
                    }
                    
                    // Check if line needs semicolon (but already has one)
                    if (/=|int\s+\w+|char\s+\w+|bool\s+\w+|printk\s*\(/i.test(line) && 
                        !line.endsWith(';') && !line.endsWith(',') && !line.endsWith(')')) {
                        return {
                            valid: false,
                            error: `Missing semicolon on line ${i + 1}: "${line}"`,
                            suggestion: 'Add a semicolon (;) at the end of the statement'
                        };
                    }
                }
                return { valid: true };
            },

            // Check printk format string syntax
            checkPrintkSyntax: (code) => {
                // Handle multiline printk statements
                const printkMatches = code.match(/printk\s*\([\s\S]*?\)/g);
                if (!printkMatches) return { valid: true };

                for (const match of printkMatches) {
                    // Check if printk has quotes (allow KERN_INFO, KERN_DEBUG, etc.)
                    if (!/printk\s*\(\s*(KERN_\w+\s+)?"/.test(match)) {
                        return {
                            valid: false,
                            error: `Invalid printk format: ${match}`,
                            suggestion: 'printk format string must be in quotes, e.g., printk(KERN_INFO "format string", variables)'
                        };
                    }

                    // Extract format string and arguments (handle KERN_* macros)
                    const argsMatch = match.match(/printk\s*\(\s*(?:KERN_\w+\s+)?"([^"]*)"(?:\s*,\s*(.+))?\s*\)/);
                    if (argsMatch) {
                        const formatString = argsMatch[1];
                        const argsString = argsMatch[2] || '';
                        
                        // Count format specifiers (expanded to include %s and others)
                        const specifiers = (formatString.match(/%[dicsxupoefgls]/g) || []).length;
                        const args = argsString ? argsString.split(',').map(s => s.trim()).filter(s => s) : [];
                        
                        if (specifiers > 0 && specifiers !== args.length) {
                            return {
                                valid: false,
                                error: `Format specifier mismatch: ${specifiers} specifiers but ${args.length} arguments`,
                                suggestion: 'Make sure the number of % format specifiers matches the number of arguments'
                            };
                        }
                    }
                }
                return { valid: true };
            },

            // Check variable declarations and usage
            checkVariableUsage: (code) => {
                // Find all variable declarations
                const declarations = [];
                const varMatches = code.match(/(int|char|bool|float|double)\s+(\w+)/g);
                if (varMatches) {
                    for (const match of varMatches) {
                        const parts = match.split(/\s+/);
                        declarations.push({type: parts[0], name: parts[1]});
                    }
                }

                // Check format specifier compatibility in printk (handle multiline)
                const printkMatches = code.match(/printk\s*\([\s\S]*?\)/g);
                if (printkMatches) {
                    for (const match of printkMatches) {
                        const argsMatch = match.match(/printk\s*\(\s*(?:KERN_\w+\s+)?"([^"]*)"(?:\s*,\s*([\s\S]+))?\s*\)/);
                        if (argsMatch) {
                            const formatString = argsMatch[1];
                            const argsString = argsMatch[2] || '';
                            const specifiers = formatString.match(/%[dicsxupoefgls]/g) || [];
                            // Handle complex expressions like ternary operators - split by comma but not inside parentheses
                            const args = argsString ? argsString.split(/,(?![^()]*\))/).map(s => s.trim()).filter(s => s) : [];
                            
                            for (let i = 0; i < specifiers.length && i < args.length; i++) {
                                const spec = specifiers[i];
                                const arg = args[i];
                                const declaration = declarations.find(d => d.name === arg);
                                
                                if (declaration) {
                                    // Check type compatibility
                                    if ((spec === '%d' || spec === '%i') && declaration.type !== 'int') {
                                        return {
                                            valid: false,
                                            error: `Type mismatch: ${spec} used with ${declaration.type} variable '${arg}'`,
                                            suggestion: `Use %c for char, %d for int, or declare '${arg}' as int`
                                        };
                                    }
                                    if (spec === '%c' && declaration.type !== 'char') {
                                        return {
                                            valid: false,
                                            error: `Type mismatch: %c used with ${declaration.type} variable '${arg}'`,
                                            suggestion: `Use %d for int, %c for char, or declare '${arg}' as char`
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
                return { valid: true };
            },

            // Check for required includes
            checkRequiredIncludes: (code, requiredIncludes = []) => {
                for (const include of requiredIncludes) {
                    if (!code.includes(include)) {
                        return {
                            valid: false,
                            error: `Missing required include: ${include}`,
                            suggestion: `Add ${include} at the top of your file`
                        };
                    }
                }
                return { valid: true };
            }
        };
    }

    // Create flexible test definitions that accept multiple valid solutions
    createFlexibleTests() {
        const validators = this.createSyntaxValidators();
        
        return {
            // Flexible init function test
            hasInitFunction: {
                name: 'Has module initialization function',
                syntaxCheck: validators.checkBasicSyntax,
                flexible: [
                    code => /__init/.test(code),
                    code => /module_init\s*\(/.test(code),
                    code => /static\s+int\s+\w+_init/.test(code)
                ],
                hints: 'Use __init attribute or module_init() macro',
                examples: ['static int __init my_init(void)', 'module_init(my_init_function);']
            },

            // Flexible exit function test
            hasExitFunction: {
                name: 'Has module cleanup function',
                flexible: [
                    code => /__exit/.test(code),
                    code => /module_exit\s*\(/.test(code),
                    code => /static\s+void\s+\w+_exit/.test(code)
                ],
                hints: 'Use __exit attribute or module_exit() macro',
                examples: ['static void __exit my_exit(void)', 'module_exit(my_exit_function);']
            },

            // Flexible variable declaration (allows any reasonable integer)
            hasIntVariable: {
                name: 'Declares an integer variable',
                flexible: [
                    code => /int\s+\w+\s*=\s*\d+/.test(code),
                    code => /int\s+\w+;/.test(code),
                    code => /static\s+int\s+\w+/.test(code)
                ],
                hints: 'Declare an integer variable with any value',
                examples: ['int my_var = 42;', 'static int count = 0;']
            },

            // Flexible printk usage with enhanced validation
            usesPrintk: {
                name: 'Uses kernel print function correctly',
                syntaxCheck: (code) => {
                    const basicCheck = validators.checkBasicSyntax(code);
                    if (!basicCheck.valid) return basicCheck;
                    
                    const printkCheck = validators.checkPrintkSyntax(code);
                    if (!printkCheck.valid) return printkCheck;
                    
                    return validators.checkVariableUsage(code);
                },
                flexible: [
                    code => /printk\s*\(\s*"/.test(code),
                    code => /pr_info\s*\(\s*"/.test(code),
                    code => /pr_debug\s*\(\s*"/.test(code),
                    code => /pr_warn\s*\(\s*"/.test(code)
                ],
                hints: 'Use printk() with proper format string in quotes and correct format specifiers',
                examples: ['printk(KERN_INFO "Number: %d\\n", num);', 'pr_info("Char: %c\\n", letter);']
            },

            // Flexible loop detection
            hasLoop: {
                name: 'Uses a loop construct',
                flexible: [
                    code => /for\s*\(/.test(code),
                    code => /while\s*\(/.test(code),
                    code => /do\s*{/.test(code)
                ],
                hints: 'Use any type of loop (for, while, or do-while)',
                examples: ['for(int i = 0; i < 10; i++)', 'while(condition)', 'do { ... } while(condition)']
            },

            // Flexible function definition
            definesFunction: {
                name: 'Defines a custom function',
                flexible: [
                    code => /static\s+\w+\s+\w+\s*\([^)]*\)\s*{/.test(code),
                    code => /\w+\s+\w+\s*\([^)]*\)\s*{/.test(code),
                    code => /inline\s+\w+\s+\w+\s*\(/.test(code)
                ],
                hints: 'Define a function with return type, name, and parameters',
                examples: ['static int my_function(int param)', 'void helper_function(void)']
            },

            // Flexible memory allocation
            usesMemoryAllocation: {
                name: 'Uses kernel memory allocation',
                flexible: [
                    code => /kmalloc\s*\(/.test(code),
                    code => /kzalloc\s*\(/.test(code),
                    code => /vmalloc\s*\(/.test(code),
                    code => /kcalloc\s*\(/.test(code)
                ],
                hints: 'Use kernel memory allocation functions',
                examples: ['kmalloc(size, GFP_KERNEL)', 'kzalloc(sizeof(struct), GFP_KERNEL)']
            },

            // Flexible error checking
            checksErrors: {
                name: 'Includes error checking',
                flexible: [
                    code => /if\s*\([^)]*NULL[^)]*\)/.test(code),
                    code => /if\s*\([^)]*==\s*NULL\s*\)/.test(code),
                    code => /if\s*\(!\s*\w+\s*\)/.test(code),
                    code => /if\s*\([^)]*<\s*0\s*\)/.test(code),
                    code => /IS_ERR\s*\(/.test(code)
                ],
                hints: 'Check for errors (NULL pointers, negative return values, etc.)',
                examples: ['if (ptr == NULL)', 'if (!buffer)', 'if (ret < 0)', 'if (IS_ERR(ptr))']
            }
        };
    }

    // Convert old rigid tests to flexible ones
    convertToFlexibleTest(oldTest) {
        const flexibleTests = this.createFlexibleTests();
        
        // Map common test patterns to flexible equivalents
        const testMappings = {
            'Has init function': flexibleTests.hasInitFunction,
            'Has exit function': flexibleTests.hasExitFunction,
            'Declares int variable': flexibleTests.hasIntVariable,
            'Uses printk': flexibleTests.usesPrintk,
            'Uses for loop': flexibleTests.hasLoop,
            'Uses while loop': flexibleTests.hasLoop,
            'Defines.*function': flexibleTests.definesFunction,
            'Uses kmalloc': flexibleTests.usesMemoryAllocation,
            'Checks.*NULL': flexibleTests.checksErrors
        };

        // Find matching flexible test
        for (const [pattern, flexibleTest] of Object.entries(testMappings)) {
            if (new RegExp(pattern, 'i').test(oldTest.name)) {
                return flexibleTest;
            }
        }

        // If no match found, wrap the original test with better error handling
        return {
            name: oldTest.name,
            check: oldTest.check,
            hints: 'Review the problem requirements and examples',
            suggestions: 'Try different approaches that achieve the same goal'
        };
    }

    // Batch convert all tests in a problem to flexible tests
    makeProblemsFlexible(problems) {
        return problems.map(problem => ({
            ...problem,
            tests: problem.tests ? problem.tests.map(test => this.convertToFlexibleTest(test)) : [],
            successThreshold: this.successThreshold // Apply new threshold
        }));
    }

    // NEW: Enhanced logical correctness validation
    performLogicalValidation(code, problem) {
        // Detect problem category
        const category = this.detectProblemCategory(problem);
        const patterns = this.logicalPatterns[category] || this.logicalPatterns.foundations;

        // Check for forbidden patterns (critical errors)
        for (const forbiddenPattern of patterns.forbidden || []) {
            if (forbiddenPattern.pattern.test(code)) {
                return {
                    passed: false,
                    critical: true,
                    error: forbiddenPattern.message,
                    fix: `Replace with correct kernel API: ${forbiddenPattern.message}`,
                    pattern: forbiddenPattern.name
                };
            }
        }

        // Check for missing required patterns (if code seems to need them)
        const missingPatterns = [];
        for (const requiredPattern of patterns.required || []) {
            const shouldRequire = this.shouldRequirePattern(code, requiredPattern, category);
            if (shouldRequire && !requiredPattern.pattern.test(code)) {
                missingPatterns.push(requiredPattern);
            }
        }

        if (missingPatterns.length > 0) {
            const missing = missingPatterns[0]; // Report first missing pattern
            return {
                passed: false,
                critical: missing.weight >= 20,
                error: `Missing required pattern: ${missing.name}`,
                fix: this.getPatternFix(missing.name, category),
                pattern: missing.name
            };
        }

        // Additional contextual checks
        const contextualIssues = this.checkContextualIssues(code, category);
        if (contextualIssues) {
            return contextualIssues;
        }

        // NOTE: Removed complex logical checks - they will be verified by post-compilation testing
        // Only keeping basic safety checks in the forbidden patterns above

        return { passed: true };
    }

    detectProblemCategory(problem) {
        const title = (problem.title || '').toLowerCase();
        const description = (problem.description || '').toLowerCase();
        const code = (problem.starter || '').toLowerCase();
        const text = title + ' ' + description + ' ' + code;

        // Specific problem type detection
        if (text.includes('rcu') || text.includes('read-copy-update')) {
            return 'rcu';
        } else if (text.includes('character device') || text.includes('chrdev') || text.includes('alloc_chrdev_region')) {
            return 'character_device';
        } else if (text.includes('pci driver') || text.includes('pci_device_id') || text.includes('pci_register_driver')) {
            return 'pci_driver';
        } else if (text.includes('module param') || text.includes('module_param') || text.includes('parameter')) {
            return 'module_parameters';
        } else if (text.includes('memory') || text.includes('kmalloc') || text.includes('dma')) {
            return 'memory';
        } else if (text.includes('lock') || text.includes('mutex') || text.includes('sync') || text.includes('atomic')) {
            return 'synchronization';
        } else if (text.includes('device') || text.includes('driver')) {
            return 'device_drivers'; // Generic device driver category
        } else {
            return 'foundations';
        }
    }

    shouldRequirePattern(code, pattern, category) {
        // Smart requirement detection
        if (category === 'foundations') {
            return true; // Always require basic module patterns
        }
        
        if (category === 'character_device') {
            if (pattern.name === 'chrdev_allocation') {
                return /device|character/.test(code) || /major_number/.test(code);
            }
            if (pattern.name === 'major_extraction') {
                return /alloc_chrdev_region/.test(code);
            }
            if (pattern.name === 'chrdev_cleanup') {
                return /alloc_chrdev_region/.test(code);
            }
        }
        
        if (category === 'pci_driver') {
            if (pattern.name === 'pci_device_table') {
                return /pci/.test(code);
            }
            if (pattern.name === 'device_table_export') {
                return /pci_device_id/.test(code);
            }
            if (pattern.name === 'driver_registration') {
                return /pci_driver/.test(code);
            }
        }
        
        if (category === 'module_parameters') {
            if (pattern.name === 'parameter_definition') {
                return /param/.test(code) || /int\s+\w+\s*=/.test(code);
            }
            if (pattern.name === 'parameter_description') {
                return /module_param/.test(code);
            }
        }
        
        if (category === 'rcu') {
            if (pattern.name === 'rcu_read_lock' || pattern.name === 'rcu_read_unlock') {
                return /list_for_each_entry|rcu_head|call_rcu/.test(code);
            }
            if (pattern.name === 'list_add_rcu') {
                return /list_add|list_head/.test(code);
            }
            if (pattern.name === 'call_rcu') {
                return /rcu_head|list_del/.test(code);
            }
        }
        
        return false;
    }

    checkContextualIssues(code, category) {
        // RCU-specific contextual checks
        if (category === 'rcu') {
            // Check for lock/unlock balance
            const lockCount = (code.match(/rcu_read_lock\s*\(\s*\)/g) || []).length;
            const unlockCount = (code.match(/rcu_read_unlock\s*\(\s*\)/g) || []).length;
            
            if (lockCount !== unlockCount) {
                return {
                    passed: false,
                    critical: true,
                    error: `RCU lock/unlock imbalance: ${lockCount} locks vs ${unlockCount} unlocks`,
                    fix: 'Ensure every rcu_read_lock() has a corresponding rcu_read_unlock()'
                };
            }
        }

        // Character device checks
        if (category === 'character_device') {
            const hasAllocation = /alloc_chrdev_region/.test(code);
            const hasUnregister = /unregister_chrdev_region/.test(code);
            
            if (hasAllocation && !hasUnregister) {
                return {
                    passed: false,
                    critical: true,
                    error: 'Character device allocation without cleanup',
                    fix: 'Add unregister_chrdev_region() in module exit function'
                };
            }
        }

        // PCI driver checks
        if (category === 'pci_driver') {
            const hasRegister = /pci_register_driver/.test(code);
            const hasUnregister = /pci_unregister_driver/.test(code);
            
            if (hasRegister && !hasUnregister) {
                return {
                    passed: false,
                    critical: true,
                    error: 'PCI driver registration without cleanup',
                    fix: 'Add pci_unregister_driver() in module exit function'
                };
            }
        }

        // Memory management checks
        if (category === 'memory') {
            const kmallocCount = (code.match(/kmalloc\s*\(/g) || []).length;
            const kfreeCount = (code.match(/kfree\s*\(/g) || []).length;
            
            if (kmallocCount > kfreeCount && kmallocCount > 0) {
                return {
                    passed: false,
                    critical: false,
                    error: `Potential memory leak: ${kmallocCount} kmalloc vs ${kfreeCount} kfree`,
                    fix: 'Add corresponding kfree() calls for each kmalloc()'
                };
            }
        }

        return null;
    }

    getPatternFix(patternName, category) {
        const fixes = {
            // Module basics
            'module_init': 'Add module_init(function_name) macro',
            'module_exit': 'Add module_exit(function_name) macro', 
            'MODULE_LICENSE': 'Add MODULE_LICENSE("GPL") declaration',
            
            // Character device patterns
            'chrdev_allocation': 'Add alloc_chrdev_region(&device_number, 0, 1, device_name)',
            'major_extraction': 'Add major_number = MAJOR(device_number) after allocation',
            'chrdev_cleanup': 'Add unregister_chrdev_region(device_number, 1) in exit function',
            
            // PCI driver patterns
            'pci_device_table': 'Define struct pci_device_id table with your device IDs',
            'device_table_export': 'Add MODULE_DEVICE_TABLE(pci, your_table_name)',
            'driver_registration': 'Add pci_register_driver(&your_driver) call',
            
            // Module parameters
            'parameter_definition': 'Add module_param(variable_name, type, permissions)',
            'parameter_description': 'Add MODULE_PARM_DESC(variable_name, "description")',
            
            // RCU patterns
            'rcu_read_lock': 'Add rcu_read_lock() before accessing RCU-protected data',
            'rcu_read_unlock': 'Add rcu_read_unlock() after RCU critical section',
            'list_add_rcu': 'Use list_add_rcu() for RCU-protected list insertion',
            'call_rcu': 'Use call_rcu() for deferred memory reclamation',
            
            // Synchronization patterns
            'lock_definition': 'Use DEFINE_SPINLOCK() or DEFINE_MUTEX()',
            'lock_usage': 'Use spin_lock()/spin_unlock() for synchronization'
        };
        
        return fixes[patternName] || `Review ${category} development best practices`;
    }
}

// Export the validation system
export default ValidationSystem;

// Helper function to create common flexible test patterns
export const createCommonTests = () => {
    const vs = new ValidationSystem();
    return vs.createFlexibleTests();
};

// Utility function to upgrade existing problem sets
export const upgradeProblems = (existingProblems) => {
    const vs = new ValidationSystem();
    return vs.makeProblemsFlexible(existingProblems);
};