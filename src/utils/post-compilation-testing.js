// Post-Compilation Testing System (LeetCode-style approach)
// Tests actual module behavior after successful compilation

class PostCompilationTester {
    constructor() {
        this.testDefinitions = new Map();
        this.initializeTestDefinitions();
    }

    initializeTestDefinitions() {
        // Character Device Registration Tests
        this.testDefinitions.set('character_device_registration', {
            name: 'Character Device Registration Verification',
            description: 'Verify device is properly registered and accessible',
            testScript: `
#!/bin/bash
set -e

echo "=== Character Device Registration Test ==="

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check if device was registered in /proc/devices
echo "Checking device registration..."
if grep -q "mydevice" /proc/devices; then
    echo "✅ Device found in /proc/devices"
    MAJOR=$(grep "mydevice" /proc/devices | awk '{print $1}')
    echo "✅ Major number: $MAJOR"
else
    echo "❌ Device not found in /proc/devices"
    rmmod student_module || true
    exit 1
fi

# Verify major number extraction
echo "Verifying major number handling..."
dmesg | tail -10 | grep -q "major number: $MAJOR"
if [ $? -eq 0 ]; then
    echo "✅ Major number correctly printed: $MAJOR"
else
    echo "❌ Major number not properly printed"
    rmmod student_module || true
    exit 1
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

# Verify device was unregistered
if ! grep -q "mydevice" /proc/devices; then
    echo "✅ Device properly unregistered"
else
    echo "❌ Device still registered after unload"
    exit 1
fi

echo "✅ ALL CHARACTER DEVICE TESTS PASSED"
`,
            requiredVariables: ['device_name', 'major_number', 'device_number'],
            requiredFunctions: ['mydevice_init', 'mydevice_exit'],
            expectedOutput: [
                'MyDevice driver loaded',
                'Character device registered with major number:',
                'Character device unregistered', 
                'MyDevice driver unloaded'
            ]
        });

        // Character Device with File Operations Tests (Part 3)
        this.testDefinitions.set('character_device_file_operations', {
            name: 'Character Device File Operations Verification',
            description: 'Verify device registration and file operations (open/close)',
            testScript: `
#!/bin/bash
set -e

echo "=== Character Device File Operations Test ==="

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check if device was registered in /proc/devices
echo "Checking device registration..."
if grep -q "mydevice" /proc/devices; then
    echo "✅ Device found in /proc/devices"
    MAJOR=$(grep "mydevice" /proc/devices | awk '{print $1}')
    echo "✅ Major number: $MAJOR"
else
    echo "❌ Device not found in /proc/devices"
    rmmod student_module || true
    exit 1
fi

# Verify major number extraction
echo "Verifying major number handling..."
dmesg | tail -10 | grep -q "major number: $MAJOR"
if [ $? -eq 0 ]; then
    echo "✅ Major number correctly printed: $MAJOR"
else
    echo "❌ Major number not properly printed"
    rmmod student_module || true
    exit 1
fi

# Check for file operation functions
echo "Verifying file operations..."
if objdump -t /tmp/student_module.ko | grep -q "device_open"; then
    echo "✅ device_open function found"
else
    echo "❌ device_open function missing"
    rmmod student_module || true
    exit 1
fi

if objdump -t /tmp/student_module.ko | grep -q "device_close"; then
    echo "✅ device_close function found"
else
    echo "❌ device_close function missing"
    rmmod student_module || true
    exit 1
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

# Verify device was unregistered
if ! grep -q "mydevice" /proc/devices; then
    echo "✅ Device properly unregistered"
else
    echo "❌ Device still registered after unload"
    exit 1
fi

echo "✅ ALL CHARACTER DEVICE FILE OPERATIONS TESTS PASSED"
`,
            requiredVariables: ['device_name', 'major_number', 'device_number', 'my_cdev', 'open_count'],
            requiredFunctions: ['mydevice_init', 'mydevice_exit', 'device_open', 'device_close'],
            expectedOutput: [
                'MyDevice driver loaded',
                'Character device registered with major number:',
                'Device opened',
                'Device closed',
                'Character device unregistered', 
                'MyDevice driver unloaded'
            ]
        });

        // PCI Driver Tests
        this.testDefinitions.set('pci_driver_basic', {
            name: 'PCI Driver Registration Verification',
            description: 'Verify PCI driver is properly registered with error handling',
            testScript: `
#!/bin/bash
set -e

echo "=== PCI Driver Registration Test ==="

# Load the module
echo "Loading PCI module..."
insmod /tmp/student_module.ko

# Check if PCI driver was registered
echo "Checking PCI driver registration..."
if lsmod | grep -q "student_module"; then
    echo "✅ Module loaded successfully"
else
    echo "❌ Module failed to load"
    exit 1
fi

# Check for proper probe function existence
echo "Verifying probe function..."
if objdump -t /tmp/student_module.ko | grep -q "my_pci_probe"; then
    echo "✅ Probe function found"
else
    echo "❌ Probe function missing"
    rmmod student_module || true
    exit 1
fi

# Check for proper error handling in probe
echo "Checking error handling patterns..."
if objdump -d /tmp/student_module.ko | grep -A20 "my_pci_probe" | grep -q "test.*eax"; then
    echo "✅ Error handling detected in probe function"
else
    echo "⚠️ Warning: No obvious error handling in probe function"
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

echo "✅ ALL PCI DRIVER TESTS PASSED"
`,
            requiredVariables: ['my_pci_ids', 'my_pci_driver'],
            requiredFunctions: ['my_pci_probe', 'my_pci_remove', 'pci_init', 'pci_exit'],
            expectedOutput: [
                'PCI driver',
                'registered'
            ]
        });

        // Phase 1 Foundation Tests
        this.testDefinitions.set('foundations_variables', {
            name: 'Variables and Data Types Verification',
            description: 'Verify variable declarations and data type usage',
            testScript: `
#!/bin/bash
set -e

echo "=== Foundation Variables Test ==="

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check for required variable declarations
echo "Checking variable declarations..."
if objdump -t /tmp/student_module.ko | grep -q "my_int"; then
    echo "✅ my_int variable found"
else
    echo "❌ my_int variable missing"
    rmmod student_module || true
    exit 1
fi

if objdump -t /tmp/student_module.ko | grep -q "my_char"; then
    echo "✅ my_char variable found"
else
    echo "❌ my_char variable missing"
    rmmod student_module || true
    exit 1
fi

# Check for expected output
echo "Checking output messages..."
if dmesg | tail -10 | grep -q "Integer value: 42"; then
    echo "✅ Integer output correct"
else
    echo "❌ Integer output incorrect or missing"
    rmmod student_module || true
    exit 1
fi

if dmesg | tail -10 | grep -q "Character value: K"; then
    echo "✅ Character output correct"
else
    echo "❌ Character output incorrect or missing"
    rmmod student_module || true
    exit 1
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

echo "✅ ALL FOUNDATION VARIABLES TESTS PASSED"
`,
            requiredVariables: ['my_int', 'my_char', 'my_bool'],
            requiredFunctions: ['datatypes_init', 'datatypes_exit'],
            expectedOutput: ['Integer value: 42', 'Character value: K', 'Boolean value: 1']
        });

        this.testDefinitions.set('foundations_control_flow', {
            name: 'Control Flow Verification',
            description: 'Verify if-else statements and conditional logic',
            testScript: `
#!/bin/bash
set -e

echo "=== Foundation Control Flow Test ==="

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check for conditional logic output
echo "Checking conditional logic..."
if dmesg | tail -5 | grep -q "Number -5 is negative"; then
    echo "✅ Conditional logic correct"
else
    echo "❌ Conditional logic incorrect or missing"
    rmmod student_module || true
    exit 1
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

echo "✅ ALL FOUNDATION CONTROL FLOW TESTS PASSED"
`,
            requiredVariables: ['test_number'],
            requiredFunctions: ['control_init', 'control_exit'],
            expectedOutput: ['Number -5 is negative']
        });

        this.testDefinitions.set('foundations_functions', {
            name: 'Function Definition and Call Verification',
            description: 'Verify function definition with parameters and function calls',
            testScript: `
#!/bin/bash
set -e

echo "=== Foundation Functions Test ==="

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check for function definition
echo "Checking function symbols..."
if objdump -t /tmp/student_module.ko | grep -q "add_numbers"; then
    echo "✅ add_numbers function found"
else
    echo "❌ add_numbers function missing"
    rmmod student_module || true
    exit 1
fi

# Check for expected output
echo "Checking function call output..."
if dmesg | tail -5 | grep -q "Sum of 10 and 20 is 30"; then
    echo "✅ Function call output correct"
else
    echo "❌ Function call output incorrect or missing"
    rmmod student_module || true
    exit 1
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

echo "✅ ALL FOUNDATION FUNCTIONS TESTS PASSED"
`,
            requiredVariables: [],
            requiredFunctions: ['add_numbers', 'functions_init', 'functions_exit'],
            expectedOutput: ['Sum of 10 and 20 is 30']
        });

        this.testDefinitions.set('foundations_loops', {
            name: 'Loop Iteration Verification',
            description: 'Verify for loop functionality and iteration',
            testScript: `
#!/bin/bash
set -e

echo "=== Foundation Loops Test ==="

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check for loop output
echo "Checking loop iteration..."
for i in 1 2 3 4 5; do
    if dmesg | tail -10 | grep -q "Number: $i"; then
        echo "✅ Loop iteration $i found"
    else
        echo "❌ Loop iteration $i missing"
        rmmod student_module || true
        exit 1
    fi
done

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

echo "✅ ALL FOUNDATION LOOPS TESTS PASSED"
`,
            requiredVariables: [],
            requiredFunctions: ['loop_init', 'loop_exit'],
            expectedOutput: ['Number: 1', 'Number: 2', 'Number: 3', 'Number: 4', 'Number: 5']
        });

        // Problem 1: Hello Kernel World - EXACT Requirements
        this.testDefinitions.set('hello_kernel_world', {
            name: 'Hello Kernel World - Exact Requirements',
            description: 'Verify exact function names and exact output messages',
            testScript: `
#!/bin/bash
set -e

echo "=== Hello Kernel World Exact Test ==="

# Check for exact function names in compiled module
echo "Checking exact function names..."
if objdump -t /tmp/student_module.ko | grep -q "hello_init"; then
    echo "✅ hello_init function found"
else
    echo "❌ hello_init function missing - check function name spelling"
    exit 1
fi

if objdump -t /tmp/student_module.ko | grep -q "hello_exit"; then
    echo "✅ hello_exit function found"
else
    echo "❌ hello_exit function missing - check function name spelling"
    exit 1
fi

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check for EXACT init message
echo "Checking exact init message..."
if dmesg | tail -10 | grep -q "Hello from the kernel!"; then
    echo "✅ Exact init message found: 'Hello from the kernel!'"
else
    echo "❌ Exact init message missing - must be exactly: 'Hello from the kernel!'"
    rmmod student_module || true
    exit 1
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

# Check for EXACT exit message
echo "Checking exact exit message..."
if dmesg | tail -10 | grep -q "Goodbye from the kernel!"; then
    echo "✅ Exact exit message found: 'Goodbye from the kernel!'"
else
    echo "❌ Exact exit message missing - must be exactly: 'Goodbye from the kernel!'"
    exit 1
fi

echo "✅ ALL HELLO KERNEL WORLD TESTS PASSED"
`,
            requiredVariables: [],
            requiredFunctions: ['hello_init', 'hello_exit'],
            expectedOutput: [
                'Hello from the kernel!',
                'Goodbye from the kernel!'
            ]
        });

        // Basic Module Tests (fallback for other problems)
        this.testDefinitions.set('basic_module', {
            name: 'Basic Module Functionality',
            description: 'Verify basic module loading and unloading',
            testScript: `
#!/bin/bash
set -e

echo "=== Basic Module Test ==="

# Load the module
echo "Loading module..."
insmod /tmp/student_module.ko

# Check for init message
echo "Checking init message..."
if dmesg | tail -5 | grep -q "Hello"; then
    echo "✅ Init message found"
else
    echo "❌ Init message missing"
    rmmod student_module || true
    exit 1
fi

# Test module unloading
echo "Testing module cleanup..."
rmmod student_module

# Check for exit message
echo "Checking exit message..."
if dmesg | tail -5 | grep -q -E "(Goodbye|exit|unload)"; then
    echo "✅ Exit message found"
else
    echo "❌ Exit message missing"
    exit 1
fi

echo "✅ ALL BASIC MODULE TESTS PASSED"
`,
            requiredVariables: [],
            requiredFunctions: ['init', 'exit'],
            expectedOutput: [
                'Hello',
                'Goodbye'
            ]
        });
    }

