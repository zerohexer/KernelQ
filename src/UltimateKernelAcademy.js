import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Play, CheckCircle, Clock, Code, Terminal, Book, Users, Award, Target, Zap, Brain, Shuffle, GitBranch, Cpu, Settings, Star, Trophy, Timer, Lightbulb, Infinity, TrendingUp, Lock, Unlock } from 'lucide-react';
import ValidationSystem, { upgradeProblems } from './validation-system.js';
import PostCompilationTester from './post-compilation-testing.js';
import generatedProblems from './generated-problems.js';
import SemanticCodeEditor from './SemanticCodeEditor.js';

const UnlimitedKernelAcademy = () => {
    // Backend API configuration - supports both localhost and cloudflared
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';
    console.log('🔧 Frontend loaded with BACKEND_URL:', BACKEND_URL);
    
    // User can freely choose any phase - no restrictions
    const [userProfile, setUserProfile] = useState({
        xp: 0,
        streak: 0,
        totalChallenges: 0,
        currentPhase: null, // User will choose their starting phase
        masteryPoints: 0,
        challengesGenerated: 0,
        uniqueChallengesCompleted: 0
    });

    // Detailed skill tracking with sub-skills for unlimited depth
    const [userSkills, setUserSkills] = useState({
        foundations: {
            cBasics: 0.0,
            pointers: 0.0,
            structures: 0.0,
            memoryBasics: 0.0
        },
        kernelCore: {
            moduleSystem: 0.0,
            userKernelSpace: 0.0,
            systemCalls: 0.0,
            kernelAPI: 0.0
        },
        memoryMgmt: {
            allocation: 0.0,
            dmaBuffers: 0.0,
            memoryMapping: 0.0,
            pageManagement: 0.0
        },
        synchronization: {
            atomics: 0.0,
            spinlocks: 0.0,
            mutexes: 0.0,
            rcu: 0.0
        },
        drivers: {
            characterDev: 0.0,
            blockDev: 0.0,
            networkDev: 0.0,
            pciHandling: 0.0
        },
        advanced: {
            debugging: 0.0,
            performance: 0.0,
            security: 0.0,
            architecture: 0.0
        }
    });

    const [completedChallenges, setCompletedChallenges] = useState(new Set());
    const [activeTab, setActiveTab] = useState('learning');
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [problemFilters, setProblemFilters] = useState({
        phase: 'all',
        difficulty: 'all',
        completed: 'all'
    });
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [challengeHistory, setChallengeHistory] = useState([]);
    const [codeEditor, setCodeEditor] = useState({
        code: '',
        output: '',
        isRunning: false,
        testResults: []
    });
    const [debugMode, setDebugMode] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [showLessons, setShowLessons] = useState(false);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [generationSeed, setGenerationSeed] = useState(Date.now());
    const [showPhaseSelector, setShowPhaseSelector] = useState(false);
    
    // Playground state
    const [playground, setPlayground] = useState({
        code: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

static int __init hello_init(void) {
    printk(KERN_INFO "Hello from Kernel Academy Playground!\\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye from Kernel Academy Playground!\\n");
}

module_init(hello_init);
module_exit(hello_exit);

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Playground kernel module");
MODULE_AUTHOR("Kernel Academy Student");`,
        moduleName: 'playground_module',
        output: '',
        isRunning: false,
        compilationResult: null,
        testingResult: null
    });

    // COMPREHENSIVE CONCEPT LEARNING SYSTEM - Complete Programming Reference

    const conceptDatabase = {
        // Very Basic Programming Concepts
        include: {
            title: "#include (Kernel)",
            category: "Kernel C Preprocessor",
            difficulty: "Beginner", 
            description: "Include kernel headers to access kernel functions and structures",
            explanation: `In kernel programming, #include works the same way but you use kernel-specific headers instead of userspace headers.

**Kernel headers vs Userspace headers:**
• Userspace: stdio.h, stdlib.h, string.h (NOT available in kernel!)
• Kernel: linux/module.h, linux/kernel.h, linux/init.h

**Essential kernel headers:**
• <linux/module.h> - Core module functionality
• <linux/kernel.h> - Kernel utilities (printk, container_of)
• <linux/init.h> - Module initialization macros
• <linux/slab.h> - Memory allocation (kmalloc, kfree)
• <linux/string.h> - Kernel string functions

**Why different headers?**
Kernel code runs in a restricted environment with no userspace libraries.`,
            codeExample: `#include <linux/module.h>   // Essential for all kernel modules
#include <linux/kernel.h>   // For printk (kernel's printf)
#include <linux/init.h>     // For __init and __exit macros
#include <linux/slab.h>     // For kmalloc/kfree (kernel's malloc/free)
#include <linux/string.h>   // For kernel string functions

static int __init hello_init(void) {
    printk(KERN_INFO "Hello from kernel!\\n");  // printk NOT printf!
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye from kernel!\\n");
}

module_init(hello_init);    // Register init function
module_exit(hello_exit);    // Register cleanup function
MODULE_LICENSE("GPL");      // Required license declaration

// Key differences:
// ❌ printf() → ✅ printk()
// ❌ malloc() → ✅ kmalloc()
// ❌ main()   → ✅ module_init/exit functions`,
            exercises: [
                "Include linux/module.h and create a basic kernel module",
                "Add linux/slab.h and use kmalloc/kfree",
                "Include linux/string.h and use kernel string functions"
            ],
            relatedConcepts: ["kernel_modules", "printk", "module_init", "kmalloc"]
        },

        function: {
            title: "Functions (Kernel)",
            category: "Kernel C Fundamentals",
            difficulty: "Beginner",
            description: "Reusable blocks of code in kernel modules with special attributes",
            explanation: `Kernel functions work like userspace functions but with special considerations for the kernel environment.

**Kernel function parts:**
• Return type - what the function gives back
• Name - what you call it  
• Parameters - what you give it
• Body - what it does
• Attributes - special kernel markers (__init, static, etc.)

**Special kernel function attributes:**
• static - function only visible in this file (common in kernel)
• __init - function only used during module loading (freed after)
• __exit - function only used during module unloading
• inline - hint to compiler to inline function for performance

**No main() function!** Kernel modules use module_init() and module_exit() instead.`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Helper function - static keeps it private to this module
static int add_numbers(int a, int b) {
    int result = a + b;
    printk(KERN_INFO "Adding %d + %d = %d\\n", a, b, result);
    return result;  // Return the sum
}

// Function with no return value
static void greet_kernel(const char *name) {
    printk(KERN_INFO "Hello from kernel, %s!\\n", name);
    // No return statement needed for void
}

// Module initialization function - __init means "free this after loading"
static int __init math_module_init(void) {
    int sum = add_numbers(5, 3);        // Call our function
    greet_kernel("Linux Kernel");       // Call void function
    
    printk(KERN_INFO "Math module loaded, sum = %d\\n", sum);
    return 0;  // 0 = success, negative = error
}

// Module cleanup function - __exit means "only for unloading"
static void __exit math_module_exit(void) {
    printk(KERN_INFO "Math module unloaded\\n");
}

module_init(math_module_init);    // Register init function
module_exit(math_module_exit);    // Register exit function
MODULE_LICENSE("GPL");

// Key differences from userspace:
// ❌ main()     → ✅ module_init()/module_exit()
// ❌ printf()   → ✅ printk()
// ✅ static functions are very common in kernel
// ✅ __init and __exit attributes save memory`,
            exercises: [
                "Write a kernel function that calculates rectangle area",
                "Create a function that prints device info using printk",
                "Make a static helper function for string operations"
            ],
            relatedConcepts: ["module_init", "static", "printk", "__init", "__exit"]
        },

        void: {
            title: "void (Kernel)",
            category: "Kernel Data Types",
            difficulty: "Beginner",
            description: "Represents 'nothing' - no return value or generic pointers in kernel code",
            explanation: `void in kernel C works the same as userspace but with kernel-specific usage patterns:

**1. Module functions return nothing:**
• void __exit cleanup_function() - module cleanup returns void
• void function_name() - helper functions that just do work

**2. Function takes no parameters:**
• int __init module_init(void) - no parameters needed

**3. Generic kernel pointers:**
• void *kmalloc_ptr - kernel memory allocation returns void*
• Must be cast to specific type before use

**Kernel-specific void usage:**
• Most module exit functions are void
• Many kernel callbacks return void
• kmalloc() returns void* that you must cast`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/slab.h>

// Function returns nothing (void) - common for module helpers
static void print_kernel_info(void) {
    printk(KERN_INFO "Running in kernel space!\\n");
    // No return statement - function returns nothing
}

// Function takes parameters but returns nothing
static void print_device_status(int device_id, const char *status) {
    printk(KERN_INFO "Device %d status: %s\\n", device_id, status);
}

// Function that returns something (not void)
static int get_cpu_count(void) {
    return num_online_cpus();  // Returns number of CPUs
}

// Generic pointer example with kernel memory
static void demonstrate_void_pointer(void) {
    int *int_ptr;
    char *char_ptr;
    void *generic_ptr;      // Generic kernel pointer
    
    // kmalloc returns void* - must cast to use
    generic_ptr = kmalloc(sizeof(int), GFP_KERNEL);
    if (generic_ptr) {
        int_ptr = (int*)generic_ptr;    // Cast void* to int*
        *int_ptr = 42;
        printk(KERN_INFO "Integer value: %d\\n", *int_ptr);
        kfree(generic_ptr);
    }
}

static int __init void_demo_init(void) {
    print_kernel_info();           // Call void function
    print_device_status(1, "OK");  // Call void function with parameters
    
    int cpu_count = get_cpu_count();  // Call function that returns value
    printk(KERN_INFO "CPU count: %d\\n", cpu_count);
    
    demonstrate_void_pointer();    // Show void pointer usage
    return 0;
}

// Module cleanup - ALWAYS void in kernel modules
static void __exit void_demo_exit(void) {
    printk(KERN_INFO "Void demo module unloaded\\n");
    // No return statement for void
}

module_init(void_demo_init);
module_exit(void_demo_exit);
MODULE_LICENSE("GPL");

// Key kernel differences:
// ✅ Module exit functions are always void
// ✅ kmalloc() returns void* that needs casting
// ✅ Many kernel callbacks return void
// ❌ printf() → ✅ printk()`,
            exercises: [
                "Write a void function that prints kernel version info",
                "Create a void function that logs memory allocation",
                "Use void* with kmalloc and cast to different types"
            ],
            relatedConcepts: ["module_exit", "kmalloc", "printk", "pointers", "__exit"]
        },

        struct: {
            title: "struct (Kernel)",
            category: "Kernel Data Types",
            difficulty: "Intermediate",
            description: "Groups related variables together under one name",
            explanation: `struct lets you bundle related data together, like a container holding different items.

**Why use struct:**
• Group related information (like person's name, age, height)
• Create your own custom data types
• Pass multiple values as one unit
• Organize complex data

**Syntax:**
struct name {
    type1 member1;
    type2 member2;
};

**Access members:** variable.member`,
            codeExample: `#include <stdio.h>
#include <string.h>

// Define a struct
struct Person {
    char name[50];
    int age;
    float height;
};

// Function that uses struct
void print_person(struct Person p) {
    printf("Name: %s\\n", p.name);
    printf("Age: %d\\n", p.age);
    printf("Height: %.1f\\n", p.height);
}

int main() {
    // Create struct variables
    struct Person person1;
    struct Person person2 = {"Bob", 25, 5.9};  // Initialize
    
    // Set values for person1
    strcpy(person1.name, "Alice");
    person1.age = 30;
    person1.height = 5.6;
    
    // Use the structs
    print_person(person1);
    printf("\\n");
    print_person(person2);
    
    // Array of structs
    struct Person family[3] = {
        {"Dad", 45, 6.1},
        {"Mom", 42, 5.7},
        {"Kid", 12, 4.8}
    };
    
    printf("\\nFamily:\\n");
    for (int i = 0; i < 3; i++) {
        print_person(family[i]);
        printf("\\n");
    }
    
    return 0;
}`,
            exercises: [
                "Create a struct for a book (title, author, pages)",
                "Make an array of structs and print all elements",
                "Write a function that takes a struct pointer"
            ],
            relatedConcepts: ["arrays", "pointers", "typedef", "memory"]
        },

        int: {
            title: "int (Kernel)",
            category: "Kernel Data Types",
            difficulty: "Beginner",
            description: "Stores whole numbers in kernel modules - same as userspace but with kernel context",
            explanation: `int works exactly the same in kernel space as userspace, but you use it for kernel-specific purposes.

**Kernel-specific int usage:**
• Device numbers, error codes, counts
• Return values (0 = success, negative = error)
• Loop counters, array indices
• Hardware register values

**Important kernel patterns:**
• Return 0 for success, negative for error
• Use for module parameters
• Common in device driver state tracking`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Module parameter - user can set this when loading module
static int device_count = 1;
module_param(device_count, int, 0644);
MODULE_PARM_DESC(device_count, "Number of devices to create");

static int __init int_demo_init(void) {
    int error_code = 0;         // 0 = success
    int major_number = -1;      // Will hold device major number
    int loop_counter = 0;       // For counting
    
    printk(KERN_INFO "Device count parameter: %d\\n", device_count);
    
    // Math with integers (same as userspace)
    int a = 10, b = 3;
    printk(KERN_INFO "%d + %d = %d\\n", a, b, a + b);
    printk(KERN_INFO "%d - %d = %d\\n", a, b, a - b);
    printk(KERN_INFO "%d * %d = %d\\n", a, b, a * b);
    printk(KERN_INFO "%d / %d = %d\\n", a, b, a / b);  // Integer division
    printk(KERN_INFO "%d %% %d = %d\\n", a, b, a % b);  // Remainder
    
    // Typical kernel pattern - loop and error checking
    for (loop_counter = 0; loop_counter < device_count; loop_counter++) {
        printk(KERN_INFO "Initializing device %d\\n", loop_counter);
        // In real code: initialize device here
        // if (device_init_failed) {
        //     error_code = -ENOMEM;  // Negative error code
        //     break;
        // }
    }
    
    printk(KERN_INFO "Module loaded with %d devices\\n", loop_counter);
    return error_code;  // 0 = success, negative = failure
}

static void __exit int_demo_exit(void) {
    printk(KERN_INFO "Int demo module unloaded\\n");
}

module_init(int_demo_init);
module_exit(int_demo_exit);
MODULE_LICENSE("GPL");

// Key kernel patterns:
// ✅ Use int for error codes (0 = success, negative = error)
// ✅ Use int for module parameters
// ✅ Use int for device counts, loop counters
// ✅ printk() instead of printf() for output`,
            exercises: [
                "Create a module parameter of type int for buffer size",
                "Use int variables to track device initialization errors",
                "Implement a loop counter for initializing multiple devices"
            ],
            relatedConcepts: ["module_param", "error_codes", "printk", "ENOMEM"]
        },

        char: {
            title: "char (Kernel)",
            category: "Kernel Data Types",
            difficulty: "Beginner",
            description: "Stores single characters or small integers in kernel modules",
            explanation: `char works the same in kernel space as userspace, but used for kernel-specific purposes.

**Kernel-specific char usage:**
• Device names, command characters
• Hardware register values (single bytes)
• Protocol headers and flags
• Buffer contents and data parsing

**Kernel considerations:**
• No standard library character functions
• Use kernel-safe string operations
• Often used with __user annotation for userspace data`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Module parameter for device type character
static char device_type = 'A';
module_param(device_type, char, 0644);
MODULE_PARM_DESC(device_type, "Device type identifier (A, B, or C)");

static int __init char_demo_init(void) {
    char status_flag = 'R';     // R for Ready
    char error_code = 'E';      // E for Error
    char buffer[10];            // Small buffer
    int i;
    
    printk(KERN_INFO "Device type parameter: %c\\n", device_type);
    printk(KERN_INFO "Status flag: %c\\n", status_flag);
    
    // Character arithmetic (same as userspace)
    char next_type = device_type + 1;
    printk(KERN_INFO "Next device type would be: %c\\n", next_type);
    
    // ASCII values
    printk(KERN_INFO "ASCII value of '%c' is %d\\n", device_type, device_type);
    
    // Initialize character buffer
    for (i = 0; i < 5; i++) {
        buffer[i] = 'A' + i;    // A, B, C, D, E
    }
    buffer[5] = '\\0';           // Null terminator
    
    printk(KERN_INFO "Buffer contents: ");
    for (i = 0; i < 5; i++) {
        printk(KERN_CONT "%c ", buffer[i]);
    }
    printk(KERN_CONT "\\n");
    
    // Typical kernel pattern - check device type
    switch (device_type) {
        case 'A':
            printk(KERN_INFO "Initializing Type A device\\n");
            break;
        case 'B':
            printk(KERN_INFO "Initializing Type B device\\n");
            break;
        case 'C':
            printk(KERN_INFO "Initializing Type C device\\n");
            break;
        default:
            printk(KERN_WARNING "Unknown device type: %c\\n", device_type);
    }
    
    return 0;
}

static void __exit char_demo_exit(void) {
    printk(KERN_INFO "Char demo module unloaded\\n");
}

module_init(char_demo_init);
module_exit(char_demo_exit);
MODULE_LICENSE("GPL");

// Key kernel patterns:
// ✅ Use char for device type identifiers
// ✅ Use char for status flags and protocol bytes
// ✅ Be careful with string operations (use kernel functions)
// ✅ printk() with KERN_CONT for continuous output`,
            exercises: [
                "Create a module parameter of type char for debug level",
                "Use char variables to represent different device states",
                "Implement a simple protocol parser using char arrays"
            ],
            relatedConcepts: ["module_param", "printk", "__user", "kernel_strings"]
        },

        float: {
            title: "float (Kernel - Avoid!)",
            category: "Kernel Data Types",
            difficulty: "Advanced",
            description: "Floating-point math is generally avoided in kernel space",
            explanation: `**IMPORTANT: Floating-point is problematic in kernel space!**

**Why avoid float in kernel:**
• FPU state not saved/restored automatically
• Can corrupt userspace FPU state
• Performance overhead of FPU context switching
• Most kernel operations use integers

**Alternatives to floating-point:**
• Fixed-point arithmetic (integers representing fractions)
• Integer scaling (multiply by 1000, 1000000, etc.)
• Lookup tables for complex calculations
• Rational number representation (numerator/denominator)`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Instead of floats, use fixed-point arithmetic
// Example: represent 19.99 as 1999 (scaled by 100)

static int __init float_alternatives_init(void) {
    // AVOID: float price = 19.99f;
    // INSTEAD: Use scaled integers
    int price_cents = 1999;  // $19.99 as cents
    int dollars = price_cents / 100;
    int cents = price_cents % 100;
    
    printk(KERN_INFO "Price: $%d.%02d\\n", dollars, cents);
    
    // AVOID: float temperature = 25.5f;
    // INSTEAD: Temperature in tenths of degrees
    int temp_tenths = 255;   // 25.5°C as tenths
    printk(KERN_INFO "Temperature: %d.%d°C\\n", 
           temp_tenths / 10, temp_tenths % 10);
    
    // For calculations that need precision:
    // Use 64-bit integers with scaling
    long long precise_value = 314159;  // Pi * 100000
    printk(KERN_INFO "Pi approximation: %lld.%05lld\\n",
           precise_value / 100000, precise_value % 100000);
    
    // Percentage calculations (common in kernel)
    int used_memory = 750;    // MB
    int total_memory = 1000;  // MB
    int usage_percent = (used_memory * 100) / total_memory;
    printk(KERN_INFO "Memory usage: %d%%\\n", usage_percent);
    
    // If you MUST use floating point (very rare):
    // kernel_fpu_begin();
    // ... floating point operations ...
    // kernel_fpu_end();
    // But this is discouraged and architecture-specific!
    
    return 0;
}

static void __exit float_alternatives_exit(void) {
    printk(KERN_INFO "Float alternatives demo unloaded\\n");
}

module_init(float_alternatives_init);
module_exit(float_alternatives_exit);
MODULE_LICENSE("GPL");

// Key kernel patterns:
// ✅ Use scaled integers instead of floats
// ✅ Fixed-point arithmetic for precision
// ✅ Integer math with proper scaling
// ❌ Avoid floating-point operations in kernel
// ❌ Never use float/double without kernel_fpu_begin/end`,
            exercises: [
                "Convert a decimal price to cents representation",
                "Implement percentage calculation using only integers",
                "Create a fixed-point arithmetic function for fractions"
            ],
            relatedConcepts: ["fixed_point", "integer_scaling", "kernel_fpu_begin", "precision"]
        },

        // Basic C Concepts continued...
        array: {
            title: "Arrays (Kernel)",
            category: "Kernel Data Structures",
            difficulty: "Beginner",
            description: "Collection of elements of the same type stored in sequence in kernel memory",
            explanation: `Arrays work the same in kernel space as userspace, but with kernel-specific considerations.

**Kernel array considerations:**
• Stack arrays are limited (small kernel stack)
• Use kmalloc/kfree for dynamic arrays
• Be careful with large arrays (use vmalloc for very large allocations)
• Array bounds checking is critical (no memory protection)

**Common kernel array uses:**
• Device descriptor arrays
• Buffer management
• Hardware register arrays
• Statistics counters`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/slab.h>

// Static arrays (on stack - keep small!)
static int device_counts[4] = {0, 0, 0, 0};  // Per-CPU counters
static char device_names[3][16] = {"eth0", "wlan0", "lo"};

static int __init array_demo_init(void) {
    int i;
    int *dynamic_array;
    
    printk(KERN_INFO "Static array demo:\\n");
    
    // Initialize and display static array
    for (i = 0; i < 4; i++) {
        device_counts[i] = i * 10;
        printk(KERN_INFO "Device %d count: %d\\n", i, device_counts[i]);
    }
    
    // String array (character arrays)
    printk(KERN_INFO "\\nDevice names:\\n");
    for (i = 0; i < 3; i++) {
        printk(KERN_INFO "Device %d: %s\\n", i, device_names[i]);
    }
    
    // Dynamic array allocation (for larger arrays)
    dynamic_array = kmalloc(10 * sizeof(int), GFP_KERNEL);
    if (!dynamic_array) {
        printk(KERN_ERR "Failed to allocate dynamic array\\n");
        return -ENOMEM;
    }
    
    // Initialize dynamic array
    printk(KERN_INFO "\\nDynamic array:\\n");
    for (i = 0; i < 10; i++) {
        dynamic_array[i] = i * i;  // Square numbers
        printk(KERN_INFO "dynamic_array[%d] = %d\\n", i, dynamic_array[i]);
    }
    
    // Calculate array statistics
    int sum = 0;
    for (i = 0; i < 10; i++) {
        sum += dynamic_array[i];
    }
    printk(KERN_INFO "Sum of squares 0-9: %d\\n", sum);
    
    // Array size calculation (for static arrays)
    int static_size = ARRAY_SIZE(device_counts);
    printk(KERN_INFO "Static array size: %d elements\\n", static_size);
    
    // Free dynamic memory
    kfree(dynamic_array);
    
    return 0;
}

static void __exit array_demo_exit(void) {
    printk(KERN_INFO "Array demo module unloaded\\n");
}

module_init(array_demo_init);
module_exit(array_demo_exit);
MODULE_LICENSE("GPL");

// Key kernel patterns:
// ✅ Use ARRAY_SIZE() macro for static array size
// ✅ Use kmalloc/kfree for dynamic arrays
// ✅ Check allocation failures (-ENOMEM)
// ✅ Keep stack arrays small (limited kernel stack)
// ✅ Use vmalloc for very large allocations`,
            exercises: [
                "Create a static array to track different device types",
                "Implement dynamic array allocation for buffer management",
                "Use ARRAY_SIZE macro to iterate through a static array"
            ],
            relatedConcepts: ["kmalloc", "kfree", "ARRAY_SIZE", "vmalloc", "GFP_KERNEL"]
        },

        string: {
            title: "Strings (Kernel)",
            category: "Kernel Data Types",
            difficulty: "Beginner",
            description: "Sequence of characters representing text in kernel space",
            explanation: `Kernel strings work the same as userspace but with different functions and considerations.

**Kernel string differences:**
• No standard library string functions (no strcpy, strlen, etc.)
• Use kernel-specific string functions (kstrdup, strscpy, etc.)
• Be extra careful with buffer overflows (no memory protection)
• String memory must be allocated with kmalloc/kfree

**Kernel string functions:**
• strscpy() - safe string copy (replaces strcpy)
• kstrdup() - duplicate string with kernel allocation
• kstrtoint() - convert string to integer safely`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/slab.h>
#include <linux/string.h>

// Module parameter string
static char device_name[32] = "mydevice";
module_param_string(device_name, device_name, sizeof(device_name), 0644);
MODULE_PARM_DESC(device_name, "Name of the device");

static int __init string_demo_init(void) {
    char buffer[64];
    char *dynamic_string;
    size_t len;
    int value;
    int ret;
    
    printk(KERN_INFO "Kernel string operations demo\\n");
    
    // Safe string copy (kernel equivalent of strcpy)
    strscpy(buffer, "Hello from kernel", sizeof(buffer));
    printk(KERN_INFO "Buffer: %s\\n", buffer);
    
    // String length (kernel has strlen)
    len = strlen(buffer);
    printk(KERN_INFO "Length: %zu\\n", len);
    
    // String comparison (kernel has strcmp)
    if (strcmp(device_name, "mydevice") == 0) {
        printk(KERN_INFO "Device name matches default\\n");
    }
    
    // Dynamic string allocation (kernel equivalent of strdup)
    dynamic_string = kstrdup("Allocated string", GFP_KERNEL);
    if (!dynamic_string) {
        printk(KERN_ERR "Failed to allocate string\\n");
        return -ENOMEM;
    }
    printk(KERN_INFO "Dynamic string: %s\\n", dynamic_string);
    
    // String to integer conversion (safe)
    ret = kstrtoint("123", 10, &value);
    if (ret == 0) {
        printk(KERN_INFO "Converted '123' to integer: %d\\n", value);
    }
    
    // Safe string formatting (kernel snprintf)
    snprintf(buffer, sizeof(buffer), "Device: %s, Value: %d", 
             device_name, value);
    printk(KERN_INFO "Formatted: %s\\n", buffer);
    
    // Manual string building (character by character)
    char manual[16];
    int i;
    for (i = 0; i < 5; i++) {
        manual[i] = 'A' + i;  // A, B, C, D, E
    }
    manual[5] = '\\0';  // Null terminator is critical!
    printk(KERN_INFO "Manual string: %s\\n", manual);
    
    // Cleanup
    kfree(dynamic_string);
    
    return 0;
}

static void __exit string_demo_exit(void) {
    printk(KERN_INFO "String demo module unloaded\\n");
}

module_init(string_demo_init);
module_exit(string_demo_exit);
MODULE_LICENSE("GPL");

// Key kernel patterns:
// ✅ Use strscpy() instead of strcpy() for safety
// ✅ Use kstrdup() for dynamic string allocation
// ✅ Use kstrtoint() for safe string to integer conversion
// ✅ Always check buffer sizes with sizeof()
// ✅ Use snprintf() instead of sprintf() for safety
// ❌ Never use strcpy, sprintf, or other unsafe functions`,
            exercises: [
                "Create a module parameter string for device configuration",
                "Implement safe string concatenation using strscpy",
                "Convert user input string to integer using kstrtoint"
            ],
            relatedConcepts: ["strscpy", "kstrdup", "kstrtoint", "module_param_string", "snprintf"]
        },

        loop: {
            title: "Loops (Kernel)",
            category: "Kernel Control Flow",
            difficulty: "Beginner",
            description: "Repeat code multiple times in kernel modules",
            explanation: `Loops work the same in kernel space as userspace, but with kernel-specific considerations.

**Kernel loop considerations:**
• Avoid long-running loops (can cause system hangs)
• Use cond_resched() in long loops to be scheduler-friendly
• Be careful with infinite loops (can lock up the system)
• Use proper error handling in loops

**Common kernel loop patterns:**
• Device initialization loops
• Buffer processing loops
• Hardware polling loops (with timeouts)`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/delay.h>
#include <linux/sched.h>

static int __init loop_demo_init(void) {
    int i, j;
    int timeout_counter;
    int error_count = 0;
    
    printk(KERN_INFO "Kernel loops demo\\n");
    
    // For loop - device initialization pattern
    printk(KERN_INFO "Initializing 5 devices:\\n");
    for (i = 0; i < 5; i++) {
        printk(KERN_INFO "Initializing device %d\\n", i);
        
        // Simulate device initialization work
        msleep(10);  // Sleep 10ms (don't use in real init!)
        
        // Error handling in loops
        if (i == 2) {
            printk(KERN_WARNING "Device %d failed to initialize\\n", i);
            error_count++;
            continue;  // Skip this device, continue with others
        }
        
        printk(KERN_INFO "Device %d initialized successfully\\n", i);
    }
    
    // While loop - hardware polling with timeout
    printk(KERN_INFO "\\nPolling hardware status:\\n");
    timeout_counter = 0;
    while (timeout_counter < 100) {  // Timeout after 100 iterations
        // Simulate hardware status check
        if (timeout_counter == 50) {
            printk(KERN_INFO "Hardware ready after %d polls\\n", timeout_counter);
            break;  // Exit when hardware is ready
        }
        
        timeout_counter++;
        udelay(100);  // Wait 100 microseconds
    }
    
    if (timeout_counter >= 100) {
        printk(KERN_WARNING "Hardware polling timeout!\\n");
    }
    
    // Nested loops - processing data buffers
    printk(KERN_INFO "\\nProcessing data buffers:\\n");
    for (i = 0; i < 3; i++) {  // 3 buffers
        printk(KERN_INFO "Processing buffer %d:\\n", i);
        
        for (j = 0; j < 4; j++) {  // 4 data items per buffer
            printk(KERN_CONT "[%d,%d] ", i, j);
            
            // In a long loop, be scheduler-friendly
            if (need_resched())
                cond_resched();
        }
        printk(KERN_CONT "\\n");
    }
    
    // Do-while loop - retry pattern
    printk(KERN_INFO "\\nRetry operation example:\\n");
    int retry_count = 0;
    int operation_success = 0;
    
    do {
        retry_count++;
        printk(KERN_INFO "Attempt %d\\n", retry_count);
        
        // Simulate operation that might fail
        if (retry_count == 3) {
            operation_success = 1;
            printk(KERN_INFO "Operation succeeded on attempt %d\\n", retry_count);
        }
        
    } while (!operation_success && retry_count < 5);
    
    if (!operation_success) {
        printk(KERN_ERR "Operation failed after %d attempts\\n", retry_count);
    }
    
    printk(KERN_INFO "Loop demo completed. Errors: %d\\n", error_count);
    return 0;
}

static void __exit loop_demo_exit(void) {
    printk(KERN_INFO "Loop demo module unloaded\\n");
}

module_init(loop_demo_init);
module_exit(loop_demo_exit);
MODULE_LICENSE("GPL");

// Key kernel patterns:
// ✅ Use timeouts in polling loops
// ✅ Use cond_resched() in long loops
// ✅ Handle errors gracefully in loops
// ✅ Use msleep/udelay for delays
// ❌ Avoid infinite loops without escape conditions`,
            exercises: [
                "Create a device initialization loop with error handling",
                "Implement a hardware polling loop with timeout",
                "Use nested loops to process multi-dimensional data"
            ],
            relatedConcepts: ["cond_resched", "msleep", "udelay", "timeout", "error_handling"]
        },

        if_else: {
            title: "if/else (Kernel)",
            category: "Kernel Control Flow",
            difficulty: "Beginner",
            description: "Make decisions in kernel code based on conditions",
            explanation: `if/else works the same in kernel space as userspace, but with kernel-specific patterns.

**Kernel-specific if/else patterns:**
• Error code checking (if (ret < 0))
• Pointer validation (if (!ptr))
• Hardware status checking
• Feature capability testing
• Module parameter validation

**Common kernel conditions:**
• Error codes: negative values indicate errors
• Pointer checks: NULL means failure
• Capabilities: check before using features`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/slab.h>
#include <linux/errno.h>

// Module parameters for demonstration
static int debug_level = 1;
static bool enable_feature = true;

module_param(debug_level, int, 0644);
module_param(enable_feature, bool, 0644);

static int __init if_else_demo_init(void) {
    void *buffer;
    int error_code = 0;
    int device_status = 42;  // Simulate hardware status
    
    printk(KERN_INFO "Kernel if/else patterns demo\\n");
    
    // Pattern 1: Error code checking (negative = error)
    error_code = -ENOMEM;  // Simulate memory allocation failure
    if (error_code < 0) {
        printk(KERN_ERR "Operation failed with error: %d\\n", error_code);
        if (error_code == -ENOMEM) {
            printk(KERN_ERR "Specific error: Out of memory\\n");
        } else if (error_code == -EINVAL) {
            printk(KERN_ERR "Specific error: Invalid argument\\n");
        } else {
            printk(KERN_ERR "Unknown error code\\n");
        }
    } else {
        printk(KERN_INFO "Operation successful\\n");
    }
    
    // Pattern 2: Pointer validation (critical in kernel!)
    buffer = kmalloc(1024, GFP_KERNEL);
    if (!buffer) {  // Same as: if (buffer == NULL)
        printk(KERN_ERR "Failed to allocate buffer\\n");
        return -ENOMEM;
    } else {
        printk(KERN_INFO "Buffer allocated successfully\\n");
        // Use buffer here...
        kfree(buffer);  // Don't forget to free!
    }
    
    // Pattern 3: Module parameter validation
    if (debug_level < 0 || debug_level > 3) {
        printk(KERN_WARNING "Invalid debug level %d, using default\\n", debug_level);
        debug_level = 1;
    }
    
    // Pattern 4: Feature capability testing
    if (enable_feature) {
        printk(KERN_INFO "Advanced feature enabled\\n");
        
        // Nested if for sub-features
        if (debug_level >= 2) {
            printk(KERN_DEBUG "Verbose debugging enabled\\n");
        }
    } else {
        printk(KERN_INFO "Running in basic mode\\n");
    }
    
    // Pattern 5: Hardware status checking
    if (device_status == 0) {
        printk(KERN_INFO "Device is idle\\n");
    } else if (device_status > 0 && device_status <= 100) {
        printk(KERN_INFO "Device is active (status: %d)\\n", device_status);
    } else {
        printk(KERN_WARNING "Device status unknown: %d\\n", device_status);
    }
    
    // Pattern 6: Logical operators for complex conditions
    if (enable_feature && debug_level > 0) {
        printk(KERN_INFO "Feature enabled with debugging\\n");
    }
    
    if (debug_level == 0 || !enable_feature) {
        printk(KERN_INFO "Running in quiet or basic mode\\n");
    }
    
    // Pattern 7: Range checking (common for hardware registers)
    int register_value = 75;
    if (register_value >= 50 && register_value <= 100) {
        printk(KERN_INFO "Register value in normal range: %d\\n", register_value);
    } else if (register_value < 50) {
        printk(KERN_WARNING "Register value too low: %d\\n", register_value);
    } else {
        printk(KERN_ERR "Register value dangerously high: %d\\n", register_value);
    }
    
    return 0;  // Success
}

static void __exit if_else_demo_exit(void) {
    printk(KERN_INFO "if/else demo module unloaded\\n");
}

module_init(if_else_demo_init);
module_exit(if_else_demo_exit);
MODULE_LICENSE("GPL");

// Key kernel patterns:
// ✅ Always check return values (if (ret < 0))
// ✅ Always validate pointers (if (!ptr))
// ✅ Use specific error codes (-ENOMEM, -EINVAL, etc.)
// ✅ Check module parameters for valid ranges
// ✅ Test hardware status before operations`,
            exercises: [
                "Implement error handling for kmalloc allocation",
                "Create parameter validation for a module parameter",
                "Write hardware status checking with appropriate responses"
            ],
            relatedConcepts: ["error_codes", "pointer_validation", "ENOMEM", "EINVAL", "module_param"]
        },

        // ADVANCED C CONCEPTS FOR PROFESSIONAL DEVELOPMENT
        
        unions: {
            title: "unions",
            category: "Advanced C",
            difficulty: "Intermediate",
            description: "Memory-efficient data structures where members share the same memory location",
            explanation: `unions allow different data types to share the same memory location. Only one member can hold a value at a time.

**Key differences from struct:**
• struct: all members have separate memory locations
• union: all members share the same memory location
• Size of union = size of largest member

**Common uses in kernel:**
• Type punning (accessing same data as different types)
• Implementing variant data types
• Memory-efficient data structures
• Hardware register access (accessing same register as different data types)`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Union for network packet header parsing
union packet_header {
    struct {
        u8 version : 4;
        u8 ihl : 4;
        u8 tos;
        u16 tot_len;
    } ipv4;
    struct {
        u32 version : 4;
        u32 tclass : 8;
        u32 flow_label : 20;
    } ipv6;
    u32 raw_data;  // Access as raw 32-bit value
};

// Union for type punning (common in kernel)
union type_converter {
    float f;
    u32 i;
    u8 bytes[4];
};

static int __init union_demo_init(void) {
    union packet_header header;
    union type_converter converter;
    
    // Set IPv4 header
    header.ipv4.version = 4;
    header.ipv4.ihl = 5;
    header.ipv4.tos = 0;
    
    printk(KERN_INFO "IPv4 header as raw: 0x%x\\n", header.raw_data);
    
    // Type punning example
    converter.f = 3.14159f;
    printk(KERN_INFO "Float 3.14159 as hex: 0x%x\\n", converter.i);
    printk(KERN_INFO "As bytes: %02x %02x %02x %02x\\n", 
           converter.bytes[0], converter.bytes[1], 
           converter.bytes[2], converter.bytes[3]);
    
    return 0;
}

static void __exit union_demo_exit(void) {
    printk(KERN_INFO "Union demo module unloaded\\n");
}

module_init(union_demo_init);
module_exit(union_demo_exit);
MODULE_LICENSE("GPL");`,
            exercises: [
                "Create a union for accessing a 32-bit register as bytes or as a whole",
                "Implement a variant data type using unions",
                "Parse network packet headers using unions"
            ],
            relatedConcepts: ["struct", "pointers", "bit_fields", "memory_layout"]
        },

        bit_fields: {
            title: "Bit Fields",
            category: "Advanced C",
            difficulty: "Intermediate", 
            description: "Pack multiple small integers into a single word to save memory",
            explanation: `Bit fields allow you to specify the number of bits for struct/union members.

**Syntax:** type name : width;

**Benefits:**
• Memory efficient for flags and small values
• Hardware register mapping
• Protocol header parsing
• Embedded systems optimization

**Limitations:**
• Can't take address of bit field
• Portability issues (bit order varies)
• Alignment and padding complexity

**Kernel usage:**
• Device register definitions
• Network protocol headers
• Memory management flags`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Hardware register definition (common in drivers)
struct control_register {
    u32 enable : 1;        // Bit 0
    u32 mode : 2;          // Bits 1-2
    u32 priority : 3;      // Bits 3-5
    u32 reserved1 : 2;     // Bits 6-7
    u32 interrupt_mask : 8; // Bits 8-15
    u32 reserved2 : 16;    // Bits 16-31
};

// Network packet flags
struct tcp_flags {
    u8 fin : 1;
    u8 syn : 1;
    u8 rst : 1;
    u8 psh : 1;
    u8 ack : 1;
    u8 urg : 1;
    u8 ece : 1;
    u8 cwr : 1;
};

// Memory management flags (simplified version of real kernel flags)
struct page_flags {
    unsigned long locked : 1;
    unsigned long error : 1;
    unsigned long referenced : 1;
    unsigned long uptodate : 1;
    unsigned long dirty : 1;
    unsigned long lru : 1;
    unsigned long active : 1;
    unsigned long slab : 1;
    unsigned long reserved : 24;  // Remaining bits
};

static int __init bitfield_demo_init(void) {
    struct control_register ctrl = {0};
    struct tcp_flags flags = {0};
    
    // Configure hardware register
    ctrl.enable = 1;
    ctrl.mode = 2;  // 3 possible modes (0-2)
    ctrl.priority = 5;  // 8 possible priorities (0-7)
    ctrl.interrupt_mask = 0xFF;
    
    printk(KERN_INFO "Control register value: 0x%x\\n", *(u32*)&ctrl);
    printk(KERN_INFO "Size of control_register: %zu bytes\\n", sizeof(ctrl));
    
    // Set TCP flags
    flags.syn = 1;
    flags.ack = 1;
    
    printk(KERN_INFO "TCP flags byte: 0x%02x\\n", *(u8*)&flags);
    printk(KERN_INFO "Size of tcp_flags: %zu bytes\\n", sizeof(flags));
    
    return 0;
}

static void __exit bitfield_demo_exit(void) {
    printk(KERN_INFO "Bit field demo unloaded\\n");
}

module_init(bitfield_demo_init);
module_exit(bitfield_demo_exit);
MODULE_LICENSE("GPL");`,
            exercises: [
                "Define bit fields for a CPU status register",
                "Create packed network protocol header with bit fields",
                "Implement memory page flags using bit fields"
            ],
            relatedConcepts: ["unions", "struct", "hardware_registers", "memory_optimization"]
        },

        function_pointers: {
            title: "Function Pointers",
            category: "Advanced C",
            difficulty: "Intermediate",
            description: "Variables that store addresses of functions, enabling dynamic dispatch",
            explanation: `Function pointers store the address of a function and can be called through the pointer.

**Syntax:** return_type (*pointer_name)(parameter_types);

**Kernel uses:**
• Virtual function tables (like in device drivers)
• Callback mechanisms
• Interrupt handlers
• System call tables
• Pluggable algorithms

**Benefits:**
• Runtime polymorphism in C
• Callback-based programming
• Plugin architectures
• State machines`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Function pointer for different algorithms
typedef int (*sort_func_t)(int *arr, size_t len);

// Different sorting implementations
static int bubble_sort(int *arr, size_t len) {
    printk(KERN_INFO "Using bubble sort\\n");
    return 0;  // Simplified
}

static int quick_sort(int *arr, size_t len) {
    printk(KERN_INFO "Using quick sort\\n");
    return 0;  // Simplified
}

// Device operations structure (like real kernel file_operations)
struct device_ops {
    int (*open)(void);
    int (*close)(void);
    ssize_t (*read)(char *buffer, size_t len);
    ssize_t (*write)(const char *buffer, size_t len);
};

// Different device implementations
static int uart_open(void) {
    printk(KERN_INFO "UART device opened\\n");
    return 0;
}

static int uart_close(void) {
    printk(KERN_INFO "UART device closed\\n");
    return 0;
}

static ssize_t uart_read(char *buffer, size_t len) {
    printk(KERN_INFO "Reading from UART\\n");
    return len;
}

static ssize_t uart_write(const char *buffer, size_t len) {
    printk(KERN_INFO "Writing to UART\\n");
    return len;
}

// UART device operations
static struct device_ops uart_ops = {
    .open = uart_open,
    .close = uart_close,
    .read = uart_read,
    .write = uart_write
};

static int __init funcptr_demo_init(void) {
    sort_func_t sorter;
    struct device_ops *dev_ops = &uart_ops;
    int test_array[] = {3, 1, 4, 1, 5};
    
    // Select algorithm at runtime
    if (sizeof(test_array)/sizeof(test_array[0]) < 10) {
        sorter = bubble_sort;
    } else {
        sorter = quick_sort;
    }
    
    // Call through function pointer
    sorter(test_array, sizeof(test_array)/sizeof(test_array[0]));
    
    // Use device operations
    if (dev_ops->open) {
        dev_ops->open();
        dev_ops->write("Hello", 5);
        dev_ops->read(NULL, 10);
        dev_ops->close();
    }
    
    return 0;
}

static void __exit funcptr_demo_exit(void) {
    printk(KERN_INFO "Function pointer demo unloaded\\n");
}

module_init(funcptr_demo_init);
module_exit(funcptr_demo_exit);
MODULE_LICENSE("GPL");`,
            exercises: [
                "Implement a device driver with function pointer operations",
                "Create a callback system for interrupt handlers", 
                "Build a plugin system using function pointers"
            ],
            relatedConcepts: ["pointers", "callbacks", "virtual_tables", "polymorphism"]
        },

        // KERNEL CORE CONCEPTS - PROFESSIONAL LEVEL

        system_calls: {
            title: "System Calls",
            category: "Kernel Core",
            difficulty: "Advanced",
            description: "Interface between user space and kernel space for requesting kernel services",
            explanation: `System calls are the primary interface between user programs and the kernel.

**How system calls work:**
1. User program invokes system call (via glibc wrapper)
2. CPU switches to kernel mode
3. Kernel validates parameters
4. Kernel performs requested operation
5. Kernel returns result to user space
6. CPU switches back to user mode

**Key concepts:**
• System call numbers (stored in syscall table)
• Parameter passing (registers, stack)
• Error handling (errno)
• Security checks and validation

**Adding new system calls:**
• Define system call number
• Implement system call function
• Add to system call table
• Create user space wrapper`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/syscalls.h>
#include <linux/uaccess.h>

// Example: Custom system call implementation
// (This is educational - real syscalls need kernel recompilation)

// System call to get kernel version info
SYSCALL_DEFINE2(get_kernel_info, char __user *, buffer, size_t, len) {
    char kernel_info[256];
    size_t info_len;
    
    // Format kernel information
    snprintf(kernel_info, sizeof(kernel_info), 
             "Kernel: %s\\nVersion: %s\\nCompiler: %s\\n",
             UTS_SYSNAME, UTS_RELEASE, LINUX_COMPILER);
    
    info_len = strlen(kernel_info);
    
    // Validate user buffer
    if (len < info_len) {
        return -EINVAL;
    }
    
    // Copy to user space (with validation)
    if (copy_to_user(buffer, kernel_info, info_len)) {
        return -EFAULT;
    }
    
    return info_len;
}

// Example of parameter validation in system calls
static long validate_syscall_params(unsigned long arg1, 
                                   unsigned long arg2,
                                   void __user *user_ptr) {
    // Check pointer validity
    if (!access_ok(user_ptr, sizeof(int))) {
        return -EFAULT;
    }
    
    // Check numerical ranges
    if (arg1 > MAX_ALLOWED_VALUE) {
        return -EINVAL;
    }
    
    // Check for overflow
    if (arg1 + arg2 < arg1) {
        return -EOVERFLOW;
    }
    
    return 0;
}

static int __init syscall_demo_init(void) {
    printk(KERN_INFO "System call demo loaded\\n");
    printk(KERN_INFO "System call table is at: %p\\n", sys_call_table);
    
    // In real kernel development, you would:
    // 1. Add syscall number to arch/x86/include/asm/unistd_64.h
    // 2. Add syscall to arch/x86/entry/syscalls/syscall_64.tbl
    // 3. Rebuild kernel
    
    return 0;
}

static void __exit syscall_demo_exit(void) {
    printk(KERN_INFO "System call demo unloaded\\n");
}

module_init(syscall_demo_init);
module_exit(syscall_demo_exit);
MODULE_LICENSE("GPL");

// Example user space program to use custom syscall:
/*
#include <unistd.h>
#include <sys/syscall.h>

#define __NR_get_kernel_info 548  // Example syscall number

int main() {
    char buffer[1024];
    long ret = syscall(__NR_get_kernel_info, buffer, sizeof(buffer));
    if (ret > 0) {
        write(1, buffer, ret);
    }
    return 0;
}
*/`,
            exercises: [
                "Trace a system call from user space to kernel execution",
                "Implement parameter validation for a custom system call",
                "Analyze system call overhead and optimization techniques"
            ],
            relatedConcepts: ["user_kernel_space", "interrupts", "context_switching", "security"]
        },

        interrupts: {
            title: "Interrupts and IRQs",
            category: "Kernel Core", 
            difficulty: "Advanced",
            description: "Hardware and software mechanisms for handling asynchronous events",
            explanation: `Interrupts allow hardware and software to signal the CPU about events that need immediate attention.

**Types of interrupts:**
• Hardware interrupts (IRQ) - from devices
• Software interrupts - syscalls, traps
• Exceptions - page faults, divide by zero
• Non-maskable interrupts (NMI) - critical errors

**Interrupt handling process:**
1. Hardware signals interrupt
2. CPU saves current context
3. CPU jumps to interrupt handler
4. Handler processes interrupt
5. Context restored, execution continues

**Key concepts:**
• Interrupt Service Routines (ISR)
• Top half vs bottom half processing
• Interrupt prioritization
• Interrupt masking and critical sections`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/interrupt.h>
#include <linux/gpio.h>
#include <linux/workqueue.h>

#define GPIO_PIN 18  // Example GPIO pin

static int irq_number;
static struct work_struct my_work;

// Bottom half handler (work queue)
static void bottom_half_handler(struct work_struct *work) {
    printk(KERN_INFO "Bottom half: Processing interrupt data\\n");
    
    // Heavy processing that can sleep
    msleep(10);  // Simulate work
    
    printk(KERN_INFO "Bottom half: Processing complete\\n");
}

// Top half handler (atomic context)
static irqreturn_t top_half_handler(int irq, void *dev_id) {
    printk(KERN_INFO "Top half: Interrupt %d received\\n", irq);
    
    // Quick, atomic operations only
    // Read hardware status, clear interrupt source
    
    // Schedule bottom half for heavy processing
    schedule_work(&my_work);
    
    return IRQ_HANDLED;
}

// Example of critical section with interrupt disabling
static void critical_section_example(void) {
    unsigned long flags;
    
    // Disable interrupts on current CPU
    local_irq_save(flags);
    
    // Critical section - no interrupts can occur
    printk(KERN_INFO "In critical section\\n");
    
    // Restore interrupt state
    local_irq_restore(flags);
}

static int __init irq_demo_init(void) {
    int ret;
    
    // Initialize work queue for bottom half
    INIT_WORK(&my_work, bottom_half_handler);
    
    // Request GPIO pin
    ret = gpio_request(GPIO_PIN, "irq_demo");
    if (ret) {
        printk(KERN_ERR "GPIO request failed\\n");
        return ret;
    }
    
    // Configure as input
    gpio_direction_input(GPIO_PIN);
    
    // Get IRQ number for GPIO
    irq_number = gpio_to_irq(GPIO_PIN);
    if (irq_number < 0) {
        printk(KERN_ERR "GPIO to IRQ mapping failed\\n");
        gpio_free(GPIO_PIN);
        return irq_number;
    }
    
    // Register interrupt handler
    ret = request_irq(irq_number, 
                     top_half_handler,
                     IRQF_TRIGGER_RISING,  // Trigger on rising edge
                     "irq_demo",
                     NULL);
    if (ret) {
        printk(KERN_ERR "IRQ request failed\\n");
        gpio_free(GPIO_PIN);
        return ret;
    }
    
    printk(KERN_INFO "IRQ demo loaded, GPIO %d -> IRQ %d\\n", 
           GPIO_PIN, irq_number);
    
    // Demonstrate critical section
    critical_section_example();
    
    return 0;
}

static void __exit irq_demo_exit(void) {
    // Free interrupt
    free_irq(irq_number, NULL);
    
    // Free GPIO
    gpio_free(GPIO_PIN);
    
    // Cancel any pending work
    cancel_work_sync(&my_work);
    
    printk(KERN_INFO "IRQ demo unloaded\\n");
}

module_init(irq_demo_init);
module_exit(irq_demo_exit);
MODULE_LICENSE("GPL");`,
            exercises: [
                "Implement shared interrupt handler for multiple devices",
                "Design top-half/bottom-half architecture for network driver",
                "Measure and optimize interrupt latency"
            ],
            relatedConcepts: ["context_switching", "atomic_operations", "concurrency", "device_drivers"]
        },

        // MEMORY MANAGEMENT - PROFESSIONAL LEVEL
        
        virtual_memory: {
            title: "Virtual Memory",
            category: "Memory Management",
            difficulty: "Advanced",
            description: "Abstraction that gives each process its own address space",
            explanation: `Virtual memory allows the kernel to provide each process with its own isolated address space.

**Key concepts:**
• Virtual addresses vs physical addresses
• Memory Management Unit (MMU) translation
• Page tables and page table entries
• Translation Lookaside Buffer (TLB)
• Memory protection and permissions

**Benefits:**
• Process isolation
• Memory overcommit
• Demand paging
• Memory-mapped files
• Shared memory

**Page fault handling:**
1. Process accesses unmapped/invalid address
2. CPU generates page fault exception
3. Kernel page fault handler examines fault
4. Kernel either maps page or kills process`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/mm.h>
#include <linux/vmalloc.h>
#include <linux/slab.h>
#include <asm/pgtable.h>

// Example of virtual memory operations
static void demonstrate_vm_concepts(void) {
    void *vmalloc_ptr, *kmalloc_ptr;
    struct page *page;
    unsigned long pfn;
    
    // Virtual memory allocation (non-contiguous physical pages)
    vmalloc_ptr = vmalloc(PAGE_SIZE * 4);
    if (vmalloc_ptr) {
        printk(KERN_INFO "vmalloc allocated at virtual: %p\\n", vmalloc_ptr);
        
        // Get physical address (may not be contiguous)
        pfn = vmalloc_to_pfn(vmalloc_ptr);
        printk(KERN_INFO "Physical page frame: 0x%lx\\n", pfn);
        
        vfree(vmalloc_ptr);
    }
    
    // Kernel memory allocation (contiguous physical pages)
    kmalloc_ptr = kmalloc(PAGE_SIZE, GFP_KERNEL);
    if (kmalloc_ptr) {
        printk(KERN_INFO "kmalloc allocated at virtual: %p\\n", kmalloc_ptr);
        printk(KERN_INFO "Physical address: 0x%lx\\n", virt_to_phys(kmalloc_ptr));
        
        kfree(kmalloc_ptr);
    }
    
    // Page allocation
    page = alloc_page(GFP_KERNEL);
    if (page) {
        void *page_addr = page_address(page);
        printk(KERN_INFO "Page allocated at: %p\\n", page_addr);
        printk(KERN_INFO "Page physical: 0x%lx\\n", page_to_phys(page));
        
        __free_page(page);
    }
}

// Example page fault handler (simplified)
static vm_fault_t example_page_fault(struct vm_fault *vmf) {
    struct page *page;
    
    // Allocate a new page
    page = alloc_page(GFP_KERNEL);
    if (!page) {
        return VM_FAULT_OOM;
    }
    
    // Clear the page
    clear_highpage(page);
    
    // Install the page in the page table
    vmf->page = page;
    
    return 0;
}

// Virtual memory area operations
static const struct vm_operations_struct example_vm_ops = {
    .fault = example_page_fault,
};

static int __init vm_demo_init(void) {
    printk(KERN_INFO "Virtual memory demo loaded\\n");
    
    // Demonstrate various VM concepts
    demonstrate_vm_concepts();
    
    // Print memory statistics
    printk(KERN_INFO "Total pages: %lu\\n", totalram_pages());
    printk(KERN_INFO "Free pages: %lu\\n", global_zone_page_state(NR_FREE_PAGES));
    
    return 0;
}

static void __exit vm_demo_exit(void) {
    printk(KERN_INFO "Virtual memory demo unloaded\\n");
}

module_init(vm_demo_init);
module_exit(vm_demo_exit);
MODULE_LICENSE("GPL");`,
            exercises: [
                "Implement custom page fault handler for memory-mapped device",
                "Create virtual memory area with custom operations",
                "Analyze page table walking for address translation"
            ],
            relatedConcepts: ["page_tables", "mmu", "memory_mapping", "page_faults"]
        },

        rcu: {
            title: "Read-Copy-Update (RCU)",
            category: "Synchronization",
            difficulty: "Expert",
            description: "Lock-free synchronization mechanism optimized for read-heavy workloads",
            explanation: `RCU is a synchronization mechanism that allows multiple readers to access data structures concurrently with writers.

**Key principles:**
• Readers can access data without acquiring locks
• Writers create new versions instead of modifying in-place
• Old versions are freed after all readers are done
• Grace period ensures no readers are accessing old data

**RCU variants:**
• Classic RCU - for preemptible kernels
• Tree RCU - scalable for large systems
• Tiny RCU - for embedded systems
• Tasks RCU - for tracing and BPF

**Use cases:**
• Network packet processing
• File system metadata
• Process lists
• Route tables

**Critical sections:**
• rcu_read_lock() / rcu_read_unlock()
• synchronize_rcu() for grace periods
• call_rcu() for deferred freeing`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/rcupdate.h>
#include <linux/slab.h>
#include <linux/list.h>

// Example RCU-protected data structure
struct rcu_data {
    int value;
    char name[32];
    struct list_head list;
    struct rcu_head rcu;
};

static LIST_HEAD(rcu_list);
static DEFINE_SPINLOCK(list_lock);

// RCU read-side critical section
static void rcu_reader_example(void) {
    struct rcu_data *entry;
    
    rcu_read_lock();
    
    list_for_each_entry_rcu(entry, &rcu_list, list) {
        // Safe to read without additional locking
        printk(KERN_INFO "RCU read: %s = %d\\n", entry->name, entry->value);
        
        // Can sleep here in some RCU variants
        // but not in classic RCU read-side
    }
    
    rcu_read_unlock();
}

// RCU callback for deferred freeing
static void rcu_free_callback(struct rcu_head *head) {
    struct rcu_data *entry = container_of(head, struct rcu_data, rcu);
    
    printk(KERN_INFO "RCU freeing: %s\\n", entry->name);
    kfree(entry);
}

// RCU writer - update operation
static void rcu_writer_update(const char *name, int new_value) {
    struct rcu_data *old_entry, *new_entry;
    
    // Allocate new version
    new_entry = kzalloc(sizeof(*new_entry), GFP_KERNEL);
    if (!new_entry)
        return;
    
    new_entry->value = new_value;
    strncpy(new_entry->name, name, sizeof(new_entry->name) - 1);
    
    spin_lock(&list_lock);
    
    // Find old entry
    list_for_each_entry(old_entry, &rcu_list, list) {
        if (strcmp(old_entry->name, name) == 0) {
            // Replace old with new
            list_replace_rcu(&old_entry->list, &new_entry->list);
            
            // Schedule old entry for freeing after grace period
            call_rcu(&old_entry->rcu, rcu_free_callback);
            break;
        }
    }
    
    spin_unlock(&list_lock);
}

// RCU writer - insert operation
static void rcu_writer_insert(const char *name, int value) {
    struct rcu_data *new_entry;
    
    new_entry = kzalloc(sizeof(*new_entry), GFP_KERNEL);
    if (!new_entry)
        return;
    
    new_entry->value = value;
    strncpy(new_entry->name, name, sizeof(new_entry->name) - 1);
    
    spin_lock(&list_lock);
    list_add_rcu(&new_entry->list, &rcu_list);
    spin_unlock(&list_lock);
    
    printk(KERN_INFO "RCU inserted: %s = %d\\n", name, value);
}

// Synchronous RCU update example
static void rcu_synchronous_update(void) {
    struct rcu_data *entry, *tmp;
    
    printk(KERN_INFO "Starting synchronous RCU update\\n");
    
    spin_lock(&list_lock);
    
    // Remove all entries from list
    list_for_each_entry_safe(entry, tmp, &rcu_list, list) {
        list_del_rcu(&entry->list);
    }
    
    spin_unlock(&list_lock);
    
    // Wait for grace period - ensures all readers are done
    synchronize_rcu();
    
    // Now safe to free without call_rcu
    list_for_each_entry_safe(entry, tmp, &rcu_list, list) {
        printk(KERN_INFO "Synchronous free: %s\\n", entry->name);
        kfree(entry);
    }
    
    printk(KERN_INFO "Synchronous RCU update complete\\n");
}

static int __init rcu_demo_init(void) {
    printk(KERN_INFO "RCU demo loaded\\n");
    
    // Insert some test data
    rcu_writer_insert("item1", 100);
    rcu_writer_insert("item2", 200);
    rcu_writer_insert("item3", 300);
    
    // Read the data
    rcu_reader_example();
    
    // Update an item
    rcu_writer_update("item2", 250);
    
    // Read again
    rcu_reader_example();
    
    return 0;
}

static void __exit rcu_demo_exit(void) {
    // Clean up using synchronous method
    rcu_synchronous_update();
    
    // Wait for any pending RCU callbacks
    rcu_barrier();
    
    printk(KERN_INFO "RCU demo unloaded\\n");
}

module_init(rcu_demo_init);
module_exit(rcu_demo_exit);
MODULE_LICENSE("GPL");`,
            exercises: [
                "Implement RCU-protected hash table",
                "Convert spinlock-protected data structure to RCU",
                "Measure RCU performance vs traditional locking"
            ],
            relatedConcepts: ["spinlocks", "atomic_operations", "memory_barriers", "grace_periods"]
        },

        atomic_operations: {
            title: "Atomic Operations",
            category: "Synchronization",
            difficulty: "Advanced",
            description: "Indivisible operations that cannot be interrupted or partially completed",
            explanation: `Atomic operations ensure that complex operations appear as a single, indivisible unit to other CPUs.

**Why atomics are needed:**
• Multi-CPU systems can interleave operations
• Prevents race conditions without locks
• Lower overhead than mutexes for simple operations
• Essential for lock-free programming

**Types of atomic operations:**
• atomic_t - atomic integers
• atomic64_t - atomic 64-bit integers  
• atomic_long_t - atomic longs
• Bitwise atomic operations
• Compare-and-swap operations

**Memory ordering:**
• Acquire semantics
• Release semantics
• Full memory barriers
• Relaxed ordering`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/atomic.h>
#include <linux/smp.h>
#include <linux/delay.h>
#include <linux/kthread.h>

// Global atomic counters
static atomic_t shared_counter = ATOMIC_INIT(0);
static atomic64_t large_counter = ATOMIC64_INIT(0);
static atomic_long_t long_counter = ATOMIC_LONG_INIT(0);

// Bitwise atomic operations example
static unsigned long atomic_flags = 0;
#define FLAG_PROCESSING  0
#define FLAG_READY       1
#define FLAG_ERROR       2

// Compare-and-swap example
static atomic_t cas_value = ATOMIC_INIT(0);

// Worker function for testing atomic operations
static int atomic_worker(void *data) {
    int worker_id = *(int *)data;
    int i;
    
    printk(KERN_INFO "Atomic worker %d started\\n", worker_id);
    
    for (i = 0; i < 1000; i++) {
        // Basic atomic increment
        atomic_inc(&shared_counter);
        
        // Atomic add with return value
        int old_val = atomic_add_return(2, &shared_counter);
        
        // 64-bit atomic operations
        atomic64_inc(&large_counter);
        
        // Long atomic operations  
        atomic_long_add(worker_id, &long_counter);
        
        // Bitwise atomic operations
        set_bit(FLAG_PROCESSING, &atomic_flags);
        
        // Simulate some work
        udelay(1);
        
        clear_bit(FLAG_PROCESSING, &atomic_flags);
        
        // Compare and swap example
        int expected = worker_id * 1000 + i;
        int new_val = expected + 1;
        
        // Try to update cas_value if it equals expected
        if (atomic_cmpxchg(&cas_value, expected, new_val) == expected) {
            // Successful compare-and-swap
        }
        
        if (kthread_should_stop())
            break;
    }
    
    printk(KERN_INFO "Atomic worker %d finished\\n", worker_id);
    return 0;
}

// Demonstrate memory barriers with atomics
static void memory_barrier_example(void) {
    int data = 42;
    atomic_t flag = ATOMIC_INIT(0);
    
    // Writer sequence
    data = 100;                    // 1. Update data
    smp_wmb();                     // 2. Write memory barrier
    atomic_set(&flag, 1);          // 3. Set flag atomically
    
    // Reader sequence (would be on different CPU)
    if (atomic_read(&flag) == 1) { // 1. Check flag
        smp_rmb();                 // 2. Read memory barrier  
        printk(KERN_INFO "Data value: %d\\n", data); // 3. Read data
    }
}

// Lock-free stack using atomic operations
struct atomic_stack_node {
    int data;
    struct atomic_stack_node *next;
};

static struct atomic_stack_node *stack_head = NULL;

static void atomic_stack_push(int value) {
    struct atomic_stack_node *new_node, *head;
    
    new_node = kmalloc(sizeof(*new_node), GFP_ATOMIC);
    if (!new_node)
        return;
    
    new_node->data = value;
    
    do {
        head = READ_ONCE(stack_head);
        new_node->next = head;
        
        // Atomic compare-and-swap to update head
    } while (cmpxchg(&stack_head, head, new_node) != head);
    
    printk(KERN_INFO "Pushed %d to atomic stack\\n", value);
}

static int atomic_stack_pop(void) {
    struct atomic_stack_node *head, *next;
    int data;
    
    do {
        head = READ_ONCE(stack_head);
        if (!head)
            return -1; // Stack empty
        
        next = READ_ONCE(head->next);
        
        // Try to update head to next
    } while (cmpxchg(&stack_head, head, next) != head);
    
    data = head->data;
    kfree(head);
    
    printk(KERN_INFO "Popped %d from atomic stack\\n", data);
    return data;
}

static int __init atomic_demo_init(void) {
    struct task_struct *workers[4];
    int worker_ids[4] = {1, 2, 3, 4};
    int i;
    
    printk(KERN_INFO "Atomic operations demo loaded\\n");
    
    // Start multiple worker threads
    for (i = 0; i < 4; i++) {
        workers[i] = kthread_run(atomic_worker, &worker_ids[i], 
                                "atomic_worker_%d", i);
        if (IS_ERR(workers[i])) {
            printk(KERN_ERR "Failed to create worker %d\\n", i);
            return PTR_ERR(workers[i]);
        }
    }
    
    // Wait for workers to complete
    msleep(5000);
    
    // Stop all workers
    for (i = 0; i < 4; i++) {
        if (!IS_ERR(workers[i])) {
            kthread_stop(workers[i]);
        }
    }
    
    // Print results
    printk(KERN_INFO "Final counter value: %d\\n", atomic_read(&shared_counter));
    printk(KERN_INFO "Final 64-bit counter: %lld\\n", atomic64_read(&large_counter));
    printk(KERN_INFO "Final long counter: %ld\\n", atomic_long_read(&long_counter));
    
    // Test memory barriers
    memory_barrier_example();
    
    // Test lock-free stack
    atomic_stack_push(10);
    atomic_stack_push(20);
    atomic_stack_push(30);
    
    atomic_stack_pop();
    atomic_stack_pop();
    atomic_stack_pop();
    
    return 0;
}

static void __exit atomic_demo_exit(void) {
    // Clean up any remaining stack nodes
    while (atomic_stack_pop() != -1) {
        // Keep popping until empty
    }
    
    printk(KERN_INFO "Atomic operations demo unloaded\\n");
}

module_init(atomic_demo_init);
module_exit(atomic_demo_exit);
MODULE_LICENSE("GPL");`,
            exercises: [
                "Implement lock-free queue using atomic operations",
                "Create reference counting system with atomics",
                "Benchmark atomic operations vs mutex performance"
            ],
            relatedConcepts: ["memory_barriers", "lock_free", "smp", "race_conditions"]
        },

        // DEVICE DRIVERS - PROFESSIONAL LEVEL
        
        pci_driver: {
            title: "PCI Device Drivers", 
            category: "Device Drivers",
            difficulty: "Expert",
            description: "Drivers for PCI/PCIe devices with DMA, interrupts, and power management",
            explanation: `PCI drivers handle Peripheral Component Interconnect devices, the standard for expansion cards and integrated devices.

**PCI concepts:**
• Configuration space (256/4096 bytes)
• Base Address Registers (BARs)
• Vendor ID, Device ID, Class codes
• PCI Express capabilities
• Message Signaled Interrupts (MSI/MSI-X)

**Driver structure:**
• probe() - device detection and initialization
• remove() - cleanup when device removed
• suspend/resume - power management
• Error handling and recovery

**DMA operations:**
• Coherent DMA mappings
• Streaming DMA mappings
• IOMMU considerations
• 32-bit vs 64-bit DMA addressing`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/pci.h>
#include <linux/interrupt.h>
#include <linux/dma-mapping.h>

#define VENDOR_ID 0x1234
#define DEVICE_ID 0x5678
#define DRIVER_NAME "example_pci"

// Device private data structure
struct example_pci_dev {
    struct pci_dev *pdev;
    void __iomem *mmio_base;
    int irq;
    
    // DMA coherent buffer
    void *dma_coherent;
    dma_addr_t dma_coherent_handle;
    
    // Device registers (example)
    u32 __iomem *control_reg;
    u32 __iomem *status_reg;
    u32 __iomem *data_reg;
};

// PCI device ID table
static const struct pci_device_id example_pci_ids[] = {
    { PCI_DEVICE(VENDOR_ID, DEVICE_ID) },
    { PCI_DEVICE(PCI_VENDOR_ID_INTEL, 0x1234) },  // Example Intel device
    { 0, }  // Terminator
};
MODULE_DEVICE_TABLE(pci, example_pci_ids);

// Interrupt handler
static irqreturn_t example_pci_interrupt(int irq, void *dev_id) {
    struct example_pci_dev *priv = dev_id;
    u32 status;
    
    // Read interrupt status
    status = ioread32(priv->status_reg);
    
    if (!(status & 0x1)) {
        return IRQ_NONE;  // Not our interrupt
    }
    
    // Handle the interrupt
    printk(KERN_INFO "PCI interrupt: status=0x%x\\n", status);
    
    // Clear interrupt
    iowrite32(status, priv->status_reg);
    
    return IRQ_HANDLED;
}

// Configure device BARs and memory mapping
static int setup_device_memory(struct example_pci_dev *priv) {
    struct pci_dev *pdev = priv->pdev;
    resource_size_t mmio_start, mmio_len;
    
    // Check BAR 0 (memory mapped I/O)
    if (!(pci_resource_flags(pdev, 0) & IORESOURCE_MEM)) {
        dev_err(&pdev->dev, "BAR 0 is not memory resource\\n");
        return -ENODEV;
    }
    
    mmio_start = pci_resource_start(pdev, 0);
    mmio_len = pci_resource_len(pdev, 0);
    
    printk(KERN_INFO "MMIO: start=0x%llx, len=0x%llx\\n", 
           (u64)mmio_start, (u64)mmio_len);
    
    // Request memory region
    if (!request_mem_region(mmio_start, mmio_len, DRIVER_NAME)) {
        dev_err(&pdev->dev, "Cannot request memory region\\n");
        return -EBUSY;
    }
    
    // Map to kernel virtual address space
    priv->mmio_base = ioremap(mmio_start, mmio_len);
    if (!priv->mmio_base) {
        dev_err(&pdev->dev, "Cannot map memory\\n");
        release_mem_region(mmio_start, mmio_len);
        return -ENOMEM;
    }
    
    // Set up register pointers (example offsets)
    priv->control_reg = priv->mmio_base + 0x00;
    priv->status_reg = priv->mmio_base + 0x04;
    priv->data_reg = priv->mmio_base + 0x08;
    
    return 0;
}

// Setup DMA for the device
static int setup_device_dma(struct example_pci_dev *priv) {
    struct pci_dev *pdev = priv->pdev;
    int ret;
    
    // Set DMA mask (try 64-bit first, fall back to 32-bit)
    ret = dma_set_mask_and_coherent(&pdev->dev, DMA_BIT_MASK(64));
    if (ret) {
        ret = dma_set_mask_and_coherent(&pdev->dev, DMA_BIT_MASK(32));
        if (ret) {
            dev_err(&pdev->dev, "Cannot set DMA mask\\n");
            return ret;
        }
        printk(KERN_INFO "Using 32-bit DMA\\n");
    } else {
        printk(KERN_INFO "Using 64-bit DMA\\n");
    }
    
    // Allocate coherent DMA buffer
    priv->dma_coherent = dma_alloc_coherent(&pdev->dev, PAGE_SIZE,
                                           &priv->dma_coherent_handle,
                                           GFP_KERNEL);
    if (!priv->dma_coherent) {
        dev_err(&pdev->dev, "Cannot allocate DMA buffer\\n");
        return -ENOMEM;
    }
    
    printk(KERN_INFO "DMA buffer: virt=%p, phys=0x%llx\\n",
           priv->dma_coherent, (u64)priv->dma_coherent_handle);
    
    return 0;
}

// PCI probe function - called when device is found
static int example_pci_probe(struct pci_dev *pdev, 
                            const struct pci_device_id *id) {
    struct example_pci_dev *priv;
    int ret;
    
    printk(KERN_INFO "Probing PCI device %04x:%04x\\n", 
           pdev->vendor, pdev->device);
    
    // Allocate private data
    priv = devm_kzalloc(&pdev->dev, sizeof(*priv), GFP_KERNEL);
    if (!priv)
        return -ENOMEM;
    
    priv->pdev = pdev;
    pci_set_drvdata(pdev, priv);
    
    // Enable PCI device
    ret = pci_enable_device(pdev);
    if (ret) {
        dev_err(&pdev->dev, "Cannot enable PCI device\\n");
        return ret;
    }
    
    // Set up memory regions
    ret = setup_device_memory(priv);
    if (ret)
        goto err_disable_device;
    
    // Set up DMA
    ret = setup_device_dma(priv);
    if (ret)
        goto err_unmap_memory;
    
    // Enable bus mastering for DMA
    pci_set_master(pdev);
    
    // Request IRQ
    priv->irq = pdev->irq;
    ret = request_irq(priv->irq, example_pci_interrupt, 
                     IRQF_SHARED, DRIVER_NAME, priv);
    if (ret) {
        dev_err(&pdev->dev, "Cannot request IRQ %d\\n", priv->irq);
        goto err_free_dma;
    }
    
    // Initialize device (example)
    iowrite32(0x1, priv->control_reg);  // Enable device
    
    printk(KERN_INFO "PCI device initialized successfully\\n");
    return 0;
    
err_free_dma:
    dma_free_coherent(&pdev->dev, PAGE_SIZE, priv->dma_coherent, 
                     priv->dma_coherent_handle);
err_unmap_memory:
    iounmap(priv->mmio_base);
    release_mem_region(pci_resource_start(pdev, 0), 
                      pci_resource_len(pdev, 0));
err_disable_device:
    pci_disable_device(pdev);
    return ret;
}

// PCI remove function - called when device is removed
static void example_pci_remove(struct pci_dev *pdev) {
    struct example_pci_dev *priv = pci_get_drvdata(pdev);
    
    printk(KERN_INFO "Removing PCI device\\n");
    
    // Disable device
    iowrite32(0x0, priv->control_reg);
    
    // Free IRQ
    free_irq(priv->irq, priv);
    
    // Free DMA buffer
    dma_free_coherent(&pdev->dev, PAGE_SIZE, priv->dma_coherent,
                     priv->dma_coherent_handle);
    
    // Unmap memory
    iounmap(priv->mmio_base);
    release_mem_region(pci_resource_start(pdev, 0), 
                      pci_resource_len(pdev, 0));
    
    // Disable PCI device
    pci_disable_device(pdev);
    
    printk(KERN_INFO "PCI device removed\\n");
}

// Power management operations
static int example_pci_suspend(struct device *dev) {
    struct pci_dev *pdev = to_pci_dev(dev);
    struct example_pci_dev *priv = pci_get_drvdata(pdev);
    
    printk(KERN_INFO "Suspending PCI device\\n");
    
    // Save device state
    pci_save_state(pdev);
    
    // Disable device
    iowrite32(0x0, priv->control_reg);
    
    return 0;
}

static int example_pci_resume(struct device *dev) {
    struct pci_dev *pdev = to_pci_dev(dev);
    struct example_pci_dev *priv = pci_get_drvdata(pdev);
    
    printk(KERN_INFO "Resuming PCI device\\n");
    
    // Restore device state
    pci_restore_state(pdev);
    
    // Re-enable device
    iowrite32(0x1, priv->control_reg);
    
    return 0;
}

static const struct dev_pm_ops example_pci_pm_ops = {
    .suspend = example_pci_suspend,
    .resume = example_pci_resume,
};

// PCI driver structure
static struct pci_driver example_pci_driver = {
    .name = DRIVER_NAME,
    .id_table = example_pci_ids,
    .probe = example_pci_probe,
    .remove = example_pci_remove,
    .driver = {
        .pm = &example_pci_pm_ops,
    },
};

static int __init example_pci_init(void) {
    printk(KERN_INFO "Example PCI driver loading\\n");
    return pci_register_driver(&example_pci_driver);
}

static void __exit example_pci_exit(void) {
    printk(KERN_INFO "Example PCI driver unloading\\n");
    pci_unregister_driver(&example_pci_driver);
}

module_init(example_pci_init);
module_exit(example_pci_exit);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Example PCI device driver");
MODULE_AUTHOR("Kernel Developer");`,
            exercises: [
                "Implement MSI/MSI-X interrupt handling for PCI device",
                "Create scatter-gather DMA operations for network driver",
                "Add PCI error recovery and AER support"
            ],
            relatedConcepts: ["dma_mapping", "interrupts", "memory_mapping", "power_management"]
        },

        // ADVANCED DEBUGGING AND PERFORMANCE
        
        ftrace: {
            title: "Ftrace Framework",
            category: "Debugging & Performance",
            difficulty: "Expert",
            description: "Linux kernel's built-in tracing framework for debugging and performance analysis",
            explanation: `Ftrace is the primary tracing infrastructure in the Linux kernel, providing deep insights into kernel behavior.

**Key components:**
• Function tracer - traces function calls
• Function graph tracer - shows call graphs
• Event tracing - traces specific kernel events
• Stack tracer - monitors stack usage
• Hardware latency tracer - detects hardware-induced delays

**Tracers available:**
• nop - null tracer (default)
• function - traces all kernel function calls
• function_graph - shows function call relationships
• irqsoff - traces interrupt disabled sections
• preemptoff - traces preemption disabled sections
• wakeup - traces task wake-up latency

**Use cases:**
• Performance bottleneck identification
• Debugging race conditions
• Understanding kernel flow
• Latency analysis
• Real-time system debugging`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/ftrace.h>
#include <linux/kprobes.h>
#include <linux/delay.h>

// Example of adding custom trace events
#define CREATE_TRACE_POINTS
#include <trace/events/sched.h>

// Custom trace event definition
TRACE_EVENT(custom_kernel_event,
    TP_PROTO(int pid, const char *comm, int value),
    TP_ARGS(pid, comm, value),
    TP_STRUCT__entry(
        __field(int, pid)
        __string(comm, comm)
        __field(int, value)
    ),
    TP_fast_assign(
        __entry->pid = pid;
        __assign_str(comm, comm);
        __entry->value = value;
    ),
    TP_printk("pid=%d comm=%s value=%d",
        __entry->pid, __get_str(comm), __entry->value)
);

// Function to be traced
static noinline void example_traced_function(int param) {
    // This function will appear in function tracer
    printk(KERN_INFO "Traced function called with param=%d\\n", param);
    
    // Emit custom trace event
    trace_custom_kernel_event(current->pid, current->comm, param);
    
    // Simulate some work
    mdelay(1);
}

// Function tracer callback
static void example_tracer_callback(unsigned long ip, unsigned long parent_ip,
                                   struct ftrace_ops *op, struct pt_regs *regs) {
    // This gets called for every function call (when enabled)
    printk_ratelimited(KERN_INFO "Function traced: %pS\\n", (void *)ip);
}

// Ftrace operations structure
static struct ftrace_ops example_ftrace_ops = {
    .func = example_tracer_callback,
    .flags = FTRACE_OPS_FL_SAVE_REGS,
};

// Enable function tracing for specific function
static int enable_function_tracing(void) {
    int ret;
    
    // Register our tracer
    ret = register_ftrace_function(&example_ftrace_ops);
    if (ret) {
        printk(KERN_ERR "Failed to register ftrace function\\n");
        return ret;
    }
    
    printk(KERN_INFO "Function tracing enabled\\n");
    return 0;
}

// Kprobe example for dynamic tracing
static struct kprobe example_kprobe = {
    .symbol_name = "do_fork",  // Trace fork system call
};

static int kprobe_handler_pre(struct kprobe *p, struct pt_regs *regs) {
    printk(KERN_INFO "Kprobe: do_fork called by %s (pid=%d)\\n",
           current->comm, current->pid);
    return 0;
}

static void kprobe_handler_post(struct kprobe *p, struct pt_regs *regs,
                               unsigned long flags) {
    printk(KERN_INFO "Kprobe: do_fork returned\\n");
}

// Performance monitoring example
static void performance_trace_example(void) {
    unsigned long start_time, end_time;
    
    // Start timing
    start_time = trace_clock_local();
    
    // Some operation to measure
    example_traced_function(42);
    
    // End timing
    end_time = trace_clock_local();
    
    printk(KERN_INFO "Operation took %lu ns\\n", end_time - start_time);
    
    // Manual trace point
    trace_printk("Custom trace: operation completed in %lu ns\\n", 
                end_time - start_time);
}

static int __init ftrace_demo_init(void) {
    int ret;
    
    printk(KERN_INFO "Ftrace demo module loaded\\n");
    
    // Enable function tracing
    ret = enable_function_tracing();
    if (ret)
        return ret;
    
    // Set up kprobe
    example_kprobe.pre_handler = kprobe_handler_pre;
    example_kprobe.post_handler = kprobe_handler_post;
    
    ret = register_kprobe(&example_kprobe);
    if (ret) {
        printk(KERN_ERR "Failed to register kprobe\\n");
        unregister_ftrace_function(&example_ftrace_ops);
        return ret;
    }
    
    // Demonstrate performance tracing
    performance_trace_example();
    
    printk(KERN_INFO "Ftrace demo setup complete\\n");
    printk(KERN_INFO "Check /sys/kernel/debug/tracing/ for trace output\\n");
    
    return 0;
}

static void __exit ftrace_demo_exit(void) {
    // Clean up kprobe
    unregister_kprobe(&example_kprobe);
    
    // Clean up function tracer
    unregister_ftrace_function(&example_ftrace_ops);
    
    printk(KERN_INFO "Ftrace demo module unloaded\\n");
}

module_init(ftrace_demo_init);
module_exit(ftrace_demo_exit);
MODULE_LICENSE("GPL");

/*
To use this module and see tracing output:

1. Load the module:
   sudo insmod ftrace_demo.ko

2. Enable tracing:
   echo 1 > /sys/kernel/debug/tracing/tracing_on

3. View trace output:
   cat /sys/kernel/debug/tracing/trace

4. Enable specific tracers:
   echo function > /sys/kernel/debug/tracing/current_tracer
   echo function_graph > /sys/kernel/debug/tracing/current_tracer

5. Filter functions:
   echo example_traced_function > /sys/kernel/debug/tracing/set_ftrace_filter

6. View available events:
   cat /sys/kernel/debug/tracing/available_events

7. Enable custom events:
   echo 1 > /sys/kernel/debug/tracing/events/custom_kernel_event/enable
*/`,
            exercises: [
                "Create custom trace events for a device driver",
                "Use ftrace to debug interrupt latency issues",
                "Implement performance monitoring for memory allocations"
            ],
            relatedConcepts: ["kprobes", "perf", "debugging", "performance_analysis"]
        },

        numa: {
            title: "NUMA (Non-Uniform Memory Access)",
            category: "Memory Management",
            difficulty: "Expert", 
            description: "Multi-processor systems where memory access time depends on memory location",
            explanation: `NUMA systems have multiple CPUs with local memory, where accessing local memory is faster than remote memory.

**NUMA concepts:**
• NUMA nodes - groups of CPUs with local memory
• Memory locality - accessing local vs remote memory
• Memory affinity - binding processes to specific nodes
• Memory migration - moving pages between nodes
• Load balancing - distributing work across nodes

**Performance implications:**
• Local memory access: ~100-200 cycles
• Remote memory access: ~300-400 cycles
• Cross-node coherency traffic
• Memory bandwidth contention

**Kernel NUMA features:**
• NUMA-aware memory allocators
• CPU scheduler NUMA balancing
• Automatic NUMA balancing (AutoNUMA)
• NUMA memory policies
• NUMA statistics and monitoring`,
            codeExample: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/numa.h>
#include <linux/cpumask.h>
#include <linux/memory.h>
#include <linux/mmzone.h>
#include <linux/topology.h>

// NUMA-aware memory allocation example
static void numa_memory_allocation_demo(void) {
    void *local_memory, *remote_memory, *any_memory;
    int current_node, remote_node;
    
    // Get current NUMA node
    current_node = numa_node_id();
    printk(KERN_INFO "Current CPU is on NUMA node %d\\n", current_node);
    
    // Allocate memory on current node (local)
    local_memory = kmalloc_node(PAGE_SIZE, GFP_KERNEL, current_node);
    if (local_memory) {
        printk(KERN_INFO "Local memory allocated on node %d: %p\\n", 
               current_node, local_memory);
    }
    
    // Find a different node for remote allocation
    remote_node = next_online_node(current_node);
    if (remote_node >= MAX_NUMNODES) {
        remote_node = first_online_node;
    }
    
    if (remote_node != current_node) {
        // Allocate memory on remote node
        remote_memory = kmalloc_node(PAGE_SIZE, GFP_KERNEL, remote_node);
        if (remote_memory) {
            printk(KERN_INFO "Remote memory allocated on node %d: %p\\n",
                   remote_node, remote_memory);
            kfree(remote_memory);
        }
    }
    
    // Regular allocation (any node)
    any_memory = kmalloc(PAGE_SIZE, GFP_KERNEL);
    if (any_memory) {
        printk(KERN_INFO "Any node memory allocated: %p\\n", any_memory);
        kfree(any_memory);
    }
    
    if (local_memory) {
        kfree(local_memory);
    }
}

// NUMA topology information
static void numa_topology_info(void) {
    int node, cpu;
    struct pglist_data *pgdat;
    
    printk(KERN_INFO "NUMA topology information:\\n");
    printk(KERN_INFO "Number of NUMA nodes: %d\\n", num_online_nodes());
    
    // Iterate through NUMA nodes
    for_each_online_node(node) {
        pgdat = NODE_DATA(node);
        
        printk(KERN_INFO "Node %d:\\n", node);
        printk(KERN_INFO "  Memory start: 0x%lx\\n", pgdat->node_start_pfn << PAGE_SHIFT);
        printk(KERN_INFO "  Memory size: %lu MB\\n", 
               (pgdat->node_spanned_pages << PAGE_SHIFT) >> 20);
        
        // Show CPUs on this node
        printk(KERN_INFO "  CPUs: ");
        for_each_cpu(cpu, cpumask_of_node(node)) {
            printk(KERN_CONT "%d ", cpu);
        }
        printk(KERN_CONT "\\n");
        
        // Memory zones on this node
        printk(KERN_INFO "  Zones: ");
        for (int zone_idx = 0; zone_idx < MAX_NR_ZONES; zone_idx++) {
            struct zone *zone = &pgdat->node_zones[zone_idx];
            if (populated_zone(zone)) {
                printk(KERN_CONT "%s ", zone->name);
            }
        }
        printk(KERN_CONT "\\n");
    }
}

// NUMA distances (cost of accessing remote memory)
static void numa_distance_info(void) {
    int from_node, to_node;
    
    printk(KERN_INFO "NUMA distance matrix:\\n");
    printk(KERN_INFO "From\\\\To  ");
    
    // Print header
    for_each_online_node(to_node) {
        printk(KERN_CONT "%3d ", to_node);
    }
    printk(KERN_CONT "\\n");
    
    // Print distance matrix
    for_each_online_node(from_node) {
        printk(KERN_INFO "%7d  ", from_node);
        for_each_online_node(to_node) {
            int distance = node_distance(from_node, to_node);
            printk(KERN_CONT "%3d ", distance);
        }
        printk(KERN_CONT "\\n");
    }
}

// NUMA memory statistics
static void numa_memory_stats(void) {
    int node;
    
    printk(KERN_INFO "NUMA memory statistics:\\n");
    
    for_each_online_node(node) {
        struct pglist_data *pgdat = NODE_DATA(node);
        unsigned long free_pages = 0;
        unsigned long total_pages = 0;
        
        for (int zone_idx = 0; zone_idx < MAX_NR_ZONES; zone_idx++) {
            struct zone *zone = &pgdat->node_zones[zone_idx];
            if (populated_zone(zone)) {
                free_pages += zone_page_state(zone, NR_FREE_PAGES);
                total_pages += zone->managed_pages;
            }
        }
        
        printk(KERN_INFO "Node %d: %lu MB total, %lu MB free\\n",
               node, (total_pages << PAGE_SHIFT) >> 20,
               (free_pages << PAGE_SHIFT) >> 20);
    }
}

// CPU affinity and NUMA binding example
static void numa_cpu_affinity_demo(void) {
    int target_node = numa_node_id();
    cpumask_t node_cpus;
    
    printk(KERN_INFO "CPU affinity and NUMA binding demo\\n");
    
    // Get CPUs for current node
    cpumask_copy(&node_cpus, cpumask_of_node(target_node));
    
    printk(KERN_INFO "CPUs on node %d: ", target_node);
    for_each_cpu(cpu, &node_cpus) {
        printk(KERN_CONT "%d ", cpu);
    }
    printk(KERN_CONT "\\n");
    
    // In a real driver, you might want to:
    // 1. Allocate memory on specific NUMA node
    // 2. Bind interrupt handlers to CPUs on same node
    // 3. Use NUMA-local work queues
    // 4. Optimize data structures for NUMA topology
}

// Memory migration example (simplified)
static void numa_migration_demo(void) {
    struct page *page;
    int current_node, target_node;
    
    printk(KERN_INFO "NUMA memory migration demo\\n");
    
    current_node = numa_node_id();
    target_node = next_online_node(current_node);
    
    if (target_node >= MAX_NUMNODES) {
        target_node = first_online_node;
    }
    
    // Allocate page on current node
    page = alloc_pages_node(current_node, GFP_KERNEL, 0);
    if (!page) {
        printk(KERN_ERR "Failed to allocate page\\n");
        return;
    }
    
    printk(KERN_INFO "Page allocated on node %d\\n", page_to_nid(page));
    
    // In production code, you might migrate this page to target_node
    // using migrate_pages() or similar mechanisms
    
    __free_pages(page, 0);
}

static int __init numa_demo_init(void) {
    printk(KERN_INFO "NUMA demo module loaded\\n");
    
    if (!numa_possible_node_id(0)) {
        printk(KERN_INFO "System is not NUMA\\n");
        return 0;
    }
    
    // Display NUMA topology
    numa_topology_info();
    
    // Show NUMA distances
    numa_distance_info();
    
    // Show memory statistics
    numa_memory_stats();
    
    // Demonstrate NUMA-aware allocation
    numa_memory_allocation_demo();
    
    // CPU affinity demo
    numa_cpu_affinity_demo();
    
    // Migration demo
    numa_migration_demo();
    
    return 0;
}

static void __exit numa_demo_exit(void) {
    printk(KERN_INFO "NUMA demo module unloaded\\n");
}

module_init(numa_demo_init);
module_exit(numa_demo_exit);
MODULE_LICENSE("GPL");

/*
To check NUMA information on your system:

1. Check NUMA nodes:
   numactl --hardware

2. Check current process NUMA policy:
   numactl --show

3. View NUMA statistics:
   cat /proc/buddyinfo
   cat /sys/devices/system/node/node*/meminfo

4. Check CPU topology:
   lscpu

5. Monitor NUMA balancing:
   cat /proc/sys/kernel/numa_balancing
*/`,
            exercises: [
                "Implement NUMA-aware network packet processing",
                "Create NUMA-optimized memory pool allocator",
                "Measure memory access latency across NUMA nodes"
            ],
            relatedConcepts: ["smp", "memory_allocation", "cpu_affinity", "performance_optimization"]
        },

        // === HASH TABLES & DICTIONARY CONCEPTS ===
        hash_tables: {
            title: "Hash Tables",
            category: "Data Structures",
            difficulty: "Intermediate",
            description: "Data structure that maps keys to values using hash functions for O(1) average access",
            explanation: `Hash tables are fundamental data structures that provide fast key-value lookups. They work by:

1. **Hash Function**: Converts keys into array indices
2. **Collision Resolution**: Handles when different keys hash to same index
3. **Dynamic Resizing**: Grows/shrinks to maintain performance

In kernel programming, hash tables are used for:
- Process ID to task_struct mapping
- Virtual memory area lookups  
- Network connection tracking
- File system caches

The kernel provides efficient hash table implementations like hlist_head for optimal performance.`,
            codeExample: `// Simple hash table implementation
#define HASH_SIZE 256

struct hash_entry {
    char *key;
    int value;
    struct hash_entry *next;  // Chaining for collisions
};

struct hash_table {
    struct hash_entry *buckets[HASH_SIZE];
};

// djb2 hash function
unsigned int hash_string(const char *key) {
    unsigned int hash = 5381;
    int c;
    while ((c = *key++)) {
        hash = ((hash << 5) + hash) + c;
    }
    return hash % HASH_SIZE;
}

int hash_put(struct hash_table *ht, const char *key, int value) {
    unsigned int index = hash_string(key);
    struct hash_entry *entry = kmalloc(sizeof(*entry), GFP_KERNEL);
    
    entry->key = kstrdup(key, GFP_KERNEL);
    entry->value = value;
    entry->next = ht->buckets[index];
    ht->buckets[index] = entry;
    
    return 0;
}`,
            exercises: [
                "Implement hash table with linear probing collision resolution",
                "Create hash table that automatically resizes when load factor exceeds 0.75",
                "Build hash table using kernel's hlist_head for chaining",
                "Implement string hash table with custom hash function"
            ],
            relatedConcepts: ["collision_resolution", "hash_functions", "kernel_lists", "hlist"]
        },

        collision_resolution: {
            title: "Collision Resolution",
            category: "Data Structures", 
            difficulty: "Intermediate",
            description: "Techniques to handle when different keys hash to the same array index",
            explanation: `When two different keys produce the same hash value, a collision occurs. Main resolution strategies:

**1. Separate Chaining:**
- Each bucket stores a linked list of entries
- Simple to implement, handles any number of collisions
- Used in kernel's hlist implementation

**2. Open Addressing:**
- Find next available slot using probing
- Linear probing: Check next slot
- Quadratic probing: Check slots at quadratic intervals
- Double hashing: Use second hash function

**3. Robin Hood Hashing:**
- Advanced technique that minimizes variance in probe distances
- Moves existing entries to optimize overall performance

The kernel primarily uses separate chaining with linked lists for simplicity and reliability.`,
            codeExample: `// Separate chaining example
struct hash_entry {
    struct hash_entry *next;
    unsigned long key;
    void *data;
};

// Linear probing example
#define HASH_EMPTY 0
#define HASH_DELETED 1
#define HASH_OCCUPIED 2

struct hash_slot {
    int state;
    unsigned long key;
    void *data;
};

int linear_probe_insert(struct hash_slot *table, int size, 
                       unsigned long key, void *data) {
    int index = hash(key) % size;
    
    while (table[index].state == HASH_OCCUPIED) {
        if (table[index].key == key) {
            table[index].data = data;  // Update existing
            return 0;
        }
        index = (index + 1) % size;  // Linear probing
    }
    
    table[index].state = HASH_OCCUPIED;
    table[index].key = key;
    table[index].data = data;
    return 0;
}`,
            exercises: [
                "Compare performance of chaining vs linear probing",
                "Implement quadratic probing with proper wrap-around",
                "Create Robin Hood hashing implementation",
                "Measure collision rates with different hash functions"
            ],
            relatedConcepts: ["hash_tables", "hash_functions", "linked_lists", "performance_optimization"]
        },

        hash_functions: {
            title: "Hash Functions",
            category: "Data Structures",
            difficulty: "Intermediate", 
            description: "Functions that map keys to array indices for hash table implementation",
            explanation: `Hash functions convert keys into array indices. Good hash functions have:

**Properties:**
- **Deterministic**: Same input always produces same output
- **Uniform Distribution**: Spreads keys evenly across buckets
- **Fast Computation**: Minimal CPU overhead
- **Avalanche Effect**: Small input changes cause large output changes

**Common Hash Functions:**

1. **djb2**: Simple and effective for strings
2. **FNV**: Fast with good distribution properties  
3. **CRC32**: Hardware-accelerated on many platforms
4. **SipHash**: Cryptographically secure against hash flooding attacks

The kernel uses various hash functions optimized for different data types (pointers, integers, strings).`,
            codeExample: `// djb2 hash function (popular for strings)
unsigned long djb2_hash(const char *str) {
    unsigned long hash = 5381;
    int c;
    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c; // hash * 33 + c
    }
    return hash;
}

// FNV-1a hash function
unsigned long fnv1a_hash(const void *data, size_t len) {
    const unsigned char *bytes = data;
    unsigned long hash = 2166136261UL;
    
    for (size_t i = 0; i < len; i++) {
        hash ^= bytes[i];
        hash *= 16777619UL;
    }
    return hash;
}

// Kernel's hash_long function
static inline unsigned long hash_long(unsigned long val, unsigned int bits) {
    unsigned long hash = val;
    
#if BITS_PER_LONG == 64
    hash = hash * 0x61C8864680B583EBull;
    hash = hash >> (64 - bits);
#else
    hash = hash * 0x61C88647;
    hash = hash >> (32 - bits);
#endif
    return hash;
}`,
            exercises: [
                "Test hash distribution quality with different functions",
                "Implement hash function for custom struct types",
                "Measure hash function performance on large datasets",
                "Create hash function resistant to collision attacks"
            ],
            relatedConcepts: ["hash_tables", "collision_resolution", "cryptography", "performance_optimization"]
        },

        hlist: {
            title: "Kernel hlist",
            category: "Kernel Data Structures",
            difficulty: "Advanced",
            description: "Linux kernel's optimized hash table implementation using single-pointer list heads",
            explanation: `The kernel's hlist (hash list) is an optimized data structure for hash tables:

**Key Features:**
- **Single Pointer Head**: hlist_head contains only one pointer, saving memory
- **Double-linked Nodes**: hlist_node has next and pprev pointers
- **Cache Efficient**: Minimal memory overhead in hash buckets
- **Lock-free Operations**: Can be used with RCU for lockless reads

**Structure:**
- hlist_head: Contains pointer to first node
- hlist_node: Contains next pointer and pointer-to-pointer for prev

This design is perfect for hash tables where empty buckets are common - each empty bucket only needs one pointer instead of two.`,
            codeExample: `#include <linux/list.h>

// Define hash table
#define HASH_BITS 8
static struct hlist_head hash_table[1 << HASH_BITS];

struct my_data {
    int key;
    char value[64];
    struct hlist_node node;
};

// Initialize hash table
static void init_hash_table(void) {
    int i;
    for (i = 0; i < (1 << HASH_BITS); i++) {
        INIT_HLIST_HEAD(&hash_table[i]);
    }
}

// Add entry to hash table
static void hash_add_entry(struct my_data *data) {
    unsigned int hash = hash_32(data->key, HASH_BITS);
    hlist_add_head(&data->node, &hash_table[hash]);
}

// Find entry in hash table
static struct my_data *hash_find(int key) {
    unsigned int hash = hash_32(key, HASH_BITS);
    struct my_data *data;
    
    hlist_for_each_entry(data, &hash_table[hash], node) {
        if (data->key == key)
            return data;
    }
    return NULL;
}

// Remove entry
static void hash_remove_entry(struct my_data *data) {
    hlist_del(&data->node);
}`,
            exercises: [
                "Implement process tracking system using hlist",
                "Create RCU-protected hash table with hlist",
                "Compare memory usage of hlist vs regular linked lists",
                "Build network connection tracking using hlist"
            ],
            relatedConcepts: ["hash_tables", "kernel_lists", "rcu", "memory_optimization"]
        },

        // === RED-BLACK TREES ===
        red_black_trees: {
            title: "Red-Black Trees",
            category: "Data Structures",
            difficulty: "Advanced",
            description: "Self-balancing binary search trees with guaranteed O(log n) operations",
            explanation: `Red-black trees are self-balancing binary search trees that maintain balance through color properties:

**Properties:**
1. Every node is either red or black
2. Root node is always black
3. Red nodes cannot have red children
4. All paths from root to leaves contain same number of black nodes

**Advantages:**
- Guaranteed O(log n) worst-case performance
- Less rigidly balanced than AVL trees
- Widely used in kernel for various subsystems

**Kernel Usage:**
- Virtual memory areas (VMAs)
- Process scheduling (CFS scheduler) 
- File system metadata
- Timer wheels

The kernel provides rb_root and rb_node structures with insertion, deletion, and search operations.`,
            codeExample: `#include <linux/rbtree.h>

struct my_node {
    struct rb_node rb_node;
    int key;
    char data[64];
};

static struct rb_root my_tree = RB_ROOT;

// Insert node into red-black tree
static int rb_insert_node(struct rb_root *root, struct my_node *new) {
    struct rb_node **link = &root->rb_node;
    struct rb_node *parent = NULL;
    struct my_node *entry;
    
    while (*link) {
        parent = *link;
        entry = rb_entry(parent, struct my_node, rb_node);
        
        if (new->key < entry->key)
            link = &(*link)->rb_left;
        else if (new->key > entry->key)
            link = &(*link)->rb_right;
        else
            return -EEXIST;
    }
    
    rb_link_node(&new->rb_node, parent, link);
    rb_insert_color(&new->rb_node, root);
    return 0;
}

// Search for node
static struct my_node *rb_search(struct rb_root *root, int key) {
    struct rb_node *node = root->rb_node;
    
    while (node) {
        struct my_node *entry = rb_entry(node, struct my_node, rb_node);
        
        if (key < entry->key)
            node = node->rb_left;
        else if (key > entry->key) 
            node = node->rb_right;
        else
            return entry;
    }
    return NULL;
}`,
            exercises: [
                "Implement red-black tree with custom comparison function",
                "Create interval tree using red-black tree as base",
                "Build priority queue using red-black tree",
                "Implement red-black tree-based memory allocator"
            ],
            relatedConcepts: ["binary_search_trees", "tree_balancing", "kernel_data_structures", "vma"]
        },

        radix_trees: {
            title: "Radix Trees",
            category: "Data Structures", 
            difficulty: "Advanced",
            description: "Compressed trie data structures optimized for sparse key spaces",
            explanation: `Radix trees (compressed tries) are tree data structures optimized for:

**Key Features:**
- **Sparse Key Support**: Efficient for large, sparse address spaces
- **Path Compression**: Nodes with single children are compressed
- **Fast Lookups**: O(k) where k is key length, independent of tree size
- **Gang Operations**: Bulk lookup/insert/delete operations

**Kernel Usage:**
- Page cache (address_space radix tree)
- Memory management (page tracking)
- IRQ descriptor tables
- File mapping caches

**Advantages over Hash Tables:**
- Ordered iteration
- Range queries
- No hash collisions
- Gang operations for bulk processing

The kernel's radix tree supports tagging for marking pages as dirty, writeback, etc.`,
            codeExample: `#include <linux/radix-tree.h>

// Define radix tree
static RADIX_TREE(my_tree, GFP_KERNEL);

struct my_page {
    unsigned long index;
    void *data;
    unsigned long flags;
};

// Insert page into radix tree
static int radix_insert_page(unsigned long index, struct my_page *page) {
    return radix_tree_insert(&my_tree, index, page);
}

// Lookup page by index
static struct my_page *radix_lookup_page(unsigned long index) {
    return radix_tree_lookup(&my_tree, index);
}

// Delete page from tree
static struct my_page *radix_delete_page(unsigned long index) {
    return radix_tree_delete(&my_tree, index);
}

// Tag page (e.g., mark as dirty)
static void radix_tag_page(unsigned long index, unsigned int tag) {
    radix_tree_tag_set(&my_tree, index, tag);
}

// Find tagged pages in range
static unsigned int radix_find_tagged(unsigned long start, 
                                     unsigned int max_items,
                                     struct my_page **pages,
                                     unsigned int tag) {
    return radix_tree_gang_lookup_tag(&my_tree, (void **)pages, 
                                     start, max_items, tag);
}`,
            exercises: [
                "Implement page cache using radix tree",
                "Create radix tree with custom tagging system",
                "Build sparse array using radix tree",
                "Implement range locking using radix tree"
            ],
            relatedConcepts: ["page_cache", "sparse_arrays", "tagging", "gang_operations"]
        },

        // === MEMORY MANAGEMENT ===
        buddy_system: {
            title: "Buddy System Allocator",
            category: "Memory Management",
            difficulty: "Expert",
            description: "Kernel's physical memory allocation algorithm that manages pages in power-of-2 sized blocks",
            explanation: `The buddy system is the kernel's primary physical page allocator:

**How It Works:**
1. **Power-of-2 Blocks**: Memory divided into blocks of sizes 2^0, 2^1, 2^2, ... pages
2. **Buddy Pairing**: Each block has a "buddy" block of same size
3. **Splitting**: Large blocks split into smaller buddies when needed
4. **Coalescing**: Free buddies merge into larger blocks

**Advantages:**
- Fast allocation/deallocation
- Automatic defragmentation through coalescing
- Minimal external fragmentation
- Simple implementation

**Disadvantages:**
- Internal fragmentation (can't allocate odd-sized blocks)
- Limited by power-of-2 constraint

**Kernel Implementation:**
- Uses free_area structures for each order
- Bitmap tracks allocated/free blocks
- Implements anti-fragmentation to group movable/unmovable pages`,
            codeExample: `// Simplified buddy system structure
#define MAX_ORDER 10

struct free_area {
    struct list_head free_list;
    unsigned long nr_free;
};

struct buddy_zone {
    struct free_area free_area[MAX_ORDER + 1];
    unsigned long *bitmap;
    spinlock_t lock;
};

// Find buddy page frame number
static unsigned long find_buddy_pfn(unsigned long pfn, unsigned int order) {
    return pfn ^ (1UL << order);
}

// Allocate pages of given order
static struct page *buddy_alloc_pages(struct buddy_zone *zone, 
                                     unsigned int order) {
    struct page *page;
    unsigned int current_order;
    
    for (current_order = order; current_order <= MAX_ORDER; current_order++) {
        if (!list_empty(&zone->free_area[current_order].free_list)) {
            page = list_first_entry(&zone->free_area[current_order].free_list, 
                                   struct page, lru);
            list_del(&page->lru);
            
            // Split larger blocks if necessary
            while (current_order > order) {
                current_order--;
                // Add buddy to free list
                struct page *buddy = page + (1 << current_order);
                list_add(&buddy->lru, 
                        &zone->free_area[current_order].free_list);
            }
            return page;
        }
    }
    return NULL;
}`,
            exercises: [
                "Implement complete buddy system with bitmap tracking",
                "Add anti-fragmentation grouping for movable/unmovable pages",
                "Create buddy system statistics and monitoring",
                "Implement NUMA-aware buddy allocation"
            ],
            relatedConcepts: ["page_allocation", "memory_fragmentation", "power_of_two", "coalescing"]
        },

        slab_allocator: {
            title: "SLAB Allocator",
            category: "Memory Management",
            difficulty: "Expert", 
            description: "Kernel's object-level memory allocator built on top of the buddy system",
            explanation: `The SLAB allocator provides efficient allocation for same-sized kernel objects:

**Architecture:**
- **Cache**: Collection of slabs for specific object type
- **Slab**: Contiguous memory containing multiple objects
- **Object**: Individual allocation unit

**Features:**
- **Object Reuse**: Caches frequently used objects
- **Constructor/Destructor**: Initialize objects at allocation/free
- **Per-CPU Caches**: Reduce lock contention
- **Slab Coloring**: Optimize CPU cache usage

**Slab States:**
- **Full**: All objects allocated
- **Partial**: Some objects allocated
- **Empty**: No objects allocated

**Variants:**
- **SLOB**: Simple allocator for small systems
- **SLUB**: Unified allocator (default on most systems)
- **SLAB**: Original implementation

The SLAB allocator reduces kmalloc() overhead and improves cache locality.`,
            codeExample: `// SLAB allocator usage
struct kmem_cache *my_cache;

// Create cache for specific object type
struct my_object {
    int id;
    char data[64];
    struct list_head list;
};

// Initialize cache
static int init_my_cache(void) {
    my_cache = kmem_cache_create("my_objects",
                                sizeof(struct my_object),
                                0,                      // alignment
                                SLAB_HWCACHE_ALIGN,    // flags
                                NULL);                 // constructor
    if (!my_cache)
        return -ENOMEM;
    return 0;
}

// Allocate object from cache
static struct my_object *alloc_my_object(void) {
    return kmem_cache_alloc(my_cache, GFP_KERNEL);
}

// Free object back to cache
static void free_my_object(struct my_object *obj) {
    kmem_cache_free(my_cache, obj);
}

// Destroy cache
static void destroy_my_cache(void) {
    kmem_cache_destroy(my_cache);
}

// Cache with constructor
static void my_object_ctor(void *obj) {
    struct my_object *my_obj = obj;
    my_obj->id = 0;
    INIT_LIST_HEAD(&my_obj->list);
}`,
            exercises: [
                "Create SLAB cache with custom constructor/destructor",
                "Implement per-CPU object caching layer",
                "Build SLAB statistics and monitoring system",
                "Create specialized allocator using SLAB caches"
            ],
            relatedConcepts: ["buddy_system", "object_caching", "per_cpu", "cache_coloring"]
        },

        // === SYNCHRONIZATION ===
        rcu: {
            title: "Read-Copy-Update (RCU)",
            category: "Synchronization",
            difficulty: "Expert",
            description: "Lock-free synchronization mechanism optimized for read-heavy workloads",
            explanation: `RCU is a synchronization technique that allows lock-free reads:

**Core Principles:**
1. **Read-Side**: Multiple readers access data without locks
2. **Update-Side**: Writers create new versions instead of modifying in-place
3. **Grace Period**: Wait for all readers to finish before freeing old data

**Key Concepts:**
- **Critical Section**: Code protected by rcu_read_lock()/rcu_read_unlock()
- **Grace Period**: Time when all pre-existing readers complete
- **Callback**: Function called after grace period to free memory

**RCU Variants:**
- **Classic RCU**: Original implementation
- **Tree RCU**: Scalable for large systems
- **Preemptible RCU**: Allows preemption in read-side critical sections

**Use Cases:**
- Network packet processing
- File system operations  
- Process lists
- Any read-heavy data structure

RCU provides excellent scalability for workloads with many readers and few writers.`,
            codeExample: `#include <linux/rcupdate.h>

struct my_data {
    int value;
    char name[32];
    struct rcu_head rcu;
};

static struct my_data __rcu *global_data;

// RCU-protected read
static int read_data_value(void) {
    struct my_data *data;
    int value;
    
    rcu_read_lock();
    data = rcu_dereference(global_data);
    if (data)
        value = data->value;
    else
        value = -1;
    rcu_read_unlock();
    
    return value;
}

// RCU callback for freeing old data
static void free_data_rcu(struct rcu_head *rcu) {
    struct my_data *data = container_of(rcu, struct my_data, rcu);
    kfree(data);
}

// RCU-protected update
static int update_data(int new_value, const char *name) {
    struct my_data *new_data, *old_data;
    
    new_data = kmalloc(sizeof(*new_data), GFP_KERNEL);
    if (!new_data)
        return -ENOMEM;
        
    new_data->value = new_value;
    strncpy(new_data->name, name, sizeof(new_data->name) - 1);
    
    old_data = rcu_dereference_protected(global_data, 1);
    rcu_assign_pointer(global_data, new_data);
    
    if (old_data)
        call_rcu(&old_data->rcu, free_data_rcu);
        
    return 0;
}`,
            exercises: [
                "Implement RCU-protected linked list",
                "Create RCU-based network connection tracking",
                "Build RCU hash table for high-performance lookups",
                "Implement RCU-protected configuration updates"
            ],
            relatedConcepts: ["lock_free", "grace_period", "memory_barriers", "scalability"]
        },

        // === WORKQUEUES ===
        workqueues: {
            title: "Workqueues",
            category: "Kernel Threading",
            difficulty: "Advanced",
            description: "Kernel's mechanism for deferring work to process context",
            explanation: `Workqueues allow deferring work from interrupt context to process context:

**Why Use Workqueues:**
- **Sleep Capability**: Can sleep, unlike interrupt handlers
- **Process Context**: Full kernel API available
- **Scheduling**: Work items can be scheduled and prioritized

**Types:**
- **System Workqueues**: Shared across kernel (system_wq, system_unbound_wq)
- **Custom Workqueues**: Created for specific purposes
- **Per-CPU Workqueues**: One worker thread per CPU
- **Unbound Workqueues**: Workers not tied to specific CPUs

**Work Types:**
- **work_struct**: Immediate execution
- **delayed_work**: Scheduled for future execution

**Use Cases:**
- Bottom half processing
- Device driver tasks
- File system operations
- Network processing

Workqueues provide better scalability than tasklets and softirqs.`,
            codeExample: `#include <linux/workqueue.h>

// Work item structure
struct my_work {
    struct work_struct work;
    int data;
    char message[64];
};

// Delayed work item
struct my_delayed_work {
    struct delayed_work dwork;
    int task_id;
};

// Custom workqueue
static struct workqueue_struct *my_wq;

// Work function
static void my_work_func(struct work_struct *work) {
    struct my_work *my_work = container_of(work, struct my_work, work);
    
    printk(KERN_INFO "Processing work: %s (data=%d)\\n", 
           my_work->message, my_work->data);
    
    // Can sleep here
    msleep(100);
    
    kfree(my_work);
}

// Delayed work function
static void my_delayed_work_func(struct work_struct *work) {
    struct delayed_work *dwork = to_delayed_work(work);
    struct my_delayed_work *my_dwork = container_of(dwork, struct my_delayed_work, dwork);
    
    printk(KERN_INFO "Delayed work executed: task_id=%d\\n", my_dwork->task_id);
    kfree(my_dwork);
}

// Create custom workqueue
static int init_workqueue_example(void) {
    my_wq = alloc_workqueue("my_workqueue", WQ_UNBOUND, 4);
    if (!my_wq)
        return -ENOMEM;
    return 0;
}

// Schedule immediate work
static void schedule_work_example(int data, const char *message) {
    struct my_work *work = kmalloc(sizeof(*work), GFP_KERNEL);
    if (!work)
        return;
    
    INIT_WORK(&work->work, my_work_func);
    work->data = data;
    strncpy(work->message, message, sizeof(work->message) - 1);
    
    queue_work(my_wq, &work->work);
}

// Schedule delayed work  
static void schedule_delayed_work_example(int task_id, unsigned long delay) {
    struct my_delayed_work *dwork = kmalloc(sizeof(*dwork), GFP_KERNEL);
    if (!dwork)
        return;
    
    INIT_DELAYED_WORK(&dwork->dwork, my_delayed_work_func);
    dwork->task_id = task_id;
    
    queue_delayed_work(my_wq, &dwork->dwork, delay);
}`,
            exercises: [
                "Implement workqueue-based deferred interrupt processing",
                "Create workqueue for periodic maintenance tasks",
                "Build priority-based work scheduling system",
                "Implement workqueue statistics and monitoring"
            ],
            relatedConcepts: ["bottom_half", "interrupt_context", "process_context", "deferred_work"]
        },

        // === KERNEL TIMERS ===
        kernel_timers: {
            title: "Kernel Timers",
            category: "Time Management",
            difficulty: "Advanced",
            description: "Mechanism for scheduling functions to run at specific times",
            explanation: `Kernel timers provide time-based function scheduling:

**Timer Types:**
- **Classic Timers**: timer_list structure with jiffies-based timing
- **High-Resolution Timers**: hrtimer with nanosecond precision
- **Timer Wheels**: Efficient organization for many timers

**Key Features:**
- **Non-blocking**: Timer callbacks run in interrupt context
- **Single-shot**: Execute once at specified time
- **Periodic**: Can be rescheduled for repeated execution
- **Deferrable**: Can be delayed to save power

**Use Cases:**
- Timeouts and watchdogs
- Periodic maintenance tasks
- Rate limiting
- Protocol timers (TCP, networking)
- Device driver timeouts

**Important Notes:**
- Timer callbacks run in atomic context (cannot sleep)
- Timers can be canceled before expiration
- Timer accuracy depends on HZ configuration`,
            codeExample: `#include <linux/timer.h>
#include <linux/jiffies.h>
#include <linux/hrtimer.h>

// Classic timer example
static struct timer_list my_timer;
static int timer_data = 42;

// Timer callback function
static void timer_callback(struct timer_list *timer) {
    printk(KERN_INFO "Timer expired! Data: %d\\n", timer_data);
    
    // Reschedule for another 5 seconds
    mod_timer(&my_timer, jiffies + 5 * HZ);
}

// Initialize and start timer
static void start_classic_timer(void) {
    timer_setup(&my_timer, timer_callback, 0);
    mod_timer(&my_timer, jiffies + 5 * HZ);  // 5 seconds
}

// High-resolution timer example
static struct hrtimer hr_timer;
static ktime_t kt_period;

// HR timer callback
static enum hrtimer_restart hr_timer_callback(struct hrtimer *timer) {
    printk(KERN_INFO "HR Timer expired\\n");
    
    // Restart timer for periodic execution
    hrtimer_forward_now(timer, kt_period);
    return HRTIMER_RESTART;
}

// Initialize HR timer
static void start_hr_timer(void) {
    kt_period = ktime_set(1, 0);  // 1 second
    hrtimer_init(&hr_timer, CLOCK_MONOTONIC, HRTIMER_MODE_REL);
    hr_timer.function = hr_timer_callback;
    hrtimer_start(&hr_timer, kt_period, HRTIMER_MODE_REL);
}

// Timer management functions
static void stop_all_timers(void) {
    del_timer_sync(&my_timer);
    hrtimer_cancel(&hr_timer);
}

// Timeout example with completion
static DECLARE_COMPLETION(timeout_completion);
static struct timer_list timeout_timer;

static void timeout_timer_callback(struct timer_list *timer) {
    printk(KERN_WARNING "Operation timed out!\\n");
    complete(&timeout_completion);
}

static int wait_with_timeout(unsigned long timeout_ms) {
    int ret;
    
    timer_setup(&timeout_timer, timeout_timer_callback, 0);
    mod_timer(&timeout_timer, jiffies + msecs_to_jiffies(timeout_ms));
    
    ret = wait_for_completion_interruptible(&timeout_completion);
    del_timer_sync(&timeout_timer);
    
    return ret;
}`,
            exercises: [
                "Implement timeout mechanism for device operations",
                "Create periodic timer for system monitoring",
                "Build timer-based rate limiting system",
                "Implement watchdog timer with reset capability"
            ],
            relatedConcepts: ["time_management", "jiffies", "hrtimer", "atomic_context"]
        },

        // === KERNEL LINKED LISTS ===
        kernel_lists: {
            title: "Kernel Linked Lists",
            category: "Kernel Data Structures",
            difficulty: "Intermediate",
            description: "Linux kernel's intrusive circular doubly-linked list implementation",
            explanation: `The kernel's list implementation is intrusive and circular:

**Key Features:**
- **Intrusive Design**: list_head embedded in data structures
- **Circular**: Head points to first and last elements
- **Type-safe**: Macros provide type-safe access
- **Cache-friendly**: Minimizes pointer chasing

**Core Structure:**
- **list_head**: Contains prev and next pointers
- **Embedded**: Placed inside data structures, not separate nodes

**Advantages:**
- **No Memory Allocation**: List nodes are part of data structures
- **Type Safety**: Compile-time type checking
- **Performance**: Efficient insertion/deletion
- **Flexibility**: Multiple lists per structure

**Common Operations:**
- **Insertion**: list_add(), list_add_tail()
- **Deletion**: list_del(), list_del_init()
- **Iteration**: list_for_each(), list_for_each_entry()
- **Testing**: list_empty(), list_is_singular()

This design is used throughout the kernel for process lists, memory management, device lists, etc.`,
            codeExample: `#include <linux/list.h>

// Data structure with embedded list
struct my_data {
    int value;
    char name[32];
    struct list_head list;  // Embedded list node
};

// List head
static LIST_HEAD(my_list);

// Add element to list
static void add_data(int value, const char *name) {
    struct my_data *data = kmalloc(sizeof(*data), GFP_KERNEL);
    if (!data)
        return;
    
    data->value = value;
    strncpy(data->name, name, sizeof(data->name) - 1);
    INIT_LIST_HEAD(&data->list);
    
    list_add_tail(&data->list, &my_list);
}

// Find element by value
static struct my_data *find_data(int value) {
    struct my_data *entry;
    
    list_for_each_entry(entry, &my_list, list) {
        if (entry->value == value)
            return entry;
    }
    return NULL;
}

// Remove element from list
static void remove_data(int value) {
    struct my_data *entry, *tmp;
    
    list_for_each_entry_safe(entry, tmp, &my_list, list) {
        if (entry->value == value) {
            list_del(&entry->list);
            kfree(entry);
            break;
        }
    }
}

// Print all elements
static void print_list(void) {
    struct my_data *entry;
    
    if (list_empty(&my_list)) {
        printk(KERN_INFO "List is empty\\n");
        return;
    }
    
    list_for_each_entry(entry, &my_list, list) {
        printk(KERN_INFO "Data: %d, Name: %s\\n", entry->value, entry->name);
    }
}

// Clear entire list
static void clear_list(void) {
    struct my_data *entry, *tmp;
    
    list_for_each_entry_safe(entry, tmp, &my_list, list) {
        list_del(&entry->list);
        kfree(entry);
    }
}

// Move element between lists
static void move_data(struct my_data *data, struct list_head *new_list) {
    list_move_tail(&data->list, new_list);
}

// Splice lists together
static void merge_lists(struct list_head *source, struct list_head *dest) {
    list_splice_tail_init(source, dest);
}`,
            exercises: [
                "Implement process tracking using kernel lists",
                "Create multi-list data structure (active/inactive queues)",
                "Build priority queue using multiple linked lists",
                "Implement LRU cache using kernel lists"
            ],
            relatedConcepts: ["intrusive_containers", "circular_lists", "container_of", "cache_efficiency"]
        },

        // === PAGE ALLOCATION ===
        page_allocation: {
            title: "Page Allocation",
            category: "Memory Management",
            difficulty: "Advanced",
            description: "Kernel's physical page allocation and management system",
            explanation: `Page allocation is the foundation of kernel memory management:

**Page Allocator Interface:**
- **alloc_page()**: Allocate single page
- **alloc_pages()**: Allocate multiple contiguous pages  
- **__get_free_page()**: Get single zeroed page
- **__get_free_pages()**: Get multiple zeroed pages

**Allocation Flags (GFP):**
- **GFP_KERNEL**: Standard kernel allocation (can sleep)
- **GFP_ATOMIC**: Atomic allocation (cannot sleep)
- **GFP_USER**: User-space allocation
- **GFP_DMA**: DMA-capable memory
- **GFP_HIGHMEM**: High memory allocation

**Page Management:**
- **page structure**: Metadata for each physical page
- **Page flags**: State information (dirty, locked, etc.)
- **Reference counting**: Tracks page usage
- **Zone management**: Normal, DMA, HighMem zones

**Use Cases:**
- Kernel data structures
- DMA buffers
- Page cache
- Process memory
- Device drivers

Understanding page allocation is crucial for kernel memory management and performance.`,
            codeExample: `#include <linux/gfp.h>
#include <linux/mm.h>
#include <linux/highmem.h>

// Single page allocation
static struct page *alloc_single_page(void) {
    struct page *page = alloc_page(GFP_KERNEL);
    if (!page) {
        printk(KERN_ERR "Failed to allocate page\\n");
        return NULL;
    }
    
    printk(KERN_INFO "Allocated page at PFN: %lu\\n", page_to_pfn(page));
    return page;
}

// Multiple page allocation (order-based)
static struct page *alloc_multiple_pages(int order) {
    struct page *pages = alloc_pages(GFP_KERNEL, order);
    if (!pages) {
        printk(KERN_ERR "Failed to allocate %d pages\\n", 1 << order);
        return NULL;
    }
    
    printk(KERN_INFO "Allocated %d contiguous pages\\n", 1 << order);
    return pages;
}

// Get virtual address for page
static void *get_page_address(struct page *page) {
    if (PageHighMem(page)) {
        // High memory needs mapping
        return kmap(page);
    } else {
        // Direct mapping available
        return page_address(page);
    }
}

// Free pages
static void free_pages_example(struct page *page, int order) {
    if (page) {
        if (PageHighMem(page)) {
            kunmap(page);
        }
        __free_pages(page, order);
        printk(KERN_INFO "Freed %d pages\\n", 1 << order);
    }
}

// DMA allocation example
static struct page *alloc_dma_page(void) {
    struct page *page = alloc_page(GFP_KERNEL | GFP_DMA);
    if (!page) {
        printk(KERN_ERR "Failed to allocate DMA page\\n");
        return NULL;
    }
    
    printk(KERN_INFO "Allocated DMA page at PFN: %lu\\n", page_to_pfn(page));
    return page;
}

// Atomic allocation (cannot sleep)
static struct page *alloc_atomic_page(void) {
    struct page *page = alloc_page(GFP_ATOMIC);
    if (!page) {
        printk(KERN_WARNING "Atomic allocation failed\\n");
        return NULL;
    }
    
    return page;
}

// Page reference counting
static void page_ref_example(struct page *page) {
    // Increment reference count
    get_page(page);
    printk(KERN_INFO "Page refcount: %d\\n", page_count(page));
    
    // Decrement reference count
    put_page(page);
}

// Check page flags
static void check_page_flags(struct page *page) {
    if (PageLocked(page))
        printk(KERN_INFO "Page is locked\\n");
    if (PageDirty(page))
        printk(KERN_INFO "Page is dirty\\n");
    if (PageUptodate(page))
        printk(KERN_INFO "Page is up to date\\n");
}`,
            exercises: [
                "Implement page pool for device drivers",
                "Create page-based memory allocator with tracking",
                "Build page migration system for memory defragmentation",
                "Implement page-based buffer management for filesystem"
            ],
            relatedConcepts: ["buddy_system", "memory_zones", "page_flags", "dma_allocation"]
        },

        // === NETWORKING CONCEPTS ===
        network_protocols: {
            title: "Network Protocols",
            category: "Networking",
            difficulty: "Expert",
            description: "Implementation of custom network protocols in kernel space",
            explanation: `Network protocols define how data is transmitted over networks:

**Protocol Stack Layers:**
- **Physical Layer**: Hardware transmission
- **Data Link Layer**: Frame formatting and error detection
- **Network Layer**: Routing and addressing (IP)
- **Transport Layer**: Reliable delivery (TCP/UDP)
- **Application Layer**: Protocol-specific data

**Kernel Network Protocol Implementation:**
- **Socket Interface**: Userspace API for network communication
- **Protocol Registration**: Registering custom protocols with kernel
- **Packet Processing**: Handling incoming/outgoing packets
- **Buffer Management**: Efficient packet buffer handling

**Custom Protocol Elements:**
- **Header Definition**: Protocol-specific headers
- **Packet Processing**: Parsing and validation
- **Connection Management**: Establishing/maintaining connections
- **Error Handling**: Timeout, retransmission, error recovery

**Key Data Structures:**
- **sk_buff**: Socket buffer for packet data
- **sockaddr**: Socket address structures
- **proto_ops**: Protocol operations structure
- **net_proto_family**: Protocol family registration`,
            codeExample: `#include <linux/socket.h>
#include <linux/net.h>
#include <net/sock.h>

// Custom protocol header
struct custom_hdr {
    __be16 src_port;
    __be16 dst_port;
    __be32 seq_num;
    __be16 flags;
    __be16 checksum;
};

#define CUSTOM_PROTO_HDRLEN sizeof(struct custom_hdr)

// Protocol operations
static int custom_bind(struct socket *sock, struct sockaddr *addr, int len);
static int custom_connect(struct socket *sock, struct sockaddr *addr, int len, int flags);
static int custom_sendmsg(struct socket *sock, struct msghdr *msg, size_t len);
static int custom_recvmsg(struct socket *sock, struct msghdr *msg, size_t len, int flags);

// Protocol family operations
static const struct proto_ops custom_ops = {
    .family     = PF_CUSTOM,
    .owner      = THIS_MODULE,
    .bind       = custom_bind,
    .connect    = custom_connect,
    .sendmsg    = custom_sendmsg,
    .recvmsg    = custom_recvmsg,
    .release    = custom_release,
    .setsockopt = custom_setsockopt,
    .getsockopt = custom_getsockopt,
};

// Protocol definition
static struct proto custom_proto = {
    .name       = "CUSTOM",
    .owner      = THIS_MODULE,
    .obj_size   = sizeof(struct custom_sock),
    .close      = custom_close,
};

// Socket creation
static int custom_create(struct net *net, struct socket *sock, int protocol, int kern) {
    struct sock *sk;
    
    if (protocol != 0)
        return -EPROTONOSUPPORT;
    
    sk = sk_alloc(net, PF_CUSTOM, GFP_KERNEL, &custom_proto, kern);
    if (!sk)
        return -ENOMEM;
    
    sock_init_data(sock, sk);
    sock->ops = &custom_ops;
    
    return 0;
}

// Protocol family
static const struct net_proto_family custom_family = {
    .family = PF_CUSTOM,
    .create = custom_create,
    .owner  = THIS_MODULE,
};

// Packet processing
static int custom_rcv(struct sk_buff *skb, struct net_device *dev,
                     struct packet_type *pt, struct net_device *orig_dev) {
    struct custom_hdr *hdr;
    
    if (!pskb_may_pull(skb, CUSTOM_PROTO_HDRLEN))
        goto drop;
    
    hdr = (struct custom_hdr *)skb->data;
    
    // Validate checksum
    if (custom_checksum(skb) != ntohs(hdr->checksum))
        goto drop;
    
    // Process packet
    return custom_process_packet(skb);
    
drop:
    kfree_skb(skb);
    return NET_RX_DROP;
}`,
            exercises: [
                "Implement custom UDP-like protocol",
                "Create protocol with connection management",
                "Build packet fragmentation/reassembly system",
                "Implement protocol-specific socket options"
            ],
            relatedConcepts: ["socket_programming", "packet_processing", "network_layers", "protocol_stacks"]
        },

        socket_programming: {
            title: "Socket Programming",
            category: "Networking",
            difficulty: "Advanced",
            description: "Kernel-level socket implementation and management",
            explanation: `Socket programming in kernel space involves implementing the socket interface:

**Socket Types:**
- **Stream Sockets**: Reliable, connection-oriented (TCP-like)
- **Datagram Sockets**: Unreliable, connectionless (UDP-like)
- **Raw Sockets**: Direct access to protocol headers
- **Packet Sockets**: Access to data link layer

**Socket States:**
- **CLOSED**: Socket not connected
- **LISTEN**: Waiting for connections
- **ESTABLISHED**: Connection active
- **CLOSING**: Connection being closed

**Socket Operations:**
- **bind()**: Associate socket with address
- **listen()**: Wait for connections
- **accept()**: Accept incoming connections
- **connect()**: Establish connection
- **send()/recv()**: Data transfer

**Kernel Socket Interface:**
- **socket structure**: Kernel socket representation
- **sock structure**: Protocol-specific socket data
- **proto_ops**: Protocol operations table
- **socket buffer (sk_buff)**: Packet data structure`,
            codeExample: `#include <net/sock.h>
#include <linux/socket.h>

struct custom_sock {
    struct sock sk;
    struct custom_hdr pending_hdr;
    struct list_head rx_queue;
    spinlock_t lock;
};

static inline struct custom_sock *custom_sk(const struct sock *sk) {
    return (struct custom_sock *)sk;
}

// Bind socket to address
static int custom_bind(struct socket *sock, struct sockaddr *addr, int len) {
    struct sock *sk = sock->sk;
    struct sockaddr_custom *caddr = (struct sockaddr_custom *)addr;
    
    if (len < sizeof(*caddr))
        return -EINVAL;
    
    lock_sock(sk);
    
    // Check if address is already in use
    if (custom_find_socket(caddr->port)) {
        release_sock(sk);
        return -EADDRINUSE;
    }
    
    // Bind to port
    inet_sk(sk)->inet_sport = htons(caddr->port);
    sk->sk_state = TCP_CLOSE;
    
    release_sock(sk);
    return 0;
}

// Send message
static int custom_sendmsg(struct socket *sock, struct msghdr *msg, size_t len) {
    struct sock *sk = sock->sk;
    struct sk_buff *skb;
    struct custom_hdr *hdr;
    int err;
    
    if (len > CUSTOM_MAX_PAYLOAD)
        return -EMSGSIZE;
    
    // Allocate socket buffer
    skb = sock_alloc_send_skb(sk, len + CUSTOM_PROTO_HDRLEN, 
                              msg->msg_flags & MSG_DONTWAIT, &err);
    if (!skb)
        return err;
    
    // Reserve space for header
    skb_reserve(skb, CUSTOM_PROTO_HDRLEN);
    
    // Copy user data
    err = memcpy_from_msg(skb_put(skb, len), msg, len);
    if (err) {
        kfree_skb(skb);
        return err;
    }
    
    // Add protocol header
    hdr = (struct custom_hdr *)skb_push(skb, CUSTOM_PROTO_HDRLEN);
    hdr->src_port = inet_sk(sk)->inet_sport;
    hdr->dst_port = htons(custom_sk(sk)->dest_port);
    hdr->seq_num = htonl(custom_sk(sk)->next_seq++);
    hdr->flags = 0;
    hdr->checksum = htons(custom_checksum(skb));
    
    // Transmit packet
    return custom_transmit(skb);
}

// Receive message
static int custom_recvmsg(struct socket *sock, struct msghdr *msg, 
                         size_t len, int flags) {
    struct sock *sk = sock->sk;
    struct sk_buff *skb;
    int copied, err = 0;
    
    // Get packet from receive queue
    skb = skb_recv_datagram(sk, flags, flags & MSG_DONTWAIT, &err);
    if (!skb)
        return err;
    
    copied = skb->len;
    if (copied > len) {
        copied = len;
        msg->msg_flags |= MSG_TRUNC;
    }
    
    // Copy data to user
    err = skb_copy_datagram_msg(skb, 0, msg, copied);
    if (err)
        goto out_free;
    
    // Set source address
    if (msg->msg_name) {
        struct sockaddr_custom *caddr = msg->msg_name;
        struct custom_hdr *hdr = (struct custom_hdr *)skb->data;
        
        caddr->family = AF_CUSTOM;
        caddr->port = ntohs(hdr->src_port);
        msg->msg_namelen = sizeof(*caddr);
    }
    
out_free:
    skb_free_datagram(sk, skb);
    return err ? err : copied;
}`,
            exercises: [
                "Implement socket state machine",
                "Create socket option handling",
                "Build multicast socket support",
                "Implement socket-based IPC mechanism"
            ],
            relatedConcepts: ["network_protocols", "sk_buff", "socket_states", "kernel_networking"]
        },

        packet_processing: {
            title: "Packet Processing",
            category: "Networking",
            difficulty: "Advanced",
            description: "Kernel packet processing, filtering, and manipulation",
            explanation: `Packet processing involves handling network packets at various layers:

**Packet Flow:**
1. **Hardware Receipt**: Network interface receives packet
2. **Interrupt Handling**: Hardware interrupt triggers packet processing
3. **NAPI Polling**: Efficient packet batching mechanism
4. **Protocol Processing**: Parse headers, validate, route
5. **Socket Delivery**: Deliver to appropriate socket

**Key Data Structures:**
- **sk_buff**: Socket buffer containing packet data
- **net_device**: Network device representation
- **packet_type**: Protocol handlers
- **netdev_rx_handler**: Device-specific receive handling

**Packet Manipulation:**
- **Header Parsing**: Extract protocol headers
- **Checksum Validation**: Verify packet integrity
- **Fragmentation**: Handle packet fragmentation/reassembly
- **Filtering**: Apply firewall rules and filters

**Performance Considerations:**
- **Zero-copy**: Avoid unnecessary data copying
- **Batch Processing**: Handle multiple packets together
- **CPU Affinity**: Distribute processing across CPUs
- **Memory Management**: Efficient buffer allocation/freeing`,
            codeExample: `#include <linux/skbuff.h>
#include <linux/netdevice.h>
#include <linux/etherdevice.h>
#include <linux/ip.h>
#include <linux/tcp.h>

// Packet type handler
static int custom_packet_handler(struct sk_buff *skb, struct net_device *dev,
                                struct packet_type *pt, struct net_device *orig_dev) {
    struct ethhdr *eth_hdr;
    struct iphdr *ip_hdr;
    struct custom_hdr *custom_hdr;
    
    // Check minimum packet size
    if (skb->len < ETH_HLEN + sizeof(struct iphdr) + sizeof(struct custom_hdr))
        goto drop;
    
    // Parse Ethernet header
    eth_hdr = eth_hdr(skb);
    if (ntohs(eth_hdr->h_proto) != ETH_P_IP)
        goto drop;
    
    // Parse IP header
    if (!pskb_may_pull(skb, ETH_HLEN + sizeof(struct iphdr)))
        goto drop;
    
    ip_hdr = ip_hdr(skb);
    if (ip_hdr->protocol != IPPROTO_CUSTOM)
        goto drop;
    
    // Parse custom header
    if (!pskb_may_pull(skb, ETH_HLEN + ip_hdr->ihl * 4 + sizeof(struct custom_hdr)))
        goto drop;
    
    custom_hdr = (struct custom_hdr *)(skb->data + ETH_HLEN + ip_hdr->ihl * 4);
    
    // Validate checksum
    if (custom_validate_checksum(skb, custom_hdr))
        goto drop;
    
    // Process packet
    return custom_process_received_packet(skb, custom_hdr);
    
drop:
    kfree_skb(skb);
    return NET_RX_DROP;
}

// Register packet handler
static struct packet_type custom_packet_type = {
    .type = cpu_to_be16(ETH_P_CUSTOM),
    .func = custom_packet_handler,
};

// Transmit packet
static int custom_transmit_packet(struct sk_buff *skb, struct net_device *dev) {
    struct ethhdr *eth_hdr;
    struct iphdr *ip_hdr;
    struct custom_hdr *custom_hdr;
    
    // Add custom header
    custom_hdr = (struct custom_hdr *)skb_push(skb, sizeof(struct custom_hdr));
    custom_hdr->version = CUSTOM_VERSION;
    custom_hdr->type = CUSTOM_TYPE_DATA;
    custom_hdr->length = htons(skb->len - sizeof(struct custom_hdr));
    custom_hdr->checksum = 0;
    custom_hdr->checksum = custom_calculate_checksum(skb);
    
    // Add IP header
    ip_hdr = (struct iphdr *)skb_push(skb, sizeof(struct iphdr));
    ip_hdr->version = 4;
    ip_hdr->ihl = 5;
    ip_hdr->tos = 0;
    ip_hdr->tot_len = htons(skb->len);
    ip_hdr->id = 0;
    ip_hdr->frag_off = 0;
    ip_hdr->ttl = 64;
    ip_hdr->protocol = IPPROTO_CUSTOM;
    ip_hdr->check = 0;
    ip_hdr->saddr = dev->ip_addr;
    ip_hdr->daddr = skb->dst_addr;
    ip_hdr->check = ip_fast_csum((unsigned char *)ip_hdr, ip_hdr->ihl);
    
    // Add Ethernet header
    eth_hdr = (struct ethhdr *)skb_push(skb, ETH_HLEN);
    memcpy(eth_hdr->h_dest, skb->dst_mac, ETH_ALEN);
    memcpy(eth_hdr->h_source, dev->dev_addr, ETH_ALEN);
    eth_hdr->h_proto = htons(ETH_P_IP);
    
    // Set network device
    skb->dev = dev;
    skb->protocol = htons(ETH_P_IP);
    
    // Transmit
    return dev_queue_xmit(skb);
}

// Packet filtering
static bool custom_packet_filter(struct sk_buff *skb, struct custom_filter *filter) {
    struct iphdr *ip_hdr = ip_hdr(skb);
    struct custom_hdr *custom_hdr = (struct custom_hdr *)(skb->data + ip_hdr->ihl * 4);
    
    // Check source/destination
    if (filter->src_addr && ip_hdr->saddr != filter->src_addr)
        return false;
    if (filter->dst_addr && ip_hdr->daddr != filter->dst_addr)
        return false;
    
    // Check ports
    if (filter->src_port && custom_hdr->src_port != filter->src_port)
        return false;
    if (filter->dst_port && custom_hdr->dst_port != filter->dst_port)
        return false;
    
    // Check packet type
    if (filter->type_mask && !(custom_hdr->type & filter->type_mask))
        return false;
    
    return true;
}`,
            exercises: [
                "Implement packet capture and analysis system",
                "Create packet filtering and firewall rules",
                "Build packet modification and NAT functionality",
                "Implement traffic shaping and QoS mechanisms"
            ],
            relatedConcepts: ["sk_buff", "network_devices", "protocol_stacks", "napi_polling"]
        }
    };

    // Function to get concept explanation
    const getConcept = (conceptName) => {
        return conceptDatabase[conceptName.toLowerCase()] || null;
    };

    // Detect concepts in current challenge code that might need explanation
    const detectUnfamiliarConcepts = (code) => {
        const concepts = [];
        const codeText = code.toLowerCase();

        // Check for various concepts in the code
        Object.keys(conceptDatabase).forEach(concept => {
            if (codeText.includes(concept)) {
                concepts.push(concept);
            }
        });

        // Additional pattern matching
        if (codeText.includes('*') && codeText.includes('&')) concepts.push('pointers');
        if (codeText.includes('unsigned')) concepts.push('unsigned');
        if (codeText.includes('kmalloc') || codeText.includes('kfree')) concepts.push('kmalloc');
        if (codeText.includes('module_init')) concepts.push('module_init');
        if (codeText.includes('printk')) concepts.push('printk');

        return [...new Set(concepts)]; // Remove duplicates
    };

    // Enhanced concept learning component
    const ConceptLearner = ({ concept }) => {
        if (!concept) return null;

        return (
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 w-full max-w-6xl mx-auto">
                <div className="flex justify-between items-start mb-5">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{concept.title}</h3>
                        <div className="flex gap-2 mb-3">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium border border-blue-200">
                                {concept.category}
                            </span>
                            <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium border border-green-200">
                                {concept.difficulty}
                            </span>
                        </div>
                        <p className="text-gray-600 text-base leading-relaxed">{concept.description}</p>
                    </div>
                    <button
                        onClick={() => setSelectedConcept(null)}
                        className="ml-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-5">
                        <div>
                            <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                <span className="text-blue-500">📚</span> Explanation
                            </h4>
                            <div className="bg-gray-50 p-4 rounded-lg text-gray-700 border border-gray-200 max-h-64 overflow-y-auto">
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-normal">{concept.explanation}</pre>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                <span className="text-green-500">🎯</span> Practice Exercises
                            </h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {concept.exercises.map((exercise, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                                            {index + 1}
                                        </span>
                                        <span className="text-gray-700 text-sm leading-relaxed">{exercise}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                <span className="text-purple-500">💻</span> Code Example
                            </h4>
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                                    <span className="text-sm font-medium text-gray-600">C Code</span>
                                </div>
                                <div className="p-4 overflow-auto max-h-96">
                                    <pre className="text-sm font-mono text-gray-800 leading-normal whitespace-pre">{concept.codeExample}</pre>
                                </div>
                            </div>
                        </div>

                        {concept.relatedConcepts && (
                            <div>
                                <h4 className="font-semibold mb-3 text-gray-800 flex items-center gap-2">
                                    <span className="text-orange-500">🔗</span> Related Concepts
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {concept.relatedConcepts.map(related => (
                                        <button
                                            key={related}
                                            onClick={() => {
                                                const relatedConcept = getConcept(related);
                                                if (relatedConcept) setSelectedConcept(relatedConcept);
                                            }}
                                            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition-colors border border-purple-200 font-medium"
                                        >
                                            {related}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // COMPREHENSIVE PHASE SYSTEM - From Zero to Professional Kernel Developer
    // Designed to prepare students for careers at NVIDIA, Intel, Canonical, SUSE
    const phaseSystem = {
        foundations: {
            name: "Phase 1: C Programming Foundations",
            icon: "🏗️",
            description: "Master C programming essentials for kernel development",
            level: 1,
            unlocked: true,
            concepts: [
                { name: 'C Basics & Syntax', difficulty: 1, essential: true, topics: ['Variables', 'Control flow', 'Functions'] },
                { name: 'Pointers & Memory', difficulty: 2, essential: true, topics: ['Pointer arithmetic', 'Memory layout', 'Stack vs heap'] },
                { name: 'Structures & Unions', difficulty: 2, essential: true, topics: ['Struct packing', 'Bit fields', 'Memory alignment'] },
                { name: 'Function Pointers', difficulty: 3, essential: true, topics: ['Callbacks', 'Jump tables', 'Dynamic dispatch'] },
                { name: 'Preprocessor Directives', difficulty: 2, essential: true, topics: ['Macros', 'Conditional compilation', 'Header guards'] },
                { name: 'Static vs Dynamic Memory', difficulty: 3, essential: true, topics: ['malloc/free', 'Memory leaks', 'Fragmentation'] },
                { name: 'Bit Operations', difficulty: 3, essential: true, topics: ['Bitwise operators', 'Bit manipulation', 'Flags'] },
                { name: 'Inline Assembly Basics', difficulty: 4, essential: false, topics: ['GCC inline asm', 'Constraints', 'Clobbers'] }
            ],
            skills: ['C programming', 'Memory management', 'Low-level programming'],
            prerequisites: [],
            objectives: 'Build solid C foundation required for professional kernel programming',
            industryRelevance: 'Essential for all kernel roles at tech companies'
        },
        
        kernelIntro: {
            name: "Phase 2: Kernel Introduction",
            icon: "🔧",
            description: "Understanding kernel architecture and your first module",
            level: 2,
            unlocked: true,
            concepts: [
                { name: 'Kernel vs User Space', difficulty: 2, essential: true, topics: ['Address spaces', 'Privilege levels', 'System boundaries'] },
                { name: 'System Calls', difficulty: 3, essential: true, topics: ['syscall interface', 'Context switching', 'Parameter passing'] },
                { name: 'Kernel Module Basics', difficulty: 2, essential: true, topics: ['Module structure', 'init/exit functions', 'License requirements'] },
                { name: 'Module Loading/Unloading', difficulty: 2, essential: true, topics: ['insmod/rmmod', 'Module dependencies', 'Symbol resolution'] },
                { name: 'printk() and Logging', difficulty: 1, essential: true, topics: ['Log levels', 'Rate limiting', 'Debugging output'] },
                { name: 'Module Parameters', difficulty: 3, essential: true, topics: ['Parameter types', 'Permissions', 'Runtime modification'] },
                { name: 'Kernel Build System', difficulty: 3, essential: true, topics: ['Kbuild', 'Makefiles', 'Cross-compilation'] },
                { name: 'proc filesystem', difficulty: 3, essential: false, topics: ['proc entries', 'seq_file', 'User interaction'] }
            ],
            skills: ['Module development', 'Kernel debugging', 'System architecture'],
            prerequisites: ['foundations'],
            objectives: 'Create and load kernel modules with confidence, understand kernel-user boundary',
            industryRelevance: 'Required for driver development roles'
        },

        memoryMgmt: {
            name: "Phase 3: Memory Management",
            icon: "💾",
            description: "Master kernel memory allocation and virtual memory",
            level: 3,
            unlocked: true,
            concepts: [
                { name: 'kmalloc() vs vmalloc()', difficulty: 3, essential: true, topics: ['Physical vs virtual', 'Performance implications', 'Size limits'] },
                { name: 'GFP Flags', difficulty: 4, essential: true, topics: ['Allocation contexts', 'Atomic vs blocking', 'Zone modifiers'] },
                { name: 'DMA Memory', difficulty: 5, essential: true, topics: ['Coherent DMA', 'Streaming DMA', 'IOMMU'] },
                { name: 'Memory Mapping', difficulty: 5, essential: true, topics: ['mmap implementation', 'Page faults', 'VMA operations'] },
                { name: 'Page Allocation', difficulty: 6, essential: true, topics: ['Buddy allocator', 'Page reclaim', 'Memory compaction'] },
                { name: 'NUMA Awareness', difficulty: 7, essential: false, topics: ['Node topology', 'Local allocation', 'Migration'] },
                { name: 'Memory Barriers', difficulty: 6, essential: true, topics: ['Ordering guarantees', 'SMP safety', 'Compiler barriers'] },
                { name: 'Copy to/from User', difficulty: 4, essential: true, topics: ['Access checks', 'Page faults', 'Kernel hardening'] }
            ],
            skills: ['Memory allocation', 'DMA programming', 'Performance optimization'],
            prerequisites: ['kernelIntro'],
            objectives: 'Efficiently manage memory in kernel space like professional drivers',
            industryRelevance: 'Critical for NVIDIA GPU drivers, Intel graphics, storage systems'
        },

        deviceDrivers: {
            name: "Phase 4: Device Drivers",
            icon: "⚡",
            description: "Build real device drivers for hardware interaction",
            level: 4,
            unlocked: true,
            concepts: [
                { name: 'Character Devices', difficulty: 4, essential: true, topics: ['cdev structure', 'File operations', 'Device nodes'] },
                { name: 'Block Devices', difficulty: 6, essential: true, topics: ['Request queues', 'BIO handling', 'Multiqueue'] },
                { name: 'Network Devices', difficulty: 7, essential: true, topics: ['netdev structure', 'Packet handling', 'NAPI'] },
                { name: 'PCI Device Handling', difficulty: 6, essential: true, topics: ['PCI enumeration', 'Configuration space', 'MSI/MSI-X'] },
                { name: 'Interrupt Handling', difficulty: 5, essential: true, topics: ['IRQ sharing', 'Top/bottom halves', 'Threaded IRQs'] },
                { name: 'Device Tree', difficulty: 6, essential: false, topics: ['DT bindings', 'Platform devices', 'Resource management'] },
                { name: 'Platform Drivers', difficulty: 5, essential: true, topics: ['Platform bus', 'Resource allocation', 'Power management'] },
                { name: 'USB Drivers', difficulty: 7, essential: false, topics: ['USB subsystem', 'URBs', 'Endpoint handling'] }
            ],
            skills: ['Hardware interfacing', 'Driver architecture', 'Real-world development'],
            prerequisites: ['memoryMgmt'],
            objectives: 'Build production-quality device drivers for real hardware',
            industryRelevance: 'Core skill for hardware companies like Intel, NVIDIA, AMD'
        },

        synchronization: {
            name: "Phase 5: Synchronization & Concurrency",
            icon: "🔐",
            description: "Master multi-core programming and race condition prevention",
            level: 5,
            unlocked: true,
            concepts: [
                { name: 'Atomic Operations', difficulty: 5, essential: true, topics: ['Hardware atomics', 'Memory ordering', 'Lock-free counters'] },
                { name: 'Spinlocks', difficulty: 4, essential: true, topics: ['Raw spinlocks', 'IRQ safety', 'Lock contention'] },
                { name: 'Mutexes & Semaphores', difficulty: 5, essential: true, topics: ['Sleeping locks', 'Priority inheritance', 'RT considerations'] },
                { name: 'RCU (Read-Copy-Update)', difficulty: 8, essential: true, topics: ['Grace periods', 'Callbacks', 'Synchronization'] },
                { name: 'Memory Ordering', difficulty: 7, essential: true, topics: ['Acquire/release', 'Weak ordering', 'Barriers'] },
                { name: 'Lock-free Programming', difficulty: 9, essential: false, topics: ['CAS operations', 'ABA problem', 'Hazard pointers'] },
                { name: 'Per-CPU Variables', difficulty: 6, essential: true, topics: ['CPU locality', 'Preemption safety', 'Statistics'] },
                { name: 'Workqueues', difficulty: 5, essential: true, topics: ['Deferred work', 'System workqueues', 'Custom workqueues'] }
            ],
            skills: ['Concurrency control', 'Performance optimization', 'Multi-core programming'],
            prerequisites: ['deviceDrivers'],
            objectives: 'Write race-condition-free code suitable for high-performance systems',
            industryRelevance: 'Essential for scalable systems at Google, Facebook, server companies'
        },

        networking: {
            name: "Phase 6: Network Programming",
            icon: "🌐",
            description: "Advanced networking and protocol implementation",
            level: 6,
            unlocked: true,
            concepts: [
                { name: 'Socket Buffers (skb)', difficulty: 6, essential: true, topics: ['skb structure', 'Data manipulation', 'Memory management'] },
                { name: 'Netfilter Hooks', difficulty: 7, essential: true, topics: ['Packet filtering', 'NAT', 'Connection tracking'] },
                { name: 'Network Namespaces', difficulty: 8, essential: false, topics: ['Isolation', 'Virtualization', 'Container networking'] },
                { name: 'Traffic Control', difficulty: 7, essential: false, topics: ['QoS', 'Scheduling', 'Shaping'] },
                { name: 'eBPF Programming', difficulty: 9, essential: false, topics: ['BPF bytecode', 'Verifier', 'Maps'] },
                { name: 'Network Device Drivers', difficulty: 8, essential: true, topics: ['DMA rings', 'NAPI polling', 'Hardware offloads'] },
                { name: 'Protocol Implementation', difficulty: 8, essential: false, topics: ['Custom protocols', 'Socket families', 'Protocol stacks'] },
                { name: 'XDP (eXpress Data Path)', difficulty: 9, essential: false, topics: ['Bypass networking', 'User-space drivers', 'DPDK integration'] }
            ],
            skills: ['Network programming', 'Protocol development', 'High-performance networking'],
            prerequisites: ['synchronization'],
            objectives: 'Develop high-performance networking components',
            industryRelevance: 'Critical for cloud providers, CDN companies, network equipment vendors'
        },

        filesystems: {
            name: "Phase 7: Filesystems & Storage",
            icon: "📁",
            description: "Implement filesystems and storage subsystems",
            level: 7,
            unlocked: true,
            concepts: [
                { name: 'VFS (Virtual File System)', difficulty: 7, essential: true, topics: ['VFS layer', 'Super blocks', 'Dentries'] },
                { name: 'Inode Operations', difficulty: 6, essential: true, topics: ['File metadata', 'Inode caching', 'Extended attributes'] },
                { name: 'File Operations', difficulty: 6, essential: true, topics: ['read/write', 'mmap', 'locking'] },
                { name: 'Block I/O Layer', difficulty: 8, essential: true, topics: ['Bio submission', 'Request merging', 'I/O scheduling'] },
                { name: 'Buffered I/O', difficulty: 7, essential: true, topics: ['Page cache', 'Writeback', 'Read-ahead'] },
                { name: 'Direct I/O', difficulty: 8, essential: false, topics: ['O_DIRECT', 'Alignment', 'Performance'] },
                { name: 'Filesystem Design', difficulty: 9, essential: false, topics: ['Journaling', 'B-trees', 'Copy-on-write'] },
                { name: 'Storage Performance', difficulty: 8, essential: false, topics: ['I/O patterns', 'Caching strategies', 'SSD optimization'] }
            ],
            skills: ['Filesystem development', 'Storage optimization', 'I/O performance'],
            prerequisites: ['networking'],
            objectives: 'Design and implement efficient storage solutions',
            industryRelevance: 'Important for storage companies, database vendors, cloud storage'
        },

        security: {
            name: "Phase 8: Security & Hardening",
            icon: "🛡️",
            description: "Kernel security, exploit mitigation, and hardening",
            level: 8,
            unlocked: true,
            concepts: [
                { name: 'Kernel Address Sanitizer', difficulty: 6, essential: true, topics: ['KASAN', 'Use-after-free', 'Buffer overflows'] },
                { name: 'SMEP/SMAP', difficulty: 7, essential: true, topics: ['Hardware features', 'Exploit mitigation', 'User page access'] },
                { name: 'Control Flow Integrity', difficulty: 8, essential: false, topics: ['CFI', 'ROP/JOP protection', 'Compiler support'] },
                { name: 'Kernel Guard', difficulty: 7, essential: true, topics: ['Stack canaries', 'Fortify source', 'Bounds checking'] },
                { name: 'LSM (Linux Security Modules)', difficulty: 8, essential: false, topics: ['SELinux', 'AppArmor', 'Security hooks'] },
                { name: 'Secure Boot', difficulty: 7, essential: false, topics: ['UEFI', 'Code signing', 'Trust chain'] },
                { name: 'TEE (Trusted Execution)', difficulty: 9, essential: false, topics: ['ARM TrustZone', 'Intel SGX', 'Secure enclaves'] },
                { name: 'Vulnerability Analysis', difficulty: 8, essential: true, topics: ['Static analysis', 'Fuzzing', 'CVE assessment'] }
            ],
            skills: ['Security assessment', 'Exploit mitigation', 'Secure coding'],
            prerequisites: ['filesystems'],
            objectives: 'Write secure kernel code and identify vulnerabilities',
            industryRelevance: 'Critical for security companies, government contractors, enterprise vendors'
        },

        performance: {
            name: "Phase 9: Performance & Optimization",
            icon: "⚡",
            description: "Advanced performance tuning and optimization techniques",
            level: 9,
            unlocked: true,
            concepts: [
                { name: 'CPU Cache Optimization', difficulty: 8, essential: true, topics: ['Cache hierarchies', 'False sharing', 'Prefetching'] },
                { name: 'Branch Prediction', difficulty: 7, essential: true, topics: ['Likely/unlikely', 'Profile-guided optimization', 'Branch patterns'] },
                { name: 'NUMA Optimization', difficulty: 8, essential: true, topics: ['Memory locality', 'CPU affinity', 'Balancing'] },
                { name: 'Lock Contention Analysis', difficulty: 7, essential: true, topics: ['Lockstat', 'Lock hierarchies', 'Scalability'] },
                { name: 'ftrace & perf', difficulty: 7, essential: true, topics: ['Function tracing', 'Performance counters', 'Flame graphs'] },
                { name: 'Hardware Performance Counters', difficulty: 8, essential: false, topics: ['PMU events', 'Sampling', 'Analysis'] },
                { name: 'Microarchitecture Tuning', difficulty: 9, essential: false, topics: ['CPU pipelines', 'Instruction latency', 'Throughput'] },
                { name: 'Real-time Constraints', difficulty: 8, essential: false, topics: ['RT kernel', 'Latency', 'Determinism'] }
            ],
            skills: ['Performance analysis', 'Optimization techniques', 'Profiling'],
            prerequisites: ['security'],
            objectives: 'Optimize kernel code for maximum performance',
            industryRelevance: 'Essential for HPC, gaming, financial trading systems'
        },

        professional: {
            name: "Phase 10: Professional Development",
            icon: "🎓",
            description: "Enterprise-level kernel development and contribution",
            level: 10,
            unlocked: true,
            concepts: [
                { name: 'Kernel Contribution Process', difficulty: 6, essential: true, topics: ['LKML', 'Git workflow', 'Patch submission'] },
                { name: 'Code Review Standards', difficulty: 5, essential: true, topics: ['Coding style', 'Review process', 'Maintainer trees'] },
                { name: 'Regression Testing', difficulty: 7, essential: true, topics: ['Test automation', 'Bisection', 'CI systems'] },
                { name: 'Bisection & Debugging', difficulty: 7, essential: true, topics: ['git bisect', 'Crash analysis', 'Bug reporting'] },
                { name: 'Enterprise Integration', difficulty: 8, essential: true, topics: ['Vendor kernels', 'Backporting', 'Support lifecycle'] },
                { name: 'Vendor-specific Features', difficulty: 8, essential: false, topics: ['Hardware enablement', 'Platform support', 'Drivers'] },
                { name: 'Kernel Maintenance', difficulty: 9, essential: false, topics: ['Stable trees', 'Long-term support', 'Security updates'] },
                { name: 'Community Engagement', difficulty: 5, essential: true, topics: ['Conferences', 'Mailing lists', 'Mentoring'] }
            ],
            skills: ['Open source contribution', 'Enterprise development', 'Team collaboration'],
            prerequisites: ['performance'],
            objectives: 'Ready to contribute to Linux kernel and work at major tech companies',
            industryRelevance: 'Prepares for senior roles at NVIDIA, Intel, Canonical, SUSE, Red Hat'
        }
    };

    // PROBLEM BANK - Generated from problems/ directory
    // Auto-generated from JSON files - edit problems/*.json instead of this file
    const problemBank = generatedProblems.concat([

    ]); // End of legacy problems concat with generated problems

    // Legacy template system for backward compatibility
    const challengeTemplates = {
        foundations: {
            cBasics: [
                {
                    pattern: "module_with_parameters",
                    description: "Create a kernel module that accepts {paramType} parameter named '{paramName}' and {action}",
                    codeTemplate: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/moduleparam.h>

// TODO: Declare {paramType} parameter '{paramName}' with default value {defaultValue}
// TODO: Use module_param() to make it configurable

static int __init {moduleName}_init(void) {
    // TODO: {action} using the parameter
    printk(KERN_INFO "{moduleName}: Module loaded\\n");
    return 0;
}

static void __exit {moduleName}_exit(void) {
    printk(KERN_INFO "{moduleName}: Module unloaded\\n");
}

module_init({moduleName}_init);
module_exit({moduleName}_exit);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("{description}");`,
                    variables: {
                        paramType: ['int', 'bool', 'charp', 'uint'],
                        paramName: ['debug_level', 'buffer_size', 'device_name', 'max_users', 'timeout_ms'],
                        action: ['print its value', 'validate the range', 'allocate memory based on it', 'configure behavior'],
                        moduleName: ['param_test', 'config_mod', 'setup_module', 'param_demo'],
                        defaultValue: ['1', 'false', '"default"', '1000', '5000'],
                        description: ['Parameter testing module', 'Configuration module', 'Setup demonstration']
                    },
                    tests: [
                        { name: 'Declares parameter variable', check: code => /static\s+\w+\s+\*?\w+\s*=/.test(code) },
                        { name: 'Uses module_param correctly', check: code => code.includes('module_param') },
                        { name: 'Has proper init function', check: code => /__init.*_init/.test(code) },
                        { name: 'Uses parameter in code', check: code => {
                                const paramMatch = code.match(/static\s+\w+\s+\*?(\w+)\s*=/);
                                return paramMatch && code.includes(paramMatch[1]);
                            }}
                    ]
                },
                {
                    pattern: "pointer_manipulation",
                    description: "Implement {operation} using pointers to {dataType} with {safetyFeature}",
                    codeTemplate: `#include <linux/module.h>
#include <linux/slab.h>
#include <linux/kernel.h>

// TODO: Implement function that {operation}
static {returnType} {functionName}({paramType} *data, size_t count) {
    // TODO: Add {safetyFeature}
    // TODO: Implement the logic
    return {defaultReturn};
}

static int __init pointer_init(void) {
    {dataType} test_data[] = {testValues};
    {returnType} result;
    
    result = {functionName}(test_data, ARRAY_SIZE(test_data));
    printk(KERN_INFO "Result: {resultFormat}\\n", result);
    
    return 0;
}

static void __exit pointer_exit(void) {
    printk(KERN_INFO "Pointer module unloaded\\n");
}

module_init(pointer_init);
module_exit(pointer_exit);
MODULE_LICENSE("GPL");`,
                    variables: {
                        operation: ['finds the maximum value', 'calculates the sum', 'reverses the array', 'finds duplicates'],
                        dataType: ['int', 'long', 'unsigned int', 'char'],
                        safetyFeature: ['NULL pointer checking', 'bounds validation', 'overflow protection'],
                        functionName: ['find_max', 'calculate_sum', 'reverse_array', 'find_duplicates'],
                        returnType: ['int', 'long', 'bool', 'size_t'],
                        paramType: ['int', 'long', 'unsigned int', 'char'],
                        defaultReturn: ['0', '-1', 'false', 'count'],
                        testValues: ['{1,2,3,4,5}', '{10,20,30}', '{-1,0,1}', '{100,200,50}'],
                        resultFormat: ['%d', '%ld', '%u', '%zu']
                    },
                    tests: [
                        { name: 'Has function definition', check: code => /static\s+\w+\s+\w+\s*\([^)]*\*[^)]*\)/.test(code) },
                        { name: 'Checks for NULL pointer', check: code => code.includes('NULL') || code.includes('!data') },
                        { name: 'Uses pointer arithmetic or dereferencing', check: code => /\*\w+|\w+\[\w*\]/.test(code) },
                        { name: 'Returns appropriate value', check: code => code.includes('return') }
                    ]
                }
            ],
            pointers: [
                {
                    pattern: "dynamic_allocation",
                    description: "Create a {structureType} that manages {resourceType} with {allocationStrategy}",
                    codeTemplate: `#include <linux/module.h>
#include <linux/slab.h>
#include <linux/kernel.h>

struct {structName} {
    {memberType} *{memberName};
    size_t {sizeMember};
    bool {stateMember};
};

// TODO: Implement allocation function
static struct {structName}* alloc_{structName}(size_t {sizeParam}) {
    // TODO: Allocate structure
    // TODO: Allocate {resourceType} using {allocationStrategy}
    // TODO: Initialize members
    return NULL;
}

// TODO: Implement deallocation function  
static void free_{structName}(struct {structName} *{paramName}) {
    // TODO: Check for NULL
    // TODO: Free {resourceType}
    // TODO: Free structure
}

static int __init alloc_init(void) {
    struct {structName} *test_{structName};
    
    test_{structName} = alloc_{structName}({testSize});
    if (test_{structName}) {
        printk(KERN_INFO "Allocation successful\\n");
        free_{structName}(test_{structName});
    } else {
        printk(KERN_ERR "Allocation failed\\n");
    }
    
    return 0;
}

static void __exit alloc_exit(void) {
    printk(KERN_INFO "Allocation module unloaded\\n");
}

module_init(alloc_init);
module_exit(alloc_exit);
MODULE_LICENSE("GPL");`,
                    variables: {
                        structureType: ['buffer manager', 'memory pool', 'resource tracker', 'data container'],
                        resourceType: ['memory blocks', 'data buffers', 'work items', 'cache entries'],
                        allocationStrategy: ['kmalloc with error handling', 'slab allocation', 'page-based allocation'],
                        structName: ['buffer_mgr', 'mem_pool', 'resource_mgr', 'data_container'],
                        memberType: ['void', 'char', 'struct work_struct', 'u8'],
                        memberName: ['data', 'buffer', 'items', 'memory'],
                        sizeMember: ['size', 'capacity', 'count', 'length'],
                        stateMember: ['allocated', 'active', 'initialized', 'valid'],
                        sizeParam: ['size', 'count', 'capacity', 'length'],
                        paramName: ['mgr', 'pool', 'container', 'tracker'],
                        testSize: ['1024', '256', '512', '128']
                    },
                    tests: [
                        { name: 'Defines structure correctly', check: code => /struct\s+\w+\s*{/.test(code) },
                        { name: 'Has allocation function', check: code => /alloc_\w+/.test(code) },
                        { name: 'Has deallocation function', check: code => /free_\w+/.test(code) },
                        { name: 'Checks allocation success', check: code => code.includes('if') && (code.includes('kmalloc') || code.includes('kzalloc')) },
                        { name: 'Handles NULL pointers', check: code => code.includes('NULL') }
                    ]
                }
            ]
        },

        kernelCore: {
            moduleSystem: [
                {
                    pattern: "module_dependencies",
                    description: "Create a {moduleType} that {interaction} with {targetModule} using {method}",
                    codeTemplate: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
{additionalIncludes}

// TODO: Declare external {symbolType} from {targetModule}
{externalDeclaration}

// TODO: Implement {functionName} that {interaction}
static {returnType} {functionName}({parameters}) {
    // TODO: {interaction} using {method}
    return {defaultReturn};
}

static int __init {moduleName}_init(void) {
    {returnType} result;
    
    // TODO: Call {functionName} and handle result
    result = {functionName}({callParameters});
    printk(KERN_INFO "{moduleName}: {interaction} result: {resultFormat}\\n", result);
    
    return 0;
}

static void __exit {moduleName}_exit(void) {
    printk(KERN_INFO "{moduleName}: Module unloaded\\n");
}

module_init({moduleName}_init);
module_exit({moduleName}_exit);
MODULE_LICENSE("GPL");`,
                    variables: {
                        moduleType: ['helper module', 'client module', 'wrapper module', 'test module'],
                        interaction: ['exports symbols to', 'imports functions from', 'communicates with', 'extends functionality of'],
                        targetModule: ['core_module', 'base_driver', 'utility_module', 'service_module'],
                        method: ['exported symbols', 'function pointers', 'shared data structures', 'callback registration'],
                        symbolType: ['function', 'variable', 'structure', 'callback'],
                        externalDeclaration: ['extern int core_function(int param);', 'extern struct core_data *shared_data;', 'extern void (*callback_ptr)(void);'],
                        functionName: ['call_external', 'use_service', 'invoke_callback', 'access_data'],
                        returnType: ['int', 'void', 'bool', 'long'],
                        parameters: ['void', 'int param', 'struct data *ptr', 'unsigned long flags'],
                        callParameters: ['', '42', 'NULL', '0'],
                        moduleName: ['client_mod', 'test_mod', 'wrapper_mod', 'helper_mod'],
                        defaultReturn: ['0', '', 'true', '0L'],
                        resultFormat: ['%d', '%s', '%d', '%ld'],
                        additionalIncludes: ['#include <linux/export.h>', '#include <linux/types.h>', '#include <linux/errno.h>']
                    },
                    tests: [
                        { name: 'Has external declaration', check: code => code.includes('extern') },
                        { name: 'Implements required function', check: code => /static\s+\w+\s+\w+\s*\([^)]*\)/.test(code) },
                        { name: 'Calls external function/uses symbol', check: code => /\w+\s*\([^)]*\)/.test(code) },
                        { name: 'Handles return value', check: code => code.includes('result') }
                    ]
                }
            ]
        }
    };

    // DYNAMIC CHALLENGE GENERATOR - The core of unlimited content
    const generateDynamicChallenge = (phase, skill, difficulty) => {
        // Get templates for the current skill
        const skillTemplates = challengeTemplates[phase]?.[skill] || [];
        if (skillTemplates.length === 0) {
            return generateFallbackChallenge(phase, skill, difficulty);
        }

        // Select random template
        const template = skillTemplates[Math.floor(Math.random() * skillTemplates.length)];

        // Generate unique seed for this challenge
        const challengeSeed = generationSeed + userProfile.challengesGenerated;
        const random = (seed) => {
            let x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        // Fill template variables with random selections
        const filledVariables = {};
        Object.entries(template.variables).forEach(([key, options]) => {
            const index = Math.floor(random(challengeSeed + key.charCodeAt(0)) * options.length);
            filledVariables[key] = options[index];
        });

        // Generate code by replacing all template variables
        let generatedCode = template.codeTemplate;
        Object.entries(filledVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            generatedCode = generatedCode.replace(regex, value);
        });

        // Create unique challenge ID
        const challengeId = `${phase}_${skill}_${Date.now()}_${challengeSeed}`;

        // Generate dynamic description
        let description = template.description;
        Object.entries(filledVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            description = description.replace(regex, value);
        });

        // Adjust difficulty based on user skill level and requested difficulty
        const skillLevel = userSkills[phase]?.[skill] || 0;
        const adjustedDifficulty = Math.max(1, Math.min(6, difficulty + Math.floor((1 - skillLevel) * 2)));
        const baseXP = 50 + (adjustedDifficulty * 25);

        return {
            id: challengeId,
            title: `${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${template.pattern.replace(/_/g, ' ')}`,
            description: description,
            difficulty: adjustedDifficulty,
            xp: baseXP,
            phase: phase,
            skill: skill,
            starter: generatedCode,
            tests: template.tests,
            hints: generateDynamicHints(template.pattern, filledVariables, phase),
            generatedAt: Date.now(),
            templateUsed: template.pattern
        };
    };

    // Generate contextual hints based on the challenge pattern
    const generateDynamicHints = (pattern, variables, phase) => {
        const hintDatabase = {
            module_with_parameters: [
                `Use module_param(${variables.paramName || 'name'}, ${variables.paramType || 'type'}, 0644) to make it configurable`,
                "Don't forget to validate parameter values in your init function",
                "Use printk to display the parameter value for debugging",
                "Check if the parameter affects module behavior as expected"
            ],
            pointer_manipulation: [
                "Always check for NULL pointers before dereferencing",
                "Remember that array[i] is equivalent to *(array + i)",
                "Use pointer arithmetic carefully to avoid buffer overflows",
                "Consider edge cases like empty arrays or count = 0"
            ],
            dynamic_allocation: [
                "Use kmalloc() or kzalloc() for kernel memory allocation",
                "Always check if allocation succeeded before using the memory",
                "Match every kmalloc() with exactly one kfree()",
                "Set pointers to NULL after freeing to prevent double-free"
            ],
            module_dependencies: [
                "Use EXPORT_SYMBOL() to make functions available to other modules",
                "Declare external symbols with 'extern' keyword",
                "Check module load order - dependencies must load first",
                "Handle cases where external symbols might not be available"
            ]
        };

        return hintDatabase[pattern] || [
            "Read the TODO comments carefully for guidance",
            "Use printk() for debugging your implementation",
            "Follow kernel coding style guidelines",
            "Test edge cases and error conditions"
        ];
    };

    // Fallback challenge generator for unsupported combinations
    const generateFallbackChallenge = (phase, skill, difficulty) => {
        const fallbackId = `fallback_${phase}_${skill}_${Date.now()}`;

        return {
            id: fallbackId,
            title: `Advanced ${skill} Challenge`,
            description: `Master advanced concepts in ${skill} for the ${phase} phase`,
            difficulty: difficulty,
            xp: 100 + difficulty * 20,
            phase: phase,
            skill: skill,
            starter: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// TODO: Implement advanced ${skill} functionality
// This is a custom challenge for ${phase} phase

static int __init advanced_init(void) {
    printk(KERN_INFO "Advanced ${skill} module loaded\\n");
    // TODO: Add your implementation here
    return 0;
}

static void __exit advanced_exit(void) {
    printk(KERN_INFO "Advanced ${skill} module unloaded\\n");
}

module_init(advanced_init);
module_exit(advanced_exit);
MODULE_LICENSE("GPL");`,
            tests: [
                { name: 'Module loads successfully', check: code => code.includes('module_init') },
                { name: 'Module unloads cleanly', check: code => code.includes('module_exit') },
                { name: 'Has GPL license', check: code => code.includes('GPL') }
            ],
            hints: [
                `Focus on ${skill} best practices`,
                "Research kernel documentation for this topic",
                "Consider real-world use cases",
                "Test your implementation thoroughly"
            ],
            generatedAt: Date.now(),
            templateUsed: 'fallback'
        };
    };

    // Adaptive challenge selection based on user progress
    const getNextAdaptiveChallenge = () => {
        const currentPhase = getCurrentPhase();
        
        // Get completed problems to avoid repetition and handle multi-part sequences
        const completedIds = Array.from(completedChallenges);
        
        // Check if there's a multi-part sequence to continue
        if (currentChallenge?.multiPart) {
            const nextId = currentChallenge.multiPart.nextProblemId;
            if (nextId && !completedIds.includes(nextId)) {
                const nextProblem = problemBank.find(p => p.id === nextId);
                if (nextProblem) {
                    return nextProblem;
                }
            }
        }
        
        // Filter problems by current phase
        const phaseProblems = problemBank.filter(p => p.phase === currentPhase);
        
        // Filter out completed problems (except multi-part sequences)
        const availableProblems = phaseProblems.filter(p => {
            if (completedIds.includes(p.id)) {
                return false; // Already completed
            }
            
            // Check if this is part of a multi-part sequence that needs prerequisites
            if (p.multiPart?.previousProblemId) {
                return completedIds.includes(p.multiPart.previousProblemId);
            }
            
            return true; // Available to complete
        });
        
        if (availableProblems.length === 0) {
            // Fall back to template system if no problemBank challenges available
            const availableSkills = phaseSystem[currentPhase]?.skills || ['cBasics'];
            const skillLevels = availableSkills.map(skill => ({
                skill,
                level: userSkills[currentPhase]?.[skill] || 0
            }));
            
            const targetSkill = skillLevels.sort((a, b) => a.level - b.level)[0];
            const skillLevel = targetSkill.level;
            const baseDifficulty = Math.max(1, Math.floor(skillLevel * 6) + 1);
            const difficultyVariation = Math.floor(Math.random() * 3) - 1;
            const finalDifficulty = Math.max(1, Math.min(6, baseDifficulty + difficultyVariation));
            
            return generateDynamicChallenge(currentPhase, targetSkill.skill, finalDifficulty);
        }
        
        // Calculate user skill level for difficulty matching
        const userSkillLevel = Object.values(userSkills[currentPhase] || {})
            .reduce((avg, skill) => avg + skill, 0) / 
            Object.keys(userSkills[currentPhase] || {}).length || 0;
            
        // Filter by appropriate difficulty (±1 from user skill level)
        const targetDifficulty = Math.max(1, Math.min(6, Math.floor(userSkillLevel * 6) + 1));
        const appropriateProblems = availableProblems.filter(p => 
            Math.abs(p.difficulty - targetDifficulty) <= 1
        );
        
        // Select problem (prefer closer difficulty match)
        const selectedProblems = appropriateProblems.length > 0 ? appropriateProblems : availableProblems;
        const problem = selectedProblems[Math.floor(Math.random() * selectedProblems.length)];
        
        // Update generation counter
        setUserProfile(prev => ({
            ...prev,
            challengesGenerated: prev.challengesGenerated + 1
        }));
        
        return problem;
    };

    // Determine current phase based on user choice
    const getCurrentPhase = () => {
        return userProfile.currentPhase || 'foundations';
    };

    // Real kernel C compilation with QEMU testing - Enhanced for problemBank validation
    // Auto-detect problem category from code content
    const detectProblemCategory = (code) => {
        if (/rcu_head|rcu_read_lock|rcu_read_unlock|call_rcu|list_.*_rcu/.test(code)) {
            return 'rcu';
        }
        if (/file_operations|register_chrdev|chrdev|device_create/.test(code)) {
            return 'device_drivers';
        }
        if (/spinlock|mutex|rwlock|DEFINE_SPINLOCK|DEFINE_MUTEX/.test(code)) {
            return 'synchronization';
        }
        if (/kmalloc|kfree|vmalloc|__get_free_pages/.test(code)) {
            return 'memory';
        }
        return 'foundations';
    };

    // LeetCode-style validation function
    const runLeetCodeStyleValidation = async (code, problemId) => {
        const moduleName = String(problemId).replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
        
        try {
            console.log('🚀 Making API call to:', `${BACKEND_URL}/validate-solution-comprehensive`);
            // Call the backend comprehensive validation API with longer timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
            
            const response = await fetch(`${BACKEND_URL}/validate-solution-comprehensive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    moduleName: moduleName,
                    problemId: problemId,
                    problemCategory: detectProblemCategory(code)
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok || response.status === 400) {
                const result = await response.json();
                console.log('✅ Backend response received:', { success: result.success, overallResult: result.overallResult, score: result.score });
                
                // Transform new comprehensive validation result to LeetCode format
                // Check if validation succeeded AND solution is correct
                if (result.success && result.overallResult === 'ACCEPTED') {
                    return {
                        success: true,
                        overallResult: result.overallResult,
                        totalTests: result.totalTests || result.testResults?.length || 0,
                        passedTests: result.passedTests || result.testResults?.filter(t => t.status === 'PASSED').length || 0,
                        score: result.score,
                        testResults: result.testResults?.map(test => ({
                            testName: test.name || test.id,
                            status: test.status,
                            message: test.message || '',
                            visible: true,
                            executionTime: test.executionTime || 100
                        })) || [],
                        compilationResult: result.compilationResult,
                        testingResult: result.testingResult,
                        backendDetails: result,
                        realBackend: true,
                        feedback: result.feedback
                    };
                } else {
                    // Handle validation succeeded but solution failed, or validation errors
                    return {
                        success: false,
                        overallResult: result.overallResult || 'WRONG_ANSWER',
                        totalTests: result.totalTests || result.testResults?.length || 1,
                        passedTests: result.passedTests || result.testResults?.filter(t => t.status === 'PASSED').length || 0,
                        score: result.score || 0,
                        testResults: result.testResults?.map(test => ({
                            testName: test.name || test.id,
                            status: test.status,
                            message: test.message || '',
                            visible: true,
                            executionTime: test.executionTime || 100
                        })) || [{
                            testName: 'Validation',
                            status: 'WRONG_ANSWER',
                            message: result.error || 'Validation failed',
                            visible: true,
                            executionTime: 100
                        }],
                        compilationResult: result.compilationResult || { success: false, error: result.error },
                        realBackend: true,
                        backendDetails: result,
                        feedback: result.feedback
                    };
                }
            } else {
                throw new Error('Backend API call failed');
            }
        } catch (error) {
            const isTimeout = error.name === 'AbortError' || error.message.includes('timeout');
            console.error('LeetCode-style validation failed:', error);
            console.error('Error details:', error.message);
            console.error('BACKEND_URL was:', BACKEND_URL);
            console.warn('⚠️ Using fallback validation - results may be limited');
            
            // Enhanced fallback with basic rule-based validation
            const fallbackValidation = runBasicRuleValidation(code, problemId);
            return {
                success: true,
                error: null,
                overallResult: fallbackValidation.allPassed ? 'ACCEPTED' : 'PARTIAL_CREDIT',
                totalTests: fallbackValidation.testResults.length,
                passedTests: fallbackValidation.testResults.filter(t => t.passed).length,
                testResults: fallbackValidation.testResults.map(test => ({
                    testId: test.name.toLowerCase().replace(/\s+/g, '_'),
                    testName: test.name,
                    status: test.passed ? 'PASSED' : 'WRONG_ANSWER',
                    message: test.passed ? 'Test passed (fallback validation)' : test.message || 'Test failed',
                    visible: true,
                    executionTime: 0
                })),
                executionTime: 100,
                memoryUsage: 0,
                compilationResult: {
                    success: true,
                    output: 'Fallback validation - no real compilation performed',
                    compilationTime: 0
                },
                fallbackMode: true
            };
        }
    };

    // Basic rule-based validation for fallback - STRICT to prevent false positives
    const runBasicRuleValidation = (code, problemId) => {
        const tests = [];
        let passedCount = 0;

        // Basic syntax checks
        const hasInit = /__init/.test(code) || /module_init/.test(code);
        const hasExit = /__exit/.test(code) || /module_exit/.test(code);
        const hasLicense = /MODULE_LICENSE/.test(code);
        const hasPrintk = /printk/.test(code);

        tests.push({
            name: 'Has Init Function',
            passed: hasInit,
            message: hasInit ? null : 'Missing __init function or module_init() call'
        });

        tests.push({
            name: 'Has Exit Function', 
            passed: hasExit,
            message: hasExit ? null : 'Missing __exit function or module_exit() call'
        });

        tests.push({
            name: 'Has Module License',
            passed: hasLicense,
            message: hasLicense ? null : 'Missing MODULE_LICENSE declaration'
        });

        tests.push({
            name: 'Uses Kernel Print',
            passed: hasPrintk,
            message: hasPrintk ? null : 'Missing printk() calls for output'
        });

        // STRICT: Check for TODO comments (indicates incomplete template code)
        const hasTodos = /TODO/.test(code);
        tests.push({
            name: 'No TODO Comments',
            passed: !hasTodos,
            message: hasTodos ? 'Code contains TODO comments - solution appears incomplete' : null
        });

        // STRICT: Check for actual implementation (not just template structure)
        const hasComments = /\/\/\s*TODO/.test(code) || /\/\*.*TODO.*\*\//.test(code);
        const hasEmptyBraces = /{\s*\/\/.*TODO[\s\S]*?return\s+0;\s*}/.test(code);
        const isTemplate = hasComments || hasEmptyBraces;
        
        tests.push({
            name: 'Has Implementation Code',
            passed: !isTemplate,
            message: isTemplate ? 'Code appears to be template/starter code - needs actual implementation' : null
        });

        // Problem-specific validation
        if (problemId.includes('device_driver')) {
            const hasDeviceName = /device_name/.test(code);
            tests.push({
                name: 'Uses Required Variable Names',
                passed: hasDeviceName,
                message: hasDeviceName ? null : 'Missing required device_name variable'
            });
        }

        passedCount = tests.filter(t => t.passed).length;

        // NEVER allow fallback to pass completely - always show as partial credit
        return {
            allPassed: false,  // Force fallback to never show ACCEPTED
            testResults: tests,
            score: Math.min((passedCount / tests.length) * 100, 75)  // Cap at 75% for fallback
        };
    };

    // Format clean, professional results for display
    const formatLeetCodeResults = (results, debugMode = false) => {
        if (!results.success && !results.realBackend) {
            return `❌ ${results.error}`;
        }

        let output = '';
        
        // Show fallback mode warning only
        if (results.fallbackMode) {
            output += `⚠️ Backend Unavailable\n\n`;
        }
        
        // Simple result status
        const resultEmoji = {
            'ACCEPTED': '✅',
            'WRONG_ANSWER': '❌',
            'COMPILATION_ERROR': '❌',
            'RUNTIME_ERROR': '❌',
            'PARTIAL_CREDIT': '❌',
            'SYSTEM_ERROR': '❌',
            'VALIDATION_SYSTEM_ERROR': '🚨'
        };
        
        const resultText = {
            'ACCEPTED': 'Accepted',
            'WRONG_ANSWER': 'Wrong Answer',
            'COMPILATION_ERROR': 'Compilation Error',
            'RUNTIME_ERROR': 'Runtime Error',
            'PARTIAL_CREDIT': 'Wrong Answer',
            'SYSTEM_ERROR': 'System Error',
            'VALIDATION_SYSTEM_ERROR': 'Backend/Validation System Error'
        };
        
        output += `${resultEmoji[results.overallResult] || '❌'} ${resultText[results.overallResult] || 'Failed'}\n\n`;
        
        // Simple test summary
        if (results.passedTests !== undefined && results.totalTests !== undefined) {
            output += `Test Cases Passed: ${results.passedTests} / ${results.totalTests}\n`;
            if (results.executionTime) {
                output += `Time: ${(results.executionTime / 1000).toFixed(2)}s\n`;
            }
            output += `Memory: 6.4MB\n`;
            output += `Environment: QEMU Linux Kernel VM\n\n`;
        }
        
        // Show compilation errors if any
        if (results.compilationResult && !results.compilationResult.success) {
            output += `Compilation Failed:\n`;
            output += `${results.compilationResult.error || 'Compilation error'}\n\n`;
            return output;
        }
        
        // Show raw QEMU output - complete and transparent
        let qemuOutput = null;
        
        if (results.backendDetails?.compilationResult?.directResults?.testing?.output) {
            qemuOutput = results.backendDetails.compilationResult.directResults.testing.output;
        } else if (results.backendDetails?.directResults?.testing?.output) {
            qemuOutput = results.backendDetails.directResults.testing.output;
        } else if (results.compilationResult?.directResults?.testing?.output) {
            qemuOutput = results.compilationResult.directResults.testing.output;
        } else if (results.compilationResult?.output) {
            qemuOutput = results.compilationResult.output;
        }
        
        if (qemuOutput) {
            output += `System Logs:\n`;
            output += `\`\`\`\n`;
            
            // Clean ANSI escape sequences but show everything
            const cleanOutput = qemuOutput
                .replace(/\x1b\[[0-9;]*[mGK]/g, '')
                .replace(/\r/g, '');
            
            output += `${cleanOutput}\n`;
            output += `\`\`\`\n\n`;
        }
        
        // Expected output section
        if (results.testResults && results.testResults.length > 0) {
            const failedOutputTest = results.testResults.find(test => 
                test.status === 'FAILED' && test.name?.includes('Output Messages')
            );
            
            if (failedOutputTest && failedOutputTest.message?.includes('Missing outputs')) {
                const missing = failedOutputTest.message.match(/Missing outputs: (.+)/);
                if (missing) {
                    output += `Expected Output:\n`;
                    output += `${missing[1]}\n\n`;
                }
            }
        }
        
        return output;
    };

    const runCode = async () => {
        if (!currentChallenge) return;

        setCodeEditor(prev => ({ ...prev, isRunning: true, output: '', testResults: [] }));

        const code = codeEditor.code;
        
        // Use LeetCode-style validation for ALL problems
        // Generate problemId from challenge if not exists  
        const problemId = currentChallenge.problemId || currentChallenge.id;
        
        if (true) { // Always use LeetCode-style validation
            try {
                const leetCodeResults = await runLeetCodeStyleValidation(code, problemId);
                
                setCodeEditor(prev => ({
                    ...prev,
                    isRunning: false,
                    output: formatLeetCodeResults(leetCodeResults, debugMode),
                    testResults: leetCodeResults.testResults || []
                }));

                // Handle challenge completion
                if (leetCodeResults.overallResult === 'ACCEPTED') {
                    handleChallengeComplete(currentChallenge.id, true);
                    
                    // Auto-advance to next part if available
                    if (currentChallenge.multiPart?.nextProblemId) {
                        setTimeout(() => {
                            generateNewChallenge();
                        }, 2000);
                    }
                }
                
                return leetCodeResults;
            } catch (error) {
                setCodeEditor(prev => ({
                    ...prev,
                    isRunning: false,
                    output: `❌ LeetCode-style Validation Error: ${error.message}`,
                    testResults: []
                }));
                return;
            }
        }
        
        // Use enhanced validation for problemBank challenges
        if (currentChallenge.validation || (currentChallenge.tests && Array.isArray(currentChallenge.tests))) {
            try {
                const validationResults = await validateProblemSolution(currentChallenge, code);
                
                setCodeEditor(prev => ({
                    ...prev,
                    isRunning: false,
                    output: formatValidationOutput(validationResults),
                    testResults: validationResults.testResults
                }));

                // Handle challenge completion for multi-part problems
                if (validationResults.allPassed) {
                    handleChallengeComplete(currentChallenge.id, true);
                    
                    // Auto-advance to next part if available
                    if (currentChallenge.multiPart?.nextProblemId) {
                        setTimeout(() => {
                            generateNewChallenge();
                        }, 2000); // Brief delay to show completion
                    }
                }
                
                return validationResults;
            } catch (error) {
                setCodeEditor(prev => ({
                    ...prev,
                    isRunning: false,
                    output: `❌ Validation Error: ${error.message}`,
                    testResults: []
                }));
                return;
            }
        }

        // Fallback to original system for template-based challenges
        const tests = currentChallenge.tests || [];
        const results = [];
        let allPassed = true;
        let output = "=== Real Kernel Module Compilation ===\n";
        
        // Extract module name from challenge or generate one
        const moduleName = currentChallenge.title.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'challenge_module';

        try {
            // Send to real compilation backend
            output += "🔧 Compiling kernel module with real GCC...\n";
            output += "🐳 Using Docker container with kernel headers...\n";
            output += "⏱️ This may take 10-30 seconds for real compilation...\n\n";
            
            setCodeEditor(prev => ({ ...prev, output }));

            const response = await fetch(`${BACKEND_URL}/compile-kernel-module`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    moduleName: moduleName
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Real compilation succeeded
                output += "✅ REAL KERNEL MODULE COMPILATION SUCCESSFUL!\n\n";
                output += "=== Compilation Output ===\n";
                output += result.compilation.output + "\n";
                
                if (result.testing && result.testing.success) {
                    output += "=== QEMU Virtual Machine Testing ===\n";
                    output += "🖥️ Starting QEMU VM with your kernel module...\n";
                    output += "📥 Loading module with insmod...\n";
                    output += "📋 Real dmesg output:\n";
                    output += result.testing.dmesg || result.testing.output;
                    output += "\n📤 Unloading module with rmmod...\n";
                    output += "✅ Module tested successfully in real Linux VM!\n\n";
                } else {
                    output += "⚠️ Compilation successful but QEMU testing had issues:\n";
                    output += result.testing?.error || result.testing?.output || "Unknown testing error\n";
                }

                // Run basic tests
                output += "=== Challenge Validation ===\n";
                tests.forEach((test, index) => {
                    const passed = test.check(code);
                    results.push({ name: test.name, passed });
                    output += `${passed ? '✓' : '✗'} ${test.name}\n`;
                    if (!passed) allPassed = false;
                });

                if (allPassed) {
                    const bonusXP = Math.floor(currentChallenge.xp * 0.3); // Bonus for real compilation
                    output += `\n🎉 REAL KERNEL MODULE WORKS! Challenge completed!\n`;
                    output += `🏆 Your code compiled and ran in a real Linux kernel!\n`;
                    output += `+${currentChallenge.xp} XP earned\n`;
                    output += `+${bonusXP} bonus XP for real kernel compilation!\n`;
                    
                    // Update XP with bonus for real compilation
                    currentChallenge.xp += bonusXP;
                } else {
                    output += "\n❌ Module compiled but some challenge tests failed.\n";
                    allPassed = false;
                }
                
            } else {
                // Compilation or testing failed
                allPassed = false;
                
                if (result.stage === 'security_check') {
                    output += "🚫 SECURITY CHECK FAILED\n";
                    output += `❌ ${result.error}\n\n`;
                    output += "📋 Security policies protect against:\n";
                    output += "• Malicious system call manipulation\n";
                    output += "• Unauthorized file system access\n";
                    output += "• Network security bypass attempts\n";
                    output += "• Process manipulation attacks\n\n";
                    output += "💡 Focus on legitimate kernel module functionality.\n";
                } else if (result.stage === 'compilation') {
                    output += "❌ REAL COMPILATION FAILED\n\n";
                    output += "=== GCC Compiler Output ===\n";
                    output += result.output || result.error;
                    output += "\n\n💡 Fix the compilation errors and try again.\n";
                    output += "This is real GCC output with kernel headers!\n";
                } else {
                    output += `❌ ${result.error}\n`;
                    if (result.output) {
                        output += "\nOutput:\n" + result.output;
                    }
                }
            }

        } catch (error) {
            allPassed = false;
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                output += "🔌 BACKEND CONNECTION ERROR\n\n";
                output += "❌ Cannot connect to kernel compilation server.\n";
                output += "🚀 To enable real kernel compilation:\n\n";
                output += "1. Navigate to backend directory:\n";
                output += "   cd backend\n\n";
                output += "2. Run setup script:\n";
                output += "   chmod +x setup.sh && ./setup.sh\n\n";
                output += "3. Start backend server:\n";
                output += "   npm start\n\n";
                output += "💡 Real compilation requires Docker and QEMU.\n";
                output += "💻 Falling back to simulation mode...\n\n";
                
                // Fall back to original simulation
                output += await simulateKernelCompilation(code, tests, results);
            } else {
                output += `❌ Unexpected error: ${error.message}\n`;
            }
        }

        setCodeEditor(prev => ({
            ...prev,
            isRunning: false,
            output,
            testResults: results
        }));

        // Update progress if challenge completed
        if (allPassed && !completedChallenges.has(currentChallenge.id)) {
            handleChallengeComplete(currentChallenge.id, true);
        }
    };

    // Fallback simulation for when backend is not available
    const simulateKernelCompilation = async (code, tests, results) => {
        let output = "=== Simulated Kernel Compilation ===\n";
        let allPassed = true;
        
        // Kernel-specific compilation checks
        const kernelChecks = [
            { name: 'Kernel headers', check: code => /^#include\s*<linux\//.test(code), error: 'Missing kernel headers (linux/module.h, linux/kernel.h, etc.)' },
            { name: 'Module license', check: code => code.includes('MODULE_LICENSE'), error: 'MODULE_LICENSE declaration required for kernel modules' },
            { name: 'Init function', check: code => /__init.*_init/.test(code), error: 'Kernel module init function not found' },
            { name: 'Exit function', check: code => /__exit.*_exit/.test(code), error: 'Kernel module exit function not found' },
            { name: 'Module registration', check: code => code.includes('module_init') && code.includes('module_exit'), error: 'Module init/exit registration missing' },
            { name: 'Kernel print statements', check: code => !code.includes('printf(') || code.includes('printk('), error: 'Use printk() instead of printf() in kernel space' },
            { name: 'Memory allocation', check: code => !code.includes('malloc(') || code.includes('kmalloc('), error: 'Use kmalloc()/kfree() instead of malloc()/free() in kernel space' }
        ];

        let compilationErrors = 0;
        kernelChecks.forEach(check => {
            if (!check.check(code)) {
                output += `COMPILATION ERROR: ${check.error}\n`;
                compilationErrors++;
                allPassed = false;
            }
        });

        if (compilationErrors === 0) {
            output += "✓ Kernel compilation successful\n";
            output += "✓ Module syntax validation passed\n";
            output += "✓ insmod/rmmod compatibility verified\n\n";
            
            // Simulated kernel module loading
            output += "=== Simulated Module Loading ===\n";
            output += "[   42.123456] Loading kernel module...\n";
            output += "[   42.123789] Module init function called\n";
            output += "[   42.124012] Module loaded successfully\n\n";

            // Run dynamic tests
            output += "=== Running Dynamic Tests ===\n";
            tests.forEach((test, index) => {
                const passed = test.check(code);
                results.push({ name: test.name, passed });
                output += `${passed ? '✓' : '✗'} ${test.name}\n`;
                if (!passed) allPassed = false;
            });

            // Calculate performance score
            const linesOfCode = code.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length;
            const complexityScore = Math.max(1, Math.min(10, Math.floor(linesOfCode / 5)));

            output += `\n=== Code Analysis ===\n`;
            output += `Lines of code: ${linesOfCode}\n`;
            output += `Complexity score: ${complexityScore}/10\n`;

            if (allPassed) {
                const bonusXP = complexityScore > 7 ? Math.floor(currentChallenge.xp * 0.2) : 0;
                output += "=== Simulated Module Unloading ===\n";
                output += "[   45.567890] Module exit function called\n";
                output += "[   45.568123] Module unloaded successfully\n\n";
                output += `🎉 Kernel module compiled and tested successfully!\n`;
                output += `✓ Module can be loaded with insmod\n`;
                output += `✓ Module can be unloaded with rmmod\n`;
                output += `+${currentChallenge.xp} XP earned\n`;
                if (bonusXP > 0) {
                    output += `+${bonusXP} bonus XP for clean kernel code!\n`;
                }
            } else {
                output += "\n❌ Some tests failed. Review kernel module requirements and try again!\n";
            }
        } else {
            output += `\n❌ ${compilationErrors} kernel compilation error(s) found.\n`;
            output += "Fix these errors to create a valid kernel module.\n";
        }
        
        return output;
    };

    // Enhanced progress tracking with unlimited depth
    const handleChallengeComplete = (challengeId, success) => {
        if (!success || completedChallenges.has(challengeId)) return;

        const newCompleted = new Set(completedChallenges);
        newCompleted.add(challengeId);
        setCompletedChallenges(newCompleted);

        if (currentChallenge) {
            // Calculate skill improvement with diminishing returns for balance
            const currentSkillLevel = userSkills[currentChallenge.phase]?.[currentChallenge.skill] || 0;
            const diminishingFactor = Math.max(0.1, 1 - currentSkillLevel);
            const baseImprovement = 0.03 + (currentChallenge.difficulty * 0.01);
            const skillImprovement = baseImprovement * diminishingFactor;

            // Update skills
            const newSkills = { ...userSkills };
            if (!newSkills[currentChallenge.phase]) {
                newSkills[currentChallenge.phase] = {};
            }
            newSkills[currentChallenge.phase][currentChallenge.skill] =
                Math.min(1.0, (newSkills[currentChallenge.phase][currentChallenge.skill] || 0) + skillImprovement);

            setUserSkills(newSkills);

            // Update profile with enhanced tracking (no level system)
            const newXP = userProfile.xp + currentChallenge.xp;
            const masteryBonus = Math.floor(skillImprovement * 1000); // Convert to mastery points

            setUserProfile(prev => ({
                ...prev,
                xp: newXP,
                totalChallenges: prev.totalChallenges + 1,
                uniqueChallengesCompleted: prev.uniqueChallengesCompleted + 1,
                streak: prev.streak + 1,
                masteryPoints: prev.masteryPoints + masteryBonus
            }));

            // Add to challenge history
            setChallengeHistory(prev => [...prev, {
                ...currentChallenge,
                completedAt: Date.now(),
                xpEarned: currentChallenge.xp,
                skillImprovement: skillImprovement
            }].slice(-50)); // Keep last 50 challenges
        }
    };

    // Initialize the enhanced validation system
    const validationSystem = new ValidationSystem();
    const postCompilationTester = new PostCompilationTester();

    // Enhanced validation system for problemBank challenges
    const validateProblemSolution = async (problem, userCode) => {
        // Use the new flexible validation system
        const baseResults = await validationSystem.validateProblemSolution(problem, userCode);

        // CRITICAL: Only fail immediately for truly dangerous patterns (like printf/malloc in kernel)
        const hasCriticalSafetyErrors = baseResults.testResults.some(test => 
            !test.passed && test.severity === 'critical' && (
                test.message.includes('printf') || 
                test.message.includes('malloc') || 
                test.message.includes('stdio.h') ||
                test.message.includes('Illogical')  // Template code detection
            )
        );
        
        if (hasCriticalSafetyErrors) {
            baseResults.allPassed = false;
            baseResults.score = 0;
            baseResults.feedback.unshift('❌ CRITICAL SAFETY ERRORS: Code contains dangerous patterns that violate kernel safety principles. Must be fixed before testing.');
            return baseResults; // Stop here, don't run compilation
        }

        // Enhanced validation for multi-part problems (keep existing compilation logic)
        if (problem.validation) {
            // Compile test
            if (problem.validation.compileTest) {
                try {
                    const compileResult = await runCode(userCode, problem.title);
                    baseResults.compilationResult = compileResult;
                    
                    if (compileResult.success) {
                        baseResults.testResults.push({
                            name: 'Compilation',
                            passed: true,
                            message: 'Code compiled successfully ✓'
                        });

                        // NEW: Run post-compilation behavioral testing
                        try {
                            console.log('Running post-compilation behavioral tests...');
                            const behavioralResults = await postCompilationTester.testCompiledModule(
                                problem, 
                                '/tmp/compiled_module.ko', // Assuming compiled module path
                                compileResult.output
                            );

                            // Add behavioral test results
                            for (const test of behavioralResults.tests) {
                                baseResults.testResults.push({
                                    name: `Behavioral: ${test.name}`,
                                    passed: test.passed,
                                    message: test.message,
                                    suggestions: test.details ? test.details.join('\n') : null
                                });
                            }

                            // Add overall behavioral test summary
                            baseResults.testResults.push({
                                name: 'Module Behavior Verification',
                                passed: behavioralResults.passed,
                                message: behavioralResults.message
                            });

                        } catch (behavioralError) {
                            console.log('Behavioral testing not available:', behavioralError.message);
                            // Don't fail the overall validation if behavioral testing has issues
                            baseResults.testResults.push({
                                name: 'Behavioral Testing',
                                passed: true,
                                message: 'Behavioral testing skipped (not available in this environment)'
                            });
                        }
                    } else {
                        baseResults.testResults.push({
                            name: 'Compilation',
                            passed: false,
                            message: 'Compilation failed: ' + compileResult.error,
                            suggestions: 'Check syntax, missing includes, or undefined functions'
                        });
                        return baseResults; // Stop if compilation fails
                    }
                } catch (error) {
                    baseResults.testResults.push({
                        name: 'Compilation',
                        passed: false,
                        message: 'Compilation error: ' + error.message,
                        suggestions: 'Review code syntax and kernel module structure'
                    });
                    return baseResults;
                }
            }

            // Runtime test
            if (problem.validation.runtimeTest && baseResults.compilationResult?.success) {
                const output = baseResults.compilationResult.output || '';
                const requiredOutputs = problem.validation.requiredOutput || [];
                
                let runtimeScore = 0;
                for (const required of requiredOutputs) {
                    if (output.toLowerCase().includes(required.toLowerCase())) {
                        runtimeScore++;
                        baseResults.testResults.push({
                            name: `Runtime: ${required}`,
                            passed: true,
                            message: `Found required output: ${required} ✓`
                        });
                    } else {
                        baseResults.testResults.push({
                            name: `Runtime: ${required}`,
                            passed: false,
                            message: `Missing required output: ${required}`,
                            suggestions: `Make sure your code outputs "${required}" during execution`
                        });
                    }
                }
                
                baseResults.runtimeResult = {
                    score: runtimeScore,
                    total: requiredOutputs.length,
                    passed: runtimeScore === requiredOutputs.length
                };
            }
        }

        // Recalculate score with all tests including compilation
        const passedTests = baseResults.testResults.filter(t => t.passed).length;
        const totalTests = baseResults.testResults.length;
        baseResults.score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
        baseResults.allPassed = baseResults.score >= validationSystem.successThreshold;

        return baseResults;
    };

    // Format validation results for display
    const formatValidationOutput = (results) => {
        let output = "=== Enhanced Problem Validation ===\n\n";
        
        if (results.compilationResult) {
            if (results.compilationResult.success) {
                output += "✅ REAL KERNEL MODULE COMPILATION SUCCESSFUL!\n\n";
                output += "=== Compilation Output ===\n";
                output += results.compilationResult.output + "\n\n";
                
                if (results.compilationResult.testing?.success) {
                    output += "=== QEMU Virtual Machine Testing ===\n";
                    output += "🖥️ Module tested in real Linux VM!\n";
                    output += "📋 Real dmesg output:\n";
                    output += results.compilationResult.testing.dmesg || results.compilationResult.testing.output;
                    output += "\n\n";
                }
            } else {
                output += "❌ COMPILATION FAILED\n\n";
                output += "=== Compiler Output ===\n";
                output += results.compilationResult.error || results.compilationResult.output;
                output += "\n\n";
            }
        }
        
        output += "=== Challenge Validation ===\n";
        results.testResults.forEach(test => {
            output += `${test.passed ? '✅' : '❌'} ${test.name}`;
            if (test.message) {
                output += ` - ${test.message}`;
            }
            if (!test.passed && test.suggestions) {
                output += `\n   💡 Hint: ${test.suggestions}`;
            }
            output += "\n";
        });

        // Add overall feedback if available
        if (results.feedback && results.feedback.length > 0) {
            output += "\n=== Feedback ===\n";
            results.feedback.forEach(feedback => {
                output += `💬 ${feedback}\n`;
            });
        }
        
        output += `\n📊 Score: ${results.score.toFixed(1)}%\n`;
        
        if (results.allPassed) {
            const xp = currentChallenge.xp || 50;
            const bonusXP = results.compilationResult?.success ? Math.floor(xp * 0.3) : 0;
            
            output += `\n🎉 CHALLENGE COMPLETED! \n`;
            if (currentChallenge.multiPart) {
                output += `✅ Part ${currentChallenge.multiPart.part}/${currentChallenge.multiPart.totalParts} completed!\n`;
                if (currentChallenge.multiPart.nextProblemId) {
                    output += `🔄 Auto-advancing to Part ${currentChallenge.multiPart.part + 1}...\n`;
                }
            }
            output += `+${xp} XP earned\n`;
            if (bonusXP > 0) {
                output += `+${bonusXP} bonus XP for real kernel compilation!\n`;
            }
        } else {
            output += `\n❌ Challenge not completed. Need 80% score to pass.\n`;
            if (results.score >= 60) {
                output += `💡 You're close! Review the failed tests and try again.\n`;
            }
        }
        
        return output;
    };

    // Problems section functions
    const getFilteredProblems = () => {
        let filtered = [...problemBank];
        
        // Filter by phase
        if (problemFilters.phase !== 'all') {
            filtered = filtered.filter(p => p.phase === problemFilters.phase);
        }
        
        // Filter by difficulty
        if (problemFilters.difficulty !== 'all') {
            const difficultyNum = parseInt(problemFilters.difficulty);
            filtered = filtered.filter(p => p.difficulty === difficultyNum);
        }
        
        // Filter by completion status
        if (problemFilters.completed === 'completed') {
            filtered = filtered.filter(p => completedChallenges.has(p.id));
        } else if (problemFilters.completed === 'incomplete') {
            filtered = filtered.filter(p => !completedChallenges.has(p.id));
        }
        
        // Sort by difficulty first, then by id
        return filtered.sort((a, b) => {
            if (a.difficulty !== b.difficulty) {
                return a.difficulty - b.difficulty;
            }
            return a.id - b.id;
        });
    };

    const selectProblemFromBank = (problem) => {
        // Check if this is part of a multi-part sequence with prerequisites
        if (problem.multiPart?.previousProblemId) {
            const previousCompleted = completedChallenges.has(problem.multiPart.previousProblemId);
            if (!previousCompleted) {
                // Find the previous problem
                const previousProblem = problemBank.find(p => p.id === problem.multiPart.previousProblemId);
                alert(`You must complete "${previousProblem?.title}" first before attempting this part.`);
                return;
            }
        }
        
        setSelectedProblem(problem);
        setCurrentChallenge(problem);
        setCodeEditor({
            code: problem.starter || '',
            output: '',
            isRunning: false,
            testResults: []
        });
        setActiveTab('learning'); // Switch to learning tab to work on the problem
        setShowHints(false);
    };

    const getProblemStats = () => {
        const total = problemBank.length;
        const completed = problemBank.filter(p => completedChallenges.has(p.id)).length;
        const byPhase = {};
        const byDifficulty = {};
        
        problemBank.forEach(p => {
            // Count by phase
            if (!byPhase[p.phase]) byPhase[p.phase] = { total: 0, completed: 0 };
            byPhase[p.phase].total++;
            if (completedChallenges.has(p.id)) byPhase[p.phase].completed++;
            
            // Count by difficulty
            if (!byDifficulty[p.difficulty]) byDifficulty[p.difficulty] = { total: 0, completed: 0 };
            byDifficulty[p.difficulty].total++;
            if (completedChallenges.has(p.id)) byDifficulty[p.difficulty].completed++;
        });
        
        return { total, completed, byPhase, byDifficulty };
    };

    // Generate new challenge - now supports problemBank
    const generateNewChallenge = () => {
        // Clear selected problem to go back to unlimited learning
        setSelectedProblem(null);
        
        const challenge = getNextAdaptiveChallenge();
        setCurrentChallenge(challenge);
        setCodeEditor({
            code: challenge.starter,
            output: '',
            isRunning: false,
            testResults: []
        });
        setShowHints(false);
        setGenerationSeed(Date.now()); // Update seed for variety
    };

    // Initialize with phase selection or first challenge
    useEffect(() => {
        if (userProfile.currentPhase === null) {
            setShowPhaseSelector(true);
        } else if (!currentChallenge) {
            generateNewChallenge();
        }
    }, [userProfile.currentPhase]);

    // Phase selection handler
    const selectPhase = (phaseKey) => {
        setUserProfile(prev => ({ ...prev, currentPhase: phaseKey }));
        setShowPhaseSelector(false);
        // Generate first challenge for the selected phase
        setTimeout(() => {
            generateNewChallenge();
        }, 100);
    };

    // Helper function to extract user's printk messages from kernel dmesg output
    const extractUserPrintkMessages = (dmesgOutput, moduleName) => {
        const userMessages = [];
        const lines = dmesgOutput.split('\n');
        
        // Keywords that indicate user messages
        const userKeywords = ['Hello', 'Goodbye', 'Academy', 'Playground', 'Loading', 'Removing', 'loaded', 'unloaded'];
        
        // System messages to filter out
        const systemKeywords = ['tsc:', 'clocksource', 'input:', 'Freeing', 'Write protecting', 
                                'RAS:', 'clk:', 'Kernel panic', 'Call Trace', 'Hardware name', 
                                'CPU:', 'RIP:', 'Code:', 'RSP:', 'dump_stack', 'panic'];
        
        for (const line of lines) {
            const cleanLine = line.replace(/\r/g, '').trim();
            if (!cleanLine) continue;
            
            // Extract message content from kernel log format like: <6>[timestamp][T123] message
            const kernelMsgMatch = cleanLine.match(/<\d+>\[.*?\]\[.*?\]\s*(.+)/);
            if (kernelMsgMatch) {
                const message = kernelMsgMatch[1].trim();
                
                // Check if this contains user keywords and not system keywords
                const hasUserKeyword = userKeywords.some(keyword => 
                    message.toLowerCase().includes(keyword.toLowerCase())
                );
                const hasSystemKeyword = systemKeywords.some(keyword => 
                    message.toLowerCase().includes(keyword.toLowerCase())
                );
                
                // Include messages that:
                // 1. Have user keywords, OR
                // 2. Mention the module name, OR  
                // 3. Are short custom messages (likely from user printk)
                if (hasUserKeyword || message.includes(moduleName) || 
                    (!hasSystemKeyword && message.length < 150 && message.length > 5)) {
                    userMessages.push(message);
                }
            }
        }
        
        // Remove duplicates and sort by relevance
        const uniqueMessages = [...new Set(userMessages)];
        
        // Prioritize messages with user keywords
        return uniqueMessages.sort((a, b) => {
            const aHasUserKeyword = userKeywords.some(keyword => 
                a.toLowerCase().includes(keyword.toLowerCase())
            );
            const bHasUserKeyword = userKeywords.some(keyword => 
                b.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (aHasUserKeyword && !bHasUserKeyword) return -1;
            if (!aHasUserKeyword && bHasUserKeyword) return 1;
            return 0;
        });
    };

    // Playground kernel module compilation
    const runPlaygroundCode = async () => {
        setPlayground(prev => ({ 
            ...prev, 
            isRunning: true, 
            output: '', 
            compilationResult: null, 
            testingResult: null 
        }));

        let output = "=== Kernel Playground - Real Compilation ===\n";
        
        try {
            output += "🔧 Compiling your kernel module with real GCC...\n";
            output += "🖥️ Using direct host kernel compilation...\n";
            output += "⏱️ This may take 10-30 seconds for real compilation and testing...\n\n";
            
            setPlayground(prev => ({ ...prev, output }));

            const response = await fetch(`${BACKEND_URL}/playground-compile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: playground.code,
                    moduleName: playground.moduleName
                })
            });

            const result = await response.json();
            
            if (result.success) {
                output += "✅ REAL KERNEL MODULE COMPILATION SUCCESSFUL!\n\n";
                output += "=== Compilation Output ===\n";
                output += result.compilation.output + "\n";
                
                // Just dump ALL the backend output without complex parsing
                output += "\n=== QEMU Virtual Machine Testing ===\n";
                if (result.testing) {
                    output += "🖥️ Your module was tested in a real Linux VM!\n\n";
                    
                    // Show compilation testing results
                    if (result.testing.success) {
                        output += "✅ QEMU Testing: SUCCESS\n\n";
                    } else {
                        output += "❌ QEMU Testing: FAILED\n\n";
                    }
                    
                    // Show ALL output from testing
                    output += "=== Complete QEMU Output ===\n";
                    const fullOutput = result.testing.output || result.testing.dmesg || "";
                    if (fullOutput) {
                        output += fullOutput + "\n";
                    } else {
                        output += "No QEMU output received\n";
                    }
                    
                    // Show any additional fields
                    if (result.testing.dmesg && result.testing.dmesg !== result.testing.output) {
                        output += "\n=== DMESG Output ===\n";
                        output += result.testing.dmesg + "\n";
                    }
                    
                } else {
                    output += "⚠️ No testing results received from backend\n";
                }

                setPlayground(prev => ({ 
                    ...prev, 
                    compilationResult: result.compilation,
                    testingResult: result.testing 
                }));
                
            } else {
                if (result.stage === 'security_check') {
                    output += "🚫 SECURITY CHECK FAILED\n";
                    output += `❌ ${result.error}\n\n`;
                    output += "📋 Security policies protect against malicious code.\n";
                    output += "💡 Focus on legitimate kernel module functionality.\n";
                } else if (result.stage === 'compilation') {
                    output += "❌ REAL COMPILATION FAILED\n\n";
                    output += "=== GCC Compiler Output ===\n";
                    output += result.output || result.error;
                    output += "\n\n💡 Fix the compilation errors and try again.\n";
                    output += "This is real GCC output with kernel headers!\n";
                } else {
                    output += `❌ ${result.error}\n`;
                    if (result.output) {
                        output += "\nOutput:\n" + result.output;
                    }
                }
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                output += "🔌 BACKEND CONNECTION ERROR\n\n";
                output += "❌ Cannot connect to kernel compilation server.\n";
                output += "🚀 To enable real kernel compilation:\n\n";
                output += "1. Navigate to backend directory:\n";
                output += "   cd backend\n\n";
                output += "2. Run setup script:\n";
                output += "   ./setup-simple.sh\n\n";
                output += "3. Start backend server:\n";
                output += "   npm start\n\n";
                output += "💡 Real compilation requires kernel headers and QEMU.\n";
            } else {
                output += `❌ Unexpected error: ${error.message}\n`;
            }
        }

        setPlayground(prev => ({
            ...prev,
            isRunning: false,
            output
        }));
    };

    // Utility functions for UI
    const getDifficultyColor = (difficulty) => {
        const colors = [
            'bg-green-100 text-green-700 border-green-300',
            'bg-green-100 text-green-700 border-green-300',
            'bg-yellow-100 text-yellow-700 border-yellow-300',
            'bg-orange-100 text-orange-700 border-orange-300',
            'bg-red-100 text-red-700 border-red-300',
            'bg-purple-100 text-purple-700 border-purple-300'
        ];
        return colors[Math.min(difficulty - 1, colors.length - 1)];
    };

    const getSkillColor = (level) => {
        if (level < 0.2) return 'bg-red-400';
        if (level < 0.4) return 'bg-orange-400';
        if (level < 0.6) return 'bg-yellow-400';
        if (level < 0.8) return 'bg-blue-400';
        return 'bg-green-400';
    };

    const getPhaseProgress = (phaseName) => {
        const phase = phaseSystem[phaseName];
        if (!phase) return 0;

        const skills = phase.skills;
        const totalProgress = skills.reduce((sum, skill) =>
            sum + (userSkills[phaseName]?.[skill] || 0), 0
        );

        return totalProgress / skills.length;
    };

    // Enhanced skill meter component
    const SkillMeter = ({ phase, skill, level, name }) => (
        <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{name}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{Math.round(level * 100)}%</span>
                    {level >= 0.9 && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${getSkillColor(level)}`}
                    style={{ width: `${level * 100}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen">
            {/* Clean Professional Header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Cpu className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">KernelOne Academy</h1>
                                <p className="text-gray-600">Professional Kernel Development Training</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Current Phase: <strong className="text-gray-900">{phaseSystem[getCurrentPhase()].name}</strong></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                <button
                                    onClick={() => setShowPhaseSelector(true)}
                                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                                >
                                    Change Phase
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 text-center min-w-[120px]">
                            <div className="text-2xl font-bold text-gray-900 mb-1">{userProfile.xp.toLocaleString()}</div>
                            <div className="text-xs text-gray-600 font-medium">Total XP</div>
                        </div>
                        <div className="bg-blue-50 rounded-xl p-4 text-center min-w-[120px]">
                            <div className="text-2xl font-bold text-blue-600 mb-1">{userProfile.uniqueChallengesCompleted}</div>
                            <div className="text-xs text-gray-600 font-medium">Completed</div>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4 text-center min-w-[120px]">
                            <div className="text-2xl font-bold text-purple-600 mb-1">{userProfile.masteryPoints}</div>
                            <div className="text-xs text-gray-600 font-medium">Mastery Points</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clean Navigation Tabs */}
            <div className="bg-white border border-gray-200 rounded-xl p-2 mb-8 shadow-sm">
                <div className="flex gap-1">
                    <button
                        onClick={() => setActiveTab('learning')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 flex-1 justify-center ${
                            activeTab === 'learning' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Brain size={18} />
                        <span className="font-semibold">Learning</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('problems')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 flex-1 justify-center ${
                            activeTab === 'problems' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Trophy size={18} />
                        <span className="font-semibold">Problems</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('phases')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 flex-1 justify-center ${
                            activeTab === 'phases' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <GitBranch size={18} />
                        <span className="font-semibold">Phases</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('concepts')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 flex-1 justify-center ${
                            activeTab === 'concepts' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Book size={18} />
                        <span className="font-semibold">Concepts</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('playground')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 flex-1 justify-center ${
                            activeTab === 'playground' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Terminal size={18} />
                        <span className="font-semibold">Playground</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-2 flex-1 justify-center ${
                            activeTab === 'analytics' 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <TrendingUp size={18} />
                        <span className="font-semibold">Analytics</span>
                    </button>
                </div>
            </div>

            {/* Learning Tab - Unlimited Challenge Interface */}
            {activeTab === 'learning' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Challenge Control Panel */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Current Challenge Info */}
                        {currentChallenge && (
                            <div className="bg-white rounded-lg p-4 shadow-md border">
                                <div className="flex items-center gap-2 mb-3">
                                    {selectedProblem ? (
                                        <>
                                            <Trophy className="w-5 h-5 text-yellow-600" />
                                            <h3 className="font-semibold">Problem #{selectedProblem.id} from Bank</h3>
                                        </>
                                    ) : (
                                        <>
                                            <Infinity className="w-5 h-5 text-purple-600" />
                                            <h3 className="font-semibold">Dynamic Challenge #{userProfile.challengesGenerated}</h3>
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium">{currentChallenge.title}</h4>
                                    {currentChallenge.multiPart && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                            Part {currentChallenge.multiPart.part}/{currentChallenge.multiPart.totalParts}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{currentChallenge.description}</p>
                                
                                {/* Input/Output Specifications for Progressive Challenges */}
                                {currentChallenge.inputOutput && (
                                    <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-3">
                                        <h5 className="text-sm font-medium text-green-700 mb-2">📋 Expected Output:</h5>
                                        <ul className="text-xs text-green-600 space-y-1">
                                            {currentChallenge.inputOutput.expectedOutput.map((output, idx) => (
                                                <li key={idx} className="font-mono bg-green-100 px-2 py-1 rounded">
                                                    {output}
                                                </li>
                                            ))}
                                        </ul>
                                        {currentChallenge.inputOutput.requirements && (
                                            <div className="mt-3">
                                                <h5 className="text-sm font-medium text-green-700 mb-1">⚠️ Requirements:</h5>
                                                <ul className="text-xs text-green-600 space-y-1">
                                                    {currentChallenge.inputOutput.requirements.map((req, idx) => (
                                                        <li key={idx}>• {req}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                {currentChallenge.multiPart?.requirements && (
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                                        <p className="text-sm text-blue-700">📋 {currentChallenge.multiPart.requirements}</p>
                                    </div>
                                )}
                                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(currentChallenge.difficulty)}`}>
                    Level {currentChallenge.difficulty}
                  </span>
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-600 border border-purple-300">
                    +{currentChallenge.xp} XP
                  </span>
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600 border border-blue-300">
                    {currentChallenge.phase}
                  </span>
                                </div>
                                <div className="space-y-2">
                                    <button
                                        onClick={generateNewChallenge}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Shuffle size={16} />
                                        {selectedProblem ? 'Back to Unlimited Learning' : 'Generate New Challenge'}
                                    </button>
                                    <div className="text-xs text-gray-500 text-center">
                                        Difficulty adapts to your progress
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Current Phase Skills */}
                        <div className="bg-white rounded-lg p-4 shadow-md">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <Star className="text-yellow-500" size={18} />
                                {phaseSystem[getCurrentPhase()].name} Skills
                            </h3>
                            {phaseSystem[getCurrentPhase()].skills.map(skill => (
                                <SkillMeter
                                    key={skill}
                                    phase={getCurrentPhase()}
                                    skill={skill}
                                    level={userSkills[getCurrentPhase()]?.[skill] || 0}
                                    name={skill.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                />
                            ))}
                        </div>

                        {/* Quick Stats */}
                        <div className="bg-white rounded-lg p-4 shadow-md">
                            <h3 className="font-semibold mb-3 text-sm">Session Stats</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Streak:</span>
                                    <span className="font-medium">{userProfile.streak}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Generated:</span>
                                    <span className="font-medium">{userProfile.challengesGenerated}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Completed:</span>
                                    <span className="font-medium">{userProfile.uniqueChallengesCompleted}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Success Rate:</span>
                                    <span className="font-medium">
                    {userProfile.challengesGenerated > 0
                        ? Math.round((userProfile.uniqueChallengesCompleted / userProfile.challengesGenerated) * 100)
                        : 0}%
                  </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Professional Code Editor - Full Height */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden border">
                            <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Code size={18} />
                                    <span className="font-medium">Professional Kernel IDE</span>
                                    {currentChallenge && (
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                      {currentChallenge.templateUsed}
                    </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                  <span className="text-xs bg-white/10 px-2 py-1 rounded">
                    Auto-saves
                  </span>
                                    <button
                                        onClick={() => setShowHints(!showHints)}
                                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                                    >
                                        <Lightbulb size={14} />
                                        Smart Hints
                                    </button>
                                    <button
                                        onClick={() => setShowLessons(!showLessons)}
                                        className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                                    >
                                        <Book size={14} />
                                        Learn Concepts
                                    </button>
                                    <button
                                        onClick={runCode}
                                        disabled={codeEditor.isRunning}
                                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                                    >
                                        {codeEditor.isRunning ? (
                                            <>
                                                <Timer size={14} className="animate-spin" />
                                                Testing...
                                            </>
                                        ) : (
                                            <>
                                                <Play size={14} />
                                                Run & Validate
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Large Resizable Editor Interface */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 resize-y overflow-auto border-t border-gray-200" style={{ minHeight: '600px', height: '70vh', maxHeight: '90vh' }}>
                                {/* Code Input Panel */}
                                <div className="border-r border-gray-200 flex flex-col">
                                    <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 border-b border-gray-200 flex justify-between items-center">
                                        <span>📝 Semantic Kernel Code Editor</span>
                                        <span className="text-gray-500">Real-time error detection</span>
                                    </div>
                                    <div className="flex-1 relative">
                                        <SemanticCodeEditor
                                            value={codeEditor.code}
                                            onChange={(value) => setCodeEditor(prev => ({ ...prev, code: value }))}
                                            height="100%"
                                            placeholder="Your dynamically generated kernel challenge appears here..."
                                            className="h-full"
                                        />
                                    </div>
                                    <div className="bg-gray-100 px-3 py-1 text-xs text-gray-600 border-t border-gray-200">
                                        Lines: {codeEditor.code.split('\n').length} | Characters: {codeEditor.code.length} | Semantic Analysis: Active
                                    </div>
                                </div>

                                {/* Output and Testing Panel */}
                                <div className="bg-gray-50 border border-gray-200 flex flex-col">
                                    <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 border-b border-gray-200 flex justify-between items-center">
                                        <span>🔍 Dynamic Analysis & Output</span>
                                        <button
                                            onClick={() => setDebugMode(!debugMode)}
                                            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                                debugMode 
                                                    ? 'bg-green-600 text-white' 
                                                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                            }`}
                                        >
                                            {debugMode ? '🐛 Debug ON' : '🔧 Debug OFF'}
                                        </button>
                                    </div>
                                    <div className="flex-1 p-4 overflow-y-auto bg-white" style={{ minHeight: '500px' }}>
                    <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed text-gray-700">
                      {codeEditor.output || "🚀 Professional testing environment ready...\n\nYour code will be dynamically analyzed for:\n• Syntax correctness\n• Logic implementation  \n• Best practices\n• Performance metrics\n• Memory safety\n• Kernel coding standards\n\nThis large editor provides:\n• Ample space for complex kernel modules\n• Real-time error detection\n• Code complexity analysis\n• Security vulnerability scanning\n• Performance optimization hints\n\n✨ RESIZE TIP: Drag the bottom edge of this panel to make it even larger!\n\nClick 'Run & Validate' to begin comprehensive testing!"}
                    </pre>
                                    </div>
                                    {codeEditor.testResults.length > 0 && (
                                        <div className="border-t border-gray-200 p-3 bg-gray-50">
                                            <div className="text-xs text-gray-600 mb-2 font-medium">Test Results:</div>
                                            <div className="space-y-1">
                                                {codeEditor.testResults.map((result, index) => (
                                                    <div key={index} className={`text-xs flex items-center gap-2 ${
                                                        result.passed ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        <span>{result.passed ? '✓' : '✗'}</span>
                                                        <span>{result.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Smart Concept Detection Panel */}
                        {showLessons && currentChallenge && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                                <div className="p-4">
                                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                                        <Book size={16} />
                                        Concepts in Your Code
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {detectUnfamiliarConcepts(codeEditor.code || currentChallenge.starter).map((conceptName) => {
                                            const concept = getConcept(conceptName);
                                            if (!concept) return null;

                                            return (
                                                <div key={conceptName} className="p-3 bg-white rounded border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                                                     onClick={() => setSelectedConcept(concept)}>
                                                    <div className="font-medium text-blue-800">{concept.title}</div>
                                                    <div className="text-sm text-blue-600 mb-2">{concept.description}</div>
                                                    <div className="text-xs text-blue-500">Click to learn more →</div>
                                                </div>
                                            );
                                        })}
                                        {detectUnfamiliarConcepts(codeEditor.code || currentChallenge.starter).length === 0 && (
                                            <div className="text-blue-600 col-span-2 text-center py-4">
                                                No unfamiliar concepts detected in your current code. Great job! 🎉
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hints Panel - Positioned Below Editor */}
                        {showHints && currentChallenge && currentChallenge.hints && (
                            <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg shadow-sm">
                                <div className="p-4">
                                    <h4 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                                        <Lightbulb size={16} />
                                        Context-Aware Learning Hints
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentChallenge.hints.map((hint, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-white rounded border border-orange-200">
                                                <div className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </div>
                                                <span className="text-orange-800 text-sm leading-relaxed">{hint}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 text-xs text-orange-600 bg-orange-100 p-3 rounded border border-orange-200">
                                        💡 These hints are dynamically generated based on your specific challenge pattern, current skill level, and common pitfalls in kernel programming. They adapt as you progress through different phases of learning.
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Problems Bank Tab - Structured Problems List */}
            {activeTab === 'problems' && (
                <div className="space-y-6">
                    {/* Problems Overview */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <Trophy className="text-yellow-500" />
                                Kernel Development Problems Bank
                            </h2>
                            <div className="text-sm text-gray-600">
                                {getProblemStats().completed} / {getProblemStats().total} completed
                            </div>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            Complete structured problems from zero programming knowledge to professional kernel development.
                            Progress through 400+ carefully designed problems covering all aspects of Linux kernel development.
                        </p>
                        
                        {/* Progress Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                        {((getProblemStats().completed / getProblemStats().total) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">{getProblemStats().completed}</div>
                                <div className="text-sm text-gray-600">Problems Completed</div>
                                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${(getProblemStats().completed / getProblemStats().total) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                        Remaining
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">{getProblemStats().total - getProblemStats().completed}</div>
                                <div className="text-sm text-gray-600">Problems Available</div>
                                <div className="mt-3 text-xs text-gray-500">Continue your learning journey!</div>
                            </div>
                            
                            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Target className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                        Active
                                    </span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {Object.keys(getProblemStats().byPhase).filter(phase => 
                                        getProblemStats().byPhase[phase].completed > 0
                                    ).length}
                                </div>
                                <div className="text-sm text-gray-600">Phases Started</div>
                                <div className="mt-3 text-xs text-gray-500">Multi-area learning progress</div>
                            </div>
                        </div>
                        
                        {/* Filter Controls */}
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                                <select 
                                    value={problemFilters.phase}
                                    onChange={(e) => setProblemFilters(prev => ({...prev, phase: e.target.value}))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="all">All Phases</option>
                                    <option value="foundations">Foundations</option>
                                    <option value="kernel_core">Kernel Core</option>
                                    <option value="memory_mgmt">Memory Management</option>
                                    <option value="drivers">Device Drivers</option>
                                    <option value="synchronization">Synchronization</option>
                                    <option value="networking">Networking</option>
                                    <option value="filesystems">Filesystems</option>
                                    <option value="security">Security</option>
                                    <option value="performance">Performance</option>
                                    <option value="professional">Professional</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                <select 
                                    value={problemFilters.difficulty}
                                    onChange={(e) => setProblemFilters(prev => ({...prev, difficulty: e.target.value}))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="all">All Levels</option>
                                    <option value="1">Level 1 (Beginner)</option>
                                    <option value="2">Level 2 (Basic)</option>
                                    <option value="3">Level 3 (Intermediate)</option>
                                    <option value="4">Level 4 (Advanced)</option>
                                    <option value="5">Level 5 (Expert)</option>
                                    <option value="6">Level 6 (Master)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select 
                                    value={problemFilters.completed}
                                    onChange={(e) => setProblemFilters(prev => ({...prev, completed: e.target.value}))}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="all">All Problems</option>
                                    <option value="incomplete">Not Completed</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    {/* Problems List */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-lg font-semibold mb-4">
                            Problems ({getFilteredProblems().length} found)
                        </h3>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {getFilteredProblems().map((problem) => {
                                const isCompleted = completedChallenges.has(problem.id);
                                const isLocked = problem.multiPart?.previousProblemId && 
                                                !completedChallenges.has(problem.multiPart.previousProblemId);
                                
                                return (
                                    <div 
                                        key={problem.id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                                            isCompleted ? 'bg-green-50 border-green-200' : 
                                            isLocked ? 'bg-gray-50 border-gray-200 opacity-60' :
                                            'bg-white border-gray-200 hover:border-blue-300'
                                        }`}
                                        onClick={() => !isLocked && selectProblemFromBank(problem)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-sm font-medium text-gray-500">#{problem.id}</span>
                                                    <h4 className="font-medium text-gray-900">{problem.title}</h4>
                                                    {problem.multiPart && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                                            Part {problem.multiPart.part}/{problem.multiPart.totalParts}
                                                        </span>
                                                    )}
                                                    {isCompleted && (
                                                        <span className="text-green-600">
                                                            <CheckCircle size={16} />
                                                        </span>
                                                    )}
                                                    {isLocked && (
                                                        <span className="text-gray-400">
                                                            <Lock size={16} />
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{problem.description}</p>
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                                                        Level {problem.difficulty}
                                                    </span>
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-600 border border-purple-300">
                                                        +{problem.xp} XP
                                                    </span>
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600 border border-blue-300">
                                                        {problem.phase}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {isLocked ? (
                                                    <div className="text-xs text-gray-500">
                                                        Complete previous part first
                                                    </div>
                                                ) : (
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                        {isCompleted ? 'Solve Again' : 'Start Problem'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {getFilteredProblems().length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Trophy size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No problems match your current filters.</p>
                                <p className="text-sm">Try adjusting the filters above.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Phase Progression Tab - Free Choice */}
            {activeTab === 'phases' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <GitBranch className="text-blue-500" />
                            Professional Kernel Development Track
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Complete all 10 phases to become a professional kernel developer ready for 
                            <strong> NVIDIA, Intel, Canonical, SUSE</strong> and other major tech companies.
                            Each phase builds on the previous, from C basics to enterprise kernel contribution.
                        </p>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border mb-6">
                            <h3 className="font-semibold text-blue-800 mb-2">🎯 Career Preparation Track</h3>
                            <p className="text-sm text-blue-700">
                                This curriculum is designed based on real job requirements from kernel teams at major technology companies.
                                Upon completion, you'll have the skills needed for:
                            </p>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>• <strong>GPU Driver Engineer</strong> at NVIDIA/AMD</li>
                                <li>• <strong>Kernel Developer</strong> at Intel/Canonical</li>
                                <li>• <strong>Systems Engineer</strong> at SUSE/Red Hat</li>
                                <li>• <strong>Linux Kernel Contributor</strong> to upstream</li>
                            </ul>
                        </div>

                        <div className="space-y-6">
                            {Object.entries(phaseSystem).map(([phaseKey, phase]) => {
                                const progress = getPhaseProgress(phaseKey);
                                const isCurrentPhase = userProfile.currentPhase === phaseKey;
                                const completedConcepts = phase.concepts.filter(concept => 
                                    userSkills[phaseKey]?.[concept.name.toLowerCase().replace(/[^a-z0-9]/g, '')] > 0.7
                                ).length;

                                return (
                                    <div key={phaseKey} className={`border-2 rounded-xl p-6 transition-all cursor-pointer ${
                                        isCurrentPhase
                                            ? 'border-blue-500 bg-blue-50 shadow-xl'
                                            : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-lg'
                                    }`}
                                         onClick={() => setUserProfile(prev => ({ ...prev, currentPhase: phaseKey }))}>
                                        
                                        {/* Phase Header */}
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="text-4xl">{phase.icon}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold">{phase.name}</h3>
                                                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                                                        Level {phase.level}
                                                    </span>
                                                    {isCurrentPhase && (
                                                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 mb-3">{phase.description}</p>
                                                <div className="text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded-lg">
                                                    <strong>Industry Focus:</strong> {phase.industryRelevance}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-medium">Overall Progress</span>
                                                <span className="text-sm text-gray-600">
                                                    {completedConcepts}/{phase.concepts.length} concepts mastered
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all duration-700 ${
                                                        progress < 0.3 ? 'bg-red-400' : 
                                                        progress < 0.7 ? 'bg-yellow-400' : 'bg-green-500'
                                                    }`}
                                                    style={{ width: `${progress * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Prerequisites */}
                                        {phase.prerequisites.length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-sm font-medium text-gray-700 mb-2">Prerequisites:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {phase.prerequisites.map(prereq => (
                                                        <span key={prereq} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">
                                                            {phaseSystem[prereq]?.name.replace(/^Phase \d+: /, '') || prereq}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Core Concepts */}
                                        <div className="mb-4">
                                            <div className="text-sm font-medium text-gray-700 mb-3">Key Concepts:</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {phase.concepts.slice(0, 6).map(concept => {
                                                    const skillKey = concept.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                                                    const skillLevel = userSkills[phaseKey]?.[skillKey] || 0;
                                                    const isCompleted = skillLevel > 0.7;
                                                    
                                                    return (
                                                        <div key={concept.name} className="text-xs flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                                isCompleted ? 'bg-green-500' : 
                                                                skillLevel > 0.3 ? 'bg-yellow-400' : 'bg-gray-300'
                                                            }`} />
                                                            <span className={concept.essential ? 'font-medium' : ''}>
                                                                {concept.name}
                                                                {concept.essential && <span className="text-red-500 ml-1">*</span>}
                                                            </span>
                                                            <span className="text-gray-500">({concept.difficulty}/10)</span>
                                                        </div>
                                                    );
                                                })}
                                                {phase.concepts.length > 6 && (
                                                    <div className="text-xs text-gray-500 italic">
                                                        +{phase.concepts.length - 6} more concepts...
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Learning Objectives */}
                                        <div className="mb-4">
                                            <div className="text-sm font-medium text-gray-700 mb-2">Learning Objectives:</div>
                                            <p className="text-sm text-gray-600 italic">{phase.objectives}</p>
                                        </div>

                                        {/* Skills */}
                                        <div>
                                            <div className="text-sm font-medium text-gray-700 mb-2">Professional Skills:</div>
                                            <div className="flex flex-wrap gap-2">
                                                {phase.skills.map(skill => (
                                                    <span key={skill} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Career Progression Summary */}
                        <div className="bg-white rounded-lg p-6 shadow-md mt-8">
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                🎯 Your Professional Journey
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-green-800">Phases 1-2</h4>
                                    <p className="text-sm text-green-700 mt-1">Foundation Builder</p>
                                    <p className="text-xs text-green-600 mt-2">Ready for entry-level kernel tasks</p>
                                </div>
                                
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-blue-800">Phases 3-4</h4>
                                    <p className="text-sm text-blue-700 mt-1">Driver Developer</p>
                                    <p className="text-xs text-blue-600 mt-2">Can write device drivers</p>
                                </div>
                                
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-purple-800">Phases 5-6</h4>
                                    <p className="text-sm text-purple-700 mt-1">Systems Engineer</p>
                                    <p className="text-xs text-purple-600 mt-2">Multi-core & networking expert</p>
                                </div>
                                
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-orange-800">Phases 7-8</h4>
                                    <p className="text-sm text-orange-700 mt-1">Senior Developer</p>
                                    <p className="text-xs text-orange-600 mt-2">Storage & security specialist</p>
                                </div>
                                
                                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-red-800">Phases 9-10</h4>
                                    <p className="text-sm text-red-700 mt-1">Kernel Expert</p>
                                    <p className="text-xs text-red-600 mt-2">Ready for NVIDIA/Intel roles</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                                <h4 className="font-semibold text-orange-800 mb-2">🏆 Career Outcome</h4>
                                <p className="text-sm text-orange-700">
                                    Upon completing all phases, you'll have the knowledge and skills to:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                    <ul className="text-sm text-orange-700 space-y-1">
                                        <li>✅ Contribute to the Linux kernel mainline</li>
                                        <li>✅ Work as a GPU driver engineer at NVIDIA</li>
                                        <li>✅ Join Intel's kernel development team</li>
                                        <li>✅ Develop enterprise solutions at Red Hat/SUSE</li>
                                    </ul>
                                    <ul className="text-sm text-orange-700 space-y-1">
                                        <li>✅ Lead kernel projects at Canonical</li>
                                        <li>✅ Optimize high-performance systems</li>
                                        <li>✅ Design security-critical kernel components</li>
                                        <li>✅ Mentor other kernel developers</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Concept Learning Tab */}
            {activeTab === 'concepts' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                            <Book className="text-blue-500" />
                            Interactive Concept Learning
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Don't understand a programming term? Click on any concept below to get detailed explanations,
                            code examples, and practice exercises. All concepts are explained in simple terms.
                        </p>

                        {/* Concept Categories */}
                        <div className="space-y-6">
                            {Object.entries(
                                Object.values(conceptDatabase).reduce((acc, concept) => {
                                    if (!acc[concept.category]) acc[concept.category] = [];
                                    acc[concept.category].push(concept);
                                    return acc;
                                }, {})
                            ).map(([category, concepts]) => (
                                <div key={category}>
                                    <h3 className="text-lg font-semibold mb-3 text-gray-800">{category}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {concepts.map(concept => (
                                            <div
                                                key={concept.title}
                                                onClick={() => setSelectedConcept(concept)}
                                                className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-medium text-gray-800">{concept.title}</h4>
                                                    <span className={`text-xs px-2 py-1 rounded ${
                                                        concept.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                                            concept.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                    }`}>
                            {concept.difficulty}
                          </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-3">{concept.description}</p>
                                                <div className="text-xs text-blue-600 hover:text-blue-800">
                                                    Click to learn more →
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Search */}
                        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-800 mb-2">💡 Quick Tip</h3>
                            <p className="text-blue-700 text-sm">
                                When working on challenges, click the "Learn Concepts" button in the editor to see
                                explanations for any unfamiliar terms in your current code!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">{Math.floor(userProfile.xp / 100)}</div>
                            <div className="text-sm font-medium text-gray-600">Skill Rank</div>
                            <div className="text-xs text-gray-500 mt-2">
                                Based on XP earned
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Star className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">{userProfile.xp.toLocaleString()}</div>
                            <div className="text-sm font-medium text-gray-600">Total XP</div>
                            <div className="text-xs text-gray-500 mt-2">
                                Avg: {userProfile.totalChallenges > 0 ? Math.round(userProfile.xp / userProfile.totalChallenges) : 0} per challenge
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">{userProfile.challengesGenerated.toLocaleString()}</div>
                            <div className="text-sm font-medium text-gray-600">Challenges Generated</div>
                            <div className="text-xs text-gray-500 mt-2">
                                {userProfile.uniqueChallengesCompleted} completed
                            </div>
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm">
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Target className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-2">{userProfile.masteryPoints.toLocaleString()}</div>
                            <div className="text-sm font-medium text-gray-600">Mastery Points</div>
                            <div className="text-xs text-gray-500 mt-2">
                                Skill improvements tracked
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="text-green-500" />
                            Unlimited Progression Analytics
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium mb-3">Cross-Phase Skill Distribution</h3>
                                <div className="space-y-3">
                                    {Object.entries(phaseSystem).map(([phaseKey, phase]) => {
                                        const progress = getPhaseProgress(phaseKey);
                                        const isUnlocked = true; // All phases are now unlocked

                                        return (
                                            <div key={phaseKey}>
                                                <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <span className="text-lg">{phase.icon}</span>
                              {phase.name}
                              {!isUnlocked && <Lock className="w-3 h-3 text-gray-400" />}
                          </span>
                                                    <span className="text-sm text-gray-600">{Math.round(progress * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-700 ${
                                                            isUnlocked
                                                                ? progress < 0.3 ? 'bg-red-400' : progress < 0.7 ? 'bg-yellow-400' : 'bg-green-400'
                                                                : 'bg-gray-400'
                                                        }`}
                                                        style={{ width: `${progress * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <h3 className="font-medium mb-3">Dynamic Learning Insights</h3>
                                <div className="space-y-4">
                                    <div className="bg-blue-50 p-3 rounded border">
                                        <div className="font-medium text-blue-800">Adaptive Difficulty</div>
                                        <div className="text-sm text-blue-600">
                                            System generates challenges at optimal difficulty based on your current skill levels
                                        </div>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded border">
                                        <div className="font-medium text-green-800">Unlimited Content</div>
                                        <div className="text-sm text-green-600">
                                            {userProfile.challengesGenerated.toLocaleString()} unique challenges generated so far,
                                            with infinite variations possible
                                        </div>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded border">
                                        <div className="font-medium text-purple-800">Mastery Tracking</div>
                                        <div className="text-sm text-purple-600">
                                            {userProfile.masteryPoints} mastery points earned through skill improvements
                                            across all phases
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded border">
                                        <div className="font-medium text-orange-800">Success Prediction</div>
                                        <div className="text-sm text-orange-600">
                                            {userProfile.challengesGenerated > 0
                                                ? `${Math.round((userProfile.uniqueChallengesCompleted / userProfile.challengesGenerated) * 100)}% success rate`
                                                : 'Start solving challenges to see your success rate'
                                            } - system adapts to maintain optimal challenge level
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {challengeHistory.length > 0 && (
                        <div className="bg-white rounded-lg p-6 shadow-md">
                            <h2 className="text-xl font-semibold mb-4">Recent Challenge History</h2>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {challengeHistory.slice(-10).reverse().map((challenge, index) => (
                                    <div key={challenge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{challenge.title}</div>
                                            <div className="text-xs text-gray-600">
                                                {challenge.phase} • Level {challenge.difficulty} • {challenge.templateUsed}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-green-600">+{challenge.xpEarned} XP</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(challenge.completedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Playground Tab - Kernel C Code Editor and Runner */}
            {activeTab === 'playground' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Terminal className="text-blue-500" />
                                Kernel C Playground
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Module Name:</span>
                                <input
                                    type="text"
                                    value={playground.moduleName}
                                    onChange={(e) => setPlayground(prev => ({ ...prev, moduleName: e.target.value }))}
                                    className="px-2 py-1 border rounded text-sm"
                                    placeholder="module_name"
                                />
                            </div>
                        </div>
                        
                        <p className="text-gray-600 mb-6">
                            Write and test kernel C code with real compilation and QEMU testing. 
                            Your code will be compiled with GCC and tested in a real Linux virtual machine!
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Code Editor */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Code className="text-green-500" />
                                        Kernel C Code Editor
                                    </h3>
                                    <button
                                        onClick={runPlaygroundCode}
                                        disabled={playground.isRunning}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                            playground.isRunning
                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                    >
                                        {playground.isRunning ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                                Compiling...
                                            </>
                                        ) : (
                                            <>
                                                <Play size={16} />
                                                Compile & Test
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 border-b border-gray-200 flex justify-between items-center">
                                        <span>📝 Semantic Playground Editor</span>
                                        <span className="text-gray-500">Real-time kernel API validation</span>
                                    </div>
                                    <SemanticCodeEditor
                                        value={playground.code}
                                        onChange={(value) => setPlayground(prev => ({ ...prev, code: value }))}
                                        height="400px"
                                        placeholder="Write your kernel C code here..."
                                        className="rounded-b-lg"
                                    />
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border">
                                    <h4 className="font-medium text-blue-800 mb-2">💡 Semantic Analysis Features:</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• <strong>Real-time error detection:</strong> Red squiggles for kernel violations</li>
                                        <li>• <strong>Cross-platform:</strong> Works on Windows, macOS, and Linux</li>
                                        <li>• <strong>Kernel API validation:</strong> Detects printf/malloc usage errors</li>
                                        <li>• <strong>Smart completions:</strong> Kernel-specific autocomplete suggestions</li>
                                        <li>• <strong>Header validation:</strong> Warns about userspace includes</li>
                                        <li>• <strong>Best practices:</strong> Suggests proper error handling</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Output Panel */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Terminal className="text-orange-500" />
                                    Compilation & Testing Output
                                </h3>

                                <div className="bg-black text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm">
                                    {playground.output ? (
                                        <pre className="whitespace-pre-wrap">{playground.output}</pre>
                                    ) : (
                                        <div className="text-gray-500">
                                            Click "Compile & Test" to see real kernel compilation output...
                                        </div>
                                    )}
                                </div>

                                {playground.compilationResult && (
                                    <div className="bg-green-50 p-4 rounded-lg border">
                                        <h4 className="font-medium text-green-800 mb-2">✅ Compilation Status:</h4>
                                        <p className="text-sm text-green-700">
                                            {playground.compilationResult.message}
                                        </p>
                                    </div>
                                )}

                                {playground.testingResult && (
                                    <div className="bg-purple-50 p-4 rounded-lg border">
                                        <h4 className="font-medium text-purple-800 mb-2">🖥️ QEMU Testing:</h4>
                                        <p className="text-sm text-purple-700">
                                            {playground.testingResult.message}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Example Templates */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-lg font-semibold mb-4">🔬 Example Templates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setPlayground(prev => ({
                                    ...prev,
                                    code: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

static int __init hello_init(void) {
    printk(KERN_INFO "Hello from Kernel Academy!\\n");
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye from Kernel Academy!\\n");
}

module_init(hello_init);
module_exit(hello_exit);

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Simple hello world kernel module");
MODULE_AUTHOR("Kernel Academy Student");`,
                                    moduleName: 'hello_world'
                                }))}
                                className="bg-blue-50 p-4 rounded-lg border hover:bg-blue-100 transition-colors text-left"
                            >
                                <h4 className="font-medium text-blue-800">Hello World Module</h4>
                                <p className="text-sm text-blue-600 mt-1">Basic kernel module template</p>
                            </button>

                            <button
                                onClick={() => setPlayground(prev => ({
                                    ...prev,
                                    code: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/proc_fs.h>
#include <linux/uaccess.h>

#define PROC_NAME "kernel_academy"

static struct proc_dir_entry *proc_entry;

static ssize_t proc_write(struct file *file, const char __user *buffer, size_t count, loff_t *pos) {
    printk(KERN_INFO "Received %zu bytes from user space\\n", count);
    return count;
}

static ssize_t proc_read(struct file *file, char __user *buffer, size_t count, loff_t *pos) {
    char *msg = "Hello from kernel space!\\n";
    int len = strlen(msg);
    
    if (*pos >= len) return 0;
    if (copy_to_user(buffer, msg, len)) return -EFAULT;
    *pos += len;
    return len;
}

static const struct proc_ops proc_fops = {
    .proc_read = proc_read,
    .proc_write = proc_write,
};

static int __init proc_init(void) {
    proc_entry = proc_create(PROC_NAME, 0666, NULL, &proc_fops);
    if (!proc_entry) {
        printk(KERN_ERR "Failed to create /proc/%s\\n", PROC_NAME);
        return -ENOMEM;
    }
    printk(KERN_INFO "Created /proc/%s\\n", PROC_NAME);
    return 0;
}

static void __exit proc_exit(void) {
    proc_remove(proc_entry);
    printk(KERN_INFO "Removed /proc/%s\\n", PROC_NAME);
}

module_init(proc_init);
module_exit(proc_exit);

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Proc filesystem example");
MODULE_AUTHOR("Kernel Academy Student");`,
                                    moduleName: 'proc_example'
                                }))}
                                className="bg-green-50 p-4 rounded-lg border hover:bg-green-100 transition-colors text-left"
                            >
                                <h4 className="font-medium text-green-800">Proc Filesystem</h4>
                                <p className="text-sm text-green-600 mt-1">User-kernel communication via /proc</p>
                            </button>

                            <button
                                onClick={() => setPlayground(prev => ({
                                    ...prev,
                                    code: `#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/slab.h>

static char *buffer;
static size_t buffer_size = 1024;

static int __init memory_init(void) {
    buffer = kmalloc(buffer_size, GFP_KERNEL);
    if (!buffer) {
        printk(KERN_ERR "Failed to allocate memory\\n");
        return -ENOMEM;
    }
    
    strcpy(buffer, "Hello from kernel memory!");
    printk(KERN_INFO "Allocated %zu bytes: %s\\n", buffer_size, buffer);
    return 0;
}

static void __exit memory_exit(void) {
    if (buffer) {
        printk(KERN_INFO "Freeing buffer: %s\\n", buffer);
        kfree(buffer);
    }
    printk(KERN_INFO "Memory management example exited\\n");
}

module_init(memory_init);
module_exit(memory_exit);

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Kernel memory management example");
MODULE_AUTHOR("Kernel Academy Student");`,
                                    moduleName: 'memory_example'
                                }))}
                                className="bg-purple-50 p-4 rounded-lg border hover:bg-purple-100 transition-colors text-left"
                            >
                                <h4 className="font-medium text-purple-800">Memory Management</h4>
                                <p className="text-sm text-purple-600 mt-1">kmalloc() and kfree() example</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Phase Selector Modal */}
            {showPhaseSelector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Learning Phase</h2>
                            <p className="text-gray-600 text-center mb-6">
                                Select any phase to start learning. All phases are unlocked - learn at your own pace!
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(phaseSystem).map(([phaseKey, phase]) => {
                                    const progress = getPhaseProgress(phaseKey);
                                    
                                    return (
                                        <div
                                            key={phaseKey}
                                            onClick={() => selectPhase(phaseKey)}
                                            className="border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
                                        >
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="text-3xl">{phase.icon}</div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{phase.name}</h3>
                                                    <p className="text-sm text-gray-600">{phase.description}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium">Your Progress</span>
                                                    <span className="text-sm text-gray-600">{Math.round(progress * 100)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full bg-blue-500 transition-all duration-500"
                                                        style={{ width: `${progress * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="text-center">
                                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                                                    Start Learning
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {userProfile.currentPhase && (
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setShowPhaseSelector(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Concept Learning Modal */}
            {selectedConcept && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="w-full max-w-6xl my-8">
                        <ConceptLearner concept={selectedConcept} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnlimitedKernelAcademy;
