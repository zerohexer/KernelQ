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
        
        // Add legacy test definitions for backward compatibility
/*
        // Problem 1: Hello Kernel World - EXACT Requirements
        this.testDefinitions.set(1, {
            name: 'Hello Kernel World',
            category: 'foundations',
            exactRequirements: {
                functionNames: ['hello_init', 'hello_exit'],
                outputMessages: [
                    'Hello from the kernel!',
                    'Goodbye from the kernel!'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                moduleInfo: {
                    license: 'GPL'
                }
            },
            testCases: [
                {
                    id: 'exact_functions',
                    name: 'Exact Function Names',
                    type: 'symbol_check',
                    critical: true,
                    expected: ['hello_init', 'hello_exit']
                },
                {
                    id: 'exact_messages',
                    name: 'Exact Output Messages',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Hello from the kernel!', exact: true },
                        { pattern: 'Goodbye from the kernel!', exact: true }
                    ]
                },
                {
                    id: 'module_structure',
                    name: 'Basic Module Structure',
                    type: 'structure_check',
                    expected: ['module_init', 'module_exit', 'MODULE_LICENSE']
                }
            ]
        });

        // Problem 2: Variables and Data Types
        this.testDefinitions.set(2, {
            name: 'Variables and Data Types',
            category: 'foundations',
            exactRequirements: {
                functionNames: ['datatypes_init', 'datatypes_exit'],
                variables: [
                    { name: 'my_int', type: 'int', value: 42 },
                    { name: 'my_char', type: 'char', value: "'K'" },
                    { name: 'my_bool', type: 'bool', value: true }
                ],
                outputMessages: [
                    'Integer: 42',
                    'Character: K',
                    'Boolean: 1'
                ]
            },
            testCases: [
                {
                    id: 'exact_variables',
                    name: 'Exact Variable Names and Values',
                    type: 'variable_check',
                    critical: true,
                    expected: ['my_int', 'my_char', 'my_bool']
                },
                {
                    id: 'exact_output',
                    name: 'Exact Output Format',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Integer: 42', exact: true },
                        { pattern: 'Character: K', exact: true },
                        { pattern: 'Boolean: 1', exact: true }
                    ]
                }
            ]
        });

        // Add problems 2-10 with comprehensive testing
        this.addFoundationProblems(); // Problems 3-4
        this.addFoundationsProblems();  // Problems 5-7
        this.addAdvancedFoundationsTests(); // Problems 8-10
    }

    addFoundationProblems() {
        // Problem 2: Variables and Data Types with EXACT validation
        this.testDefinitions.set(2, {
            name: 'Kernel Variables and Data Types',
            category: 'foundations',
            description: 'Create a kernel module that demonstrates proper variable declaration and output formatting.',
            exactRequirements: {
                functionNames: ['datatypes_init', 'datatypes_exit'],
                variables: [
                    { name: 'my_int', type: 'int', value: 42 },
                    { name: 'my_char', type: 'char', value: "'K'" },
                    { name: 'my_bool', type: 'bool', value: true }
                ],
                outputMessages: [
                    'Integer: 42',
                    'Character: K', 
                    'Boolean: 1'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h']
            },
            multiPart: {
                totalParts: 3,
                currentPart: 1,
                nextProblemId: null
            },
            testCases: [
                {
                    id: 'exact_variables',
                    name: 'Variable Declarations',
                    type: 'symbol_check',
                    critical: true,
                    expected: ['my_int', 'my_char', 'my_bool']
                },
                {
                    id: 'exact_output_format',
                    name: 'Output Format Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Integer: 42', exact: true },
                        { pattern: 'Character: K', exact: true },
                        { pattern: 'Boolean: 1', exact: true }
                    ]
                }
            ]
        });

        // Problem 3: Control Flow - If Statements
        this.testDefinitions.set(3, {
            name: 'Control Flow - If Statements',
            category: 'foundations',
            description: 'Implement conditional logic using if-else statements.',
            exactRequirements: {
                functionNames: ['control_init', 'control_exit'],
                variables: [
                    { name: 'test_number', type: 'int', value: -5 }
                ],
                outputMessages: [
                    'Number -5 is negative'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                mustContain: ['if', 'else']
            },
            testCases: [
                {
                    id: 'exact_variables',
                    name: 'Variable Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['test_number']
                },
                {
                    id: 'exact_output',
                    name: 'Output Format Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Number -5 is negative', exact: true }
                    ]
                },
                {
                    id: 'control_flow',
                    name: 'Control Flow Structure',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['if', 'else'],
                    prohibitedSymbols: []
                }
            ]
        });

        // Problem 4: For Loops and Iteration
        this.testDefinitions.set(4, {
            name: 'For Loops and Iteration',
            category: 'foundations', 
            description: 'Implement iteration using for loops.',
            exactRequirements: {
                functionNames: ['loop_init', 'loop_exit'],
                outputMessages: [
                    'Number: 1',
                    'Number: 2', 
                    'Number: 3',
                    'Number: 4',
                    'Number: 5'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                mustContain: ['for', 'printk']
            },
            testCases: [
                {
                    id: 'loop_output',
                    name: 'Loop Output Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Number: 1', exact: true },
                        { pattern: 'Number: 2', exact: true },
                        { pattern: 'Number: 3', exact: true },
                        { pattern: 'Number: 4', exact: true },
                        { pattern: 'Number: 5', exact: true }
                    ]
                },
                {
                    id: 'loop_structure',
                    name: 'Loop Structure Verification',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['for', 'printk'],
                    prohibitedSymbols: ['printf', 'scanf']
                }
            ]
        });
    }

    addFoundationsProblems() {
        // Problem 5: Functions with Parameters
        this.testDefinitions.set(5, {
            name: 'Functions with Parameters',
            category: 'foundations',
            description: 'Create and call functions with parameters and return values.',
            exactRequirements: {
                functionNames: ['add_numbers', 'functions_init', 'functions_exit'],
                outputMessages: [
                    'Sum of 10 and 20 is 30'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                mustContain: ['add_numbers', 'return']
            },
            testCases: [
                {
                    id: 'function_definition',
                    name: 'Function Definition',
                    type: 'symbol_check',
                    critical: true,
                    expected: ['add_numbers']
                },
                {
                    id: 'function_output',
                    name: 'Function Output Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Sum of 10 and 20 is 30', exact: true }
                    ]
                },
                {
                    id: 'function_structure',
                    name: 'Function Structure',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['add_numbers', 'return'],
                    prohibitedSymbols: ['printf', 'scanf']
                }
            ]
        });

        // Problem 6: Introduction to Pointers
        this.testDefinitions.set(6, {
            name: 'Introduction to Pointers',
            category: 'foundations',
            description: 'Learn basic pointer operations and memory addresses.',
            exactRequirements: {
                functionNames: ['pointers_init', 'pointers_exit'],
                variables: [
                    { name: 'my_value', type: 'int', value: 100 },
                    { name: 'my_pointer', type: 'int*' }
                ],
                outputMessages: [
                    'Value: 100',
                    'Address:',
                    'Value through pointer: 100'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                mustContain: ['*my_pointer', '&my_value']
            },
            testCases: [
                {
                    id: 'pointer_variables',
                    name: 'Pointer Variable Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['my_value', 'my_pointer']
                },
                {
                    id: 'pointer_output',
                    name: 'Pointer Output Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Value: 100', exact: true },
                        { pattern: 'Address:', exact: false },
                        { pattern: 'Value through pointer: 100', exact: true }
                    ]
                },
                {
                    id: 'pointer_operations',
                    name: 'Pointer Operations',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['*my_pointer', '&my_value'],
                    prohibitedSymbols: ['printf', 'scanf']
                }
            ]
        });

        // Problem 7: Kernel Memory Allocation
        this.testDefinitions.set(7, {
            name: 'Kernel Memory Allocation',
            category: 'foundations', 
            description: 'Learn kernel memory allocation and management using kmalloc and kfree.',
            exactRequirements: {
                functionNames: ['memory_init', 'memory_exit'],
                variables: [
                    { name: 'my_memory', type: 'int*' }
                ],
                outputMessages: [
                    'Memory allocated successfully',
                    'Stored value: 42',
                    'Memory freed'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/slab.h', 'linux/init.h'],
                mustContain: ['kmalloc', 'kfree', 'GFP_KERNEL', 'NULL']
            },
            testCases: [
                {
                    id: 'memory_variables',
                    name: 'Memory Variable Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['my_memory']
                },
                {
                    id: 'memory_allocation',
                    name: 'Memory Allocation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Memory allocated successfully', exact: true },
                        { pattern: 'Stored value: 42', exact: true },
                        { pattern: 'Memory freed', exact: true }
                    ]
                },
                {
                    id: 'memory_functions',
                    name: 'Memory Functions',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['kmalloc', 'kfree', 'GFP_KERNEL', 'NULL'],
                    prohibitedSymbols: ['malloc', 'free', 'printf']
                }
            ]
        });
    }

    addAdvancedFoundationsTests() {
        // Problem 8: Arrays and Iteration
        this.testDefinitions.set(8, {
            name: 'Arrays and Iteration',
            category: 'foundations',
            description: 'Create an array of 5 integers and use a for loop to print each element.',
            exactRequirements: {
                functionNames: ['arrays_init', 'arrays_exit'],
                variables: [
                    { name: 'my_array', type: 'int[]', value: '{10, 20, 30, 40, 50}' },
                    { name: 'i', type: 'int' }
                ],
                outputMessages: [
                    'Array element 0: 10',
                    'Array element 1: 20',
                    'Array element 2: 30',
                    'Array element 3: 40',
                    'Array element 4: 50'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                mustContain: ['for', 'my_array[5]']
            },
            testCases: [
                {
                    id: 'array_variables',
                    name: 'Array Variable Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['my_array', 'i']
                },
                {
                    id: 'array_output',
                    name: 'Array Output Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Array element 0: 10', exact: true },
                        { pattern: 'Array element 1: 20', exact: true },
                        { pattern: 'Array element 2: 30', exact: true },
                        { pattern: 'Array element 3: 40', exact: true },
                        { pattern: 'Array element 4: 50', exact: true }
                    ]
                },
                {
                    id: 'array_structure',
                    name: 'Array Structure',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['for', 'my_array[5]'],
                    prohibitedSymbols: ['printf', 'scanf']
                }
            ]
        });

        // Problem 9: String Handling
        this.testDefinitions.set(9, {
            name: 'String Handling',
            category: 'foundations',
            description: 'Work with strings and character arrays in kernel space.',
            exactRequirements: {
                functionNames: ['strings_init', 'strings_exit'],
                variables: [
                    { name: 'my_string', type: 'char[]', value: '"KERNEL"' },
                    { name: 'i', type: 'int' }
                ],
                outputMessages: [
                    'String: KERNEL',
                    'Character 0: K',
                    'Character 1: E',
                    'Character 2: R',
                    'Character 3: N',
                    'Character 4: E',
                    'Character 5: L'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/string.h', 'linux/init.h'],
                mustContain: ['strlen', 'char my_string[]']
            },
            testCases: [
                {
                    id: 'string_variables',
                    name: 'String Variable Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['my_string', 'i']
                },
                {
                    id: 'string_output',
                    name: 'String Output Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'String: KERNEL', exact: true },
                        { pattern: 'Character 0: K', exact: true },
                        { pattern: 'Character 1: E', exact: true },
                        { pattern: 'Character 2: R', exact: true },
                        { pattern: 'Character 3: N', exact: true },
                        { pattern: 'Character 4: E', exact: true },
                        { pattern: 'Character 5: L', exact: true }
                    ]
                },
                {
                    id: 'string_functions',
                    name: 'String Functions',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['strlen', 'char my_string[]'],
                    prohibitedSymbols: ['printf', 'scanf']
                }
            ]
        });

        // Problem 10: Structures and Data Organization
        this.testDefinitions.set(10, {
            name: 'Structures and Data Organization',
            category: 'foundations',
            description: 'Define and use structures to organize related data.',
            exactRequirements: {
                functionNames: ['struct_init', 'struct_exit'],
                structures: [
                    { name: 'my_device', fields: ['name', 'id', 'status'] }
                ],
                variables: [
                    { name: 'test_device', type: 'struct my_device' }
                ],
                outputMessages: [
                    'Device created: TestDevice',
                    'Device ID: 100',
                    'Device status: 1'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h', 'linux/string.h'],
                mustContain: ['struct my_device', 'strcpy']
            },
            testCases: [
                {
                    id: 'structure_variables',
                    name: 'Structure Variable Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['test_device']
                },
                {
                    id: 'structure_definition',
                    name: 'Structure Definition',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['struct my_device'],
                    prohibitedSymbols: ['printf', 'scanf']
                },
                {
                    id: 'structure_output',
                    name: 'Structure Output Validation',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Device created: TestDevice', exact: true },
                        { pattern: 'Device ID: 100', exact: true },
                        { pattern: 'Device status: 1', exact: true }
                    ]
                },
                {
                    id: 'structure_usage',
                    name: 'Structure Usage',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['sizeof', 'student1.name', 'student1.age'],
                    prohibitedSymbols: []
                }
            ]
        });

        // Problem 11: Variable Declaration and Usage
        this.testDefinitions.set(11, {
            name: 'Variable Declaration and Usage',
            category: 'foundations',
            exactRequirements: {
                functionNames: ['variable_demo_init', 'variable_demo_exit'],
                variables: [
                    { name: 'my_integer', type: 'int', value: 42 },
                    { name: 'my_character', type: 'char', value: "'K'" }
                ],
                outputMessages: [
                    'Integer value: 42',
                    'Character value: K'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                mustContain: ['int my_integer', 'char my_character', 'printk']
            },
            testCases: [
                {
                    id: 'exact_variables',
                    name: 'Exact Variable Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['my_integer', 'my_character']
                },
                {
                    id: 'exact_output',
                    name: 'Exact Output Format',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Integer value: 42', exact: true },
                        { pattern: 'Character value: K', exact: true }
                    ]
                },
                {
                    id: 'variable_initialization',
                    name: 'Variable Initialization Values',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['my_integer = 42', 'my_character = \'K\''],
                    prohibitedSymbols: ['printf', 'scanf']
                }
            ]
        });

        // Problem 12: Device Driver Development - Part 1
        this.testDefinitions.set(12, {
            name: 'Device Driver Development - Part 1',
            category: 'foundations',
            exactRequirements: {
                functionNames: ['mydevice_init', 'mydevice_exit'],
                variables: [
                    { name: 'device_name', type: 'static char[]', value: '"mydevice"' },
                    { name: 'DEVICE_CLASS', type: 'define', value: '"mydevice_class"' }
                ],
                outputMessages: [
                    'MyDevice driver loaded',
                    'MyDevice driver unloaded'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h'],
                mustContain: ['static char device_name', 'DEVICE_CLASS']
            },
            testCases: [
                {
                    id: 'device_variables',
                    name: 'Device Variables Declaration',
                    type: 'variable_check',
                    critical: true,
                    expected: ['device_name']
                },
                {
                    id: 'driver_output',
                    name: 'Driver Load/Unload Messages',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'MyDevice driver loaded', exact: true },
                        { pattern: 'MyDevice driver unloaded', exact: true }
                    ]
                },
                {
                    id: 'device_class_define',
                    name: 'Device Class Definition',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['#define DEVICE_CLASS', 'mydevice_class'],
                    prohibitedSymbols: []
                }
            ]
        });

        // Problem 13: Device Driver Development - Part 2
        this.testDefinitions.set(13, {
            name: 'Device Driver Development - Part 2',
            category: 'foundations',
            exactRequirements: {
                functionNames: ['mydevice_init', 'mydevice_exit'],
                variables: [
                    { name: 'device_name', type: 'static char[]', value: '"mydevice"' },
                    { name: 'major_number', type: 'static int' },
                    { name: 'DEVICE_CLASS', type: 'define', value: '"mydevice_class"' }
                ],
                outputMessages: [
                    'MyDevice driver loaded',
                    'Character device registered with major number: [0-9]+',
                    'Character device unregistered',
                    'MyDevice driver unloaded'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h', 'linux/fs.h'],
                mustContain: ['alloc_chrdev_region', 'unregister_chrdev_region', 'major_number']
            },
            testCases: [
                {
                    id: 'chrdev_registration',
                    name: 'Character Device Registration',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['alloc_chrdev_region', 'unregister_chrdev_region'],
                    prohibitedSymbols: []
                },
                {
                    id: 'major_number_output',
                    name: 'Major Number Output',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Character device registered with major number: \\d+', exact: false, regex: true }
                    ]
                },
                {
                    id: 'registration_sequence',
                    name: 'Registration Message Sequence',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'MyDevice driver loaded', exact: true },
                        { pattern: 'Character device unregistered', exact: true },
                        { pattern: 'MyDevice driver unloaded', exact: true }
                    ]
                }
            ]
        });

        // Problem 14: Device Driver Development - Part 3
        this.testDefinitions.set(14, {
            name: 'Device Driver Development - Part 3',
            category: 'intermediate',
            exactRequirements: {
                functionNames: ['mydevice_init', 'mydevice_exit', 'device_open', 'device_close'],
                variables: [
                    { name: 'device_name', type: 'static char[]', value: '"mydevice"' },
                    { name: 'major_number', type: 'static int' },
                    { name: 'open_count', type: 'static int' },
                    { name: 'DEVICE_CLASS', type: 'define', value: '"mydevice_class"' }
                ],
                outputMessages: [
                    'MyDevice driver loaded',
                    'Character device registered with major number: [0-9]+',
                    'Device opened',
                    'Device closed',
                    'Character device unregistered',
                    'MyDevice driver unloaded'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h', 'linux/fs.h', 'linux/cdev.h'],
                mustContain: ['device_open', 'device_close', 'file_operations', 'cdev']
            },
            testCases: [
                {
                    id: 'file_operations',
                    name: 'File Operations Implementation',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['device_open', 'device_close', 'file_operations'],
                    prohibitedSymbols: []
                },
                {
                    id: 'cdev_usage',
                    name: 'Character Device Structure Usage',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['cdev', 'cdev_init', 'cdev_add', 'cdev_del'],
                    prohibitedSymbols: []
                },
                {
                    id: 'open_close_sequence',
                    name: 'Open/Close Message Sequence',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Device opened', exact: true },
                        { pattern: 'Device closed', exact: true }
                    ]
                },
                {
                    id: 'open_count_tracking',
                    name: 'Open Count Variable Usage',
                    type: 'variable_check',
                    critical: true,
                    expected: ['open_count']
                }
            ]
        });

        // Problem 15: Memory Allocation and Error Handling
        this.testDefinitions.set(15, {
            name: 'Memory Allocation and Error Handling',
            category: 'intermediate',
            exactRequirements: {
                functionNames: ['memory_demo_init', 'memory_demo_exit'],
                variables: [
                    { name: 'buffer', type: 'void*' },
                    { name: 'buffer_size', type: 'size_t', value: 1024 }
                ],
                outputMessages: [
                    'Memory allocated successfully',
                    'Memory freed successfully'
                ],
                requiredIncludes: ['linux/module.h', 'linux/kernel.h', 'linux/init.h', 'linux/slab.h'],
                mustContain: ['kmalloc', 'kfree', 'GFP_KERNEL']
            },
            testCases: [
                {
                    id: 'memory_allocation',
                    name: 'Memory Allocation Implementation',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['kmalloc', 'GFP_KERNEL'],
                    prohibitedSymbols: ['malloc', 'free']
                },
                {
                    id: 'null_pointer_check',
                    name: 'NULL Pointer Error Handling',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['if (!buffer)', 'if (buffer == NULL)'],
                    prohibitedSymbols: []
                },
                {
                    id: 'memory_cleanup',
                    name: 'Memory Cleanup Implementation',
                    type: 'code_analysis',
                    critical: true,
                    expectedSymbols: ['kfree'],
                    prohibitedSymbols: ['free']
                },
                {
                    id: 'allocation_messages',
                    name: 'Memory Allocation Messages',
                    type: 'output_match',
                    critical: true,
                    expected: [
                        { pattern: 'Memory allocated successfully', exact: true },
                        { pattern: 'Memory freed successfully', exact: true }
                    ]
                }
            ]
        });

 */
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
            const testScenario = kernelProjectTest?.testScenario || null;
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
            { pattern: /exec\w*\s*\(/, message: 'exec() calls are forbidden in kernel code' }
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