    // Main testing function
    async testCompiledModule(problem, compiledModulePath, compilationOutput) {
        const testType = this.detectTestType(problem);
        const testDef = this.testDefinitions.get(testType);
        
        if (!testDef) {
            return {
                passed: true,
                message: 'No specific tests defined for this problem type',
                tests: []
            };
        }

        console.log(`Running post-compilation tests: ${testDef.name}`);
        
        const results = {
            passed: false,
            message: '',
            tests: [],
            score: 0
        };

        try {
            // 1. Verify required symbols exist in compiled module
            const symbolCheck = await this.verifyRequiredSymbols(
                compiledModulePath, 
                testDef.requiredVariables, 
                testDef.requiredFunctions
            );
            
            results.tests.push(symbolCheck);

            // 2. Verify expected output exists in compilation logs
            const outputCheck = this.verifyExpectedOutput(
                compilationOutput, 
                testDef.expectedOutput
            );
            
            results.tests.push(outputCheck);

            // 3. Run behavioral test script
            const behaviorCheck = await this.runBehavioralTest(
                compiledModulePath,
                testDef.testScript
            );
            
            results.tests.push(behaviorCheck);

            // Calculate overall result
            const passedTests = results.tests.filter(t => t.passed).length;
            const totalTests = results.tests.length;
            results.score = (passedTests / totalTests) * 100;
            results.passed = results.score >= 80; // 80% pass threshold

            if (results.passed) {
                results.message = `✅ All tests passed! Module behavior verified.`;
            } else {
                results.message = `❌ Some tests failed. Module behavior issues detected.`;
            }

        } catch (error) {
            results.tests.push({
                name: 'Test Execution',
                passed: false,
                message: `Test execution failed: ${error.message}`
            });
            results.message = `❌ Testing failed: ${error.message}`;
        }

        return results;
    }

