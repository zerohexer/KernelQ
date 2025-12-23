---
title: "#include (Kernel)"
category: "Kernel C Preprocessor"
difficulty: "Beginner"
id: include
relatedConcepts: ["kernel_modules", "printk", "module_init", "kmalloc"]
---

# Description

Include kernel headers to access kernel functions and structures

# Explanation

In kernel programming, #include works the same way but you use kernel-specific headers instead of userspace headers.

**Kernel headers vs Userspace headers:**
- Userspace: stdio.h, stdlib.h, string.h (NOT available in kernel!)
- Kernel: linux/module.h, linux/kernel.h, linux/init.h

**Essential kernel headers:**
- `<linux/module.h>` - Core module functionality
- `<linux/kernel.h>` - Kernel utilities (printk, container_of)
- `<linux/init.h>` - Module initialization macros
- `<linux/slab.h>` - Memory allocation (kmalloc, kfree)
- `<linux/string.h>` - Kernel string functions

**Why different headers?**

Kernel code runs in a restricted environment with no userspace libraries.

# Code

```c
#include <linux/module.h>   // Essential for all kernel modules
#include <linux/kernel.h>   // For printk (kernel's printf)
#include <linux/init.h>     // For __init and __exit macros
#include <linux/slab.h>     // For kmalloc/kfree (kernel's malloc/free)
#include <linux/string.h>   // For kernel string functions

static int __init hello_init(void) {
    printk(KERN_INFO "Hello from kernel!\n");  // printk NOT printf!
    return 0;
}

static void __exit hello_exit(void) {
    printk(KERN_INFO "Goodbye from kernel!\n");
}

module_init(hello_init);    // Register init function
module_exit(hello_exit);    // Register cleanup function
MODULE_LICENSE("GPL");      // Required license declaration

// Key differences:
// ❌ printf() → ✅ printk()
// ❌ malloc() → ✅ kmalloc()
// ❌ main()   → ✅ module_init/exit functions
```

# Exercises

1. Include linux/module.h and create a basic kernel module
2. Add linux/slab.h and use kmalloc/kfree
3. Include linux/string.h and use kernel string functions
