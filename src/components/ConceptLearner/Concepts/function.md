---
title: "Functions (Kernel)"
category: "Kernel C Fundamentals"
difficulty: "Beginner"
id: function
relatedConcepts: ["module_init", "static", "printk", "__init", "__exit"]
---

# Description

Reusable blocks of code in kernel modules with special attributes

# Explanation

Kernel functions work like userspace functions but with special considerations for the kernel environment.

**Kernel function parts:**
- Return type - what the function gives back
- Name - what you call it
- Parameters - what you give it
- Body - what it does
- Attributes - special kernel markers (`__init`, `static`, etc.)

**Special kernel function attributes:**
- `static` - function only visible in this file (common in kernel)
- `__init` - function only used during module loading (freed after)
- `__exit` - function only used during module unloading
- `inline` - hint to compiler to inline function for performance

**No main() function!** Kernel modules use `module_init()` and `module_exit()` instead.

# Code

```c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

// Helper function - static keeps it private to this module
static int add_numbers(int a, int b) {
    int result = a + b;
    printk(KERN_INFO "Adding %d + %d = %d\n", a, b, result);
    return result;  // Return the sum
}

// Function with no return value
static void greet_kernel(const char *name) {
    printk(KERN_INFO "Hello from kernel, %s!\n", name);
    // No return statement needed for void
}

// Module initialization function - __init means "free this after loading"
static int __init math_module_init(void) {
    int sum = add_numbers(5, 3);        // Call our function
    greet_kernel("Linux Kernel");       // Call void function

    printk(KERN_INFO "Math module loaded, sum = %d\n", sum);
    return 0;  // 0 = success, negative = error
}

// Module cleanup function - __exit means "only for unloading"
static void __exit math_module_exit(void) {
    printk(KERN_INFO "Math module unloaded\n");
}

module_init(math_module_init);    // Register init function
module_exit(math_module_exit);    // Register exit function
MODULE_LICENSE("GPL");

// Key differences from userspace:
// ❌ main()     → ✅ module_init()/module_exit()
// ❌ printf()   → ✅ printk()
// ✅ static functions are very common in kernel
// ✅ __init and __exit attributes save memory
```

# Exercises

1. Write a kernel function that calculates rectangle area
2. Create a function that prints device info using printk
3. Make a static helper function for string operations