    detectTestType(problem) {
        const title = (problem.title || '').toLowerCase();
        const description = (problem.description || '').toLowerCase();
        const phase = (problem.phase || '').toLowerCase();
        const text = title + ' ' + description;
        const problemId = problem.id;

        // Specific Problem Detection with Exact Requirements
        if (problemId === 1 || title.includes('hello kernel world')) {
            return 'hello_kernel_world'; // Use strict exact requirements test
        }
        
        // Device Driver Multi-Part Series Detection
        if (problemId === 12 || title.includes('device driver development - part 1')) {
            return 'basic_module'; // Part 1 is just basic module structure
        }
        if (problemId === 13 || title.includes('device driver development - part 2') || title.includes('character device registration')) {
            return 'character_device_registration'; // Part 2 adds device registration
        }
        if (problemId === 14 || title.includes('device driver development - part 3') || title.includes('file operations')) {
            return 'character_device_file_operations'; // Part 3 extends device registration with file ops
        }

        // Phase 1 Foundation Problems
        if (phase === 'foundations') {
            if (text.includes('variables') || text.includes('data types')) {
                return 'foundations_variables';
            } else if (text.includes('control flow') || text.includes('if statements')) {
                return 'foundations_control_flow';
            } else if (text.includes('loop') || text.includes('iteration')) {
                return 'foundations_loops';
            } else if (text.includes('function') || text.includes('parameters')) {
                return 'foundations_functions';
            } else if (text.includes('hello') || text.includes('basic')) {
                return 'basic_module'; // Fallback for other hello problems
            } else {
                return 'basic_module'; // Default for foundations
            }
        }

        // Advanced Problems
        if (text.includes('character device')) {
            return 'character_device_registration';
        } else if (text.includes('pci driver') || text.includes('pci device')) {
            return 'pci_driver_basic';
        } else {
            return 'basic_module';
        }
    }

    async verifyRequiredSymbols(modulePath, requiredVars, requiredFuncs) {
        const result = {
            name: 'Symbol Verification',
            passed: false,
            message: '',
            details: []
        };

        try {
            // Use objdump to check for required symbols
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const { stdout } = await execAsync(`objdump -t "${modulePath}"`);
            
            let missingSymbols = [];

            // Check required variables
            for (const varName of requiredVars) {
                if (!stdout.includes(varName)) {
                    missingSymbols.push(`Variable: ${varName}`);
                }
            }

            // Check required functions  
            for (const funcName of requiredFuncs) {
                if (!stdout.includes(funcName)) {
                    missingSymbols.push(`Function: ${funcName}`);
                }
            }

            if (missingSymbols.length === 0) {
                result.passed = true;
                result.message = '✅ All required symbols found';
            } else {
                result.message = `❌ Missing symbols: ${missingSymbols.join(', ')}`;
            }

        } catch (error) {
            result.message = `❌ Symbol verification failed: ${error.message}`;
        }

        return result;
    }

    verifyExpectedOutput(compilationOutput, expectedOutputs) {
        const result = {
            name: 'Output Verification',
            passed: false,
            message: '',
            details: []
        };

        const missingOutputs = [];
        
        for (const expected of expectedOutputs) {
            if (!compilationOutput.toLowerCase().includes(expected.toLowerCase())) {
                missingOutputs.push(expected);
            }
        }

        if (missingOutputs.length === 0) {
            result.passed = true;
            result.message = '✅ All expected outputs found';
        } else {
            result.message = `❌ Missing outputs: ${missingOutputs.join(', ')}`;
        }

        return result;
    }

    async runBehavioralTest(modulePath, testScript) {
        const result = {
            name: 'Behavioral Test',
            passed: false,
            message: '',
            details: []
        };

        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            const fs = require('fs');

            // Copy module to test location
            await execAsync(`cp "${modulePath}" /tmp/student_module.ko`);

            // Write test script to temp file
            const scriptPath = '/tmp/test_script.sh';
            fs.writeFileSync(scriptPath, testScript);
            await execAsync(`chmod +x ${scriptPath}`);

            // Run the test script
            const { stdout, stderr } = await execAsync(scriptPath);

            if (stdout.includes('ALL') && stdout.includes('TESTS PASSED')) {
                result.passed = true;
                result.message = '✅ Behavioral tests passed';
                result.details.push(stdout);
            } else {
                result.message = '❌ Behavioral tests failed';
                result.details.push(stdout, stderr);
            }

        } catch (error) {
            result.message = `❌ Behavioral test execution failed: ${error.message}`;
        }

        return result;
    }
}

export default PostCompilationTester;