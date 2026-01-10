---
title: "#include (Kernel)"
category: "Kernel C Preprocessor"
difficulty: "Beginner"
id: include
relatedConcepts: ["kernel_modules", "printk", "module_init", "kmalloc"]
---

# What is #include?

The `#include` directive brings in header files that contain function declarations, macros, and type definitions.

**Important:** Kernel code cannot use userspace headers like `stdio.h` or `stdlib.h`!

## Kernel vs Userspace Headers

| Userspace (NOT available) | Kernel (Use these) |
|---------------------------|-------------------|
| `stdio.h` | `linux/kernel.h` |
| `stdlib.h` | `linux/slab.h` |
| `string.h` | `linux/string.h` |
| `malloc()` | `kmalloc()` |
| `printf()` | `printk()` |

---

# Essential Kernel Headers

Every kernel module needs certain headers. Here are the most common:

| Header | Purpose | Key Functions |
|--------|---------|---------------|
| `<linux/module.h>` | Core module support | `MODULE_LICENSE`, `MODULE_AUTHOR` |
| `<linux/kernel.h>` | Kernel utilities | `printk`, `pr_info`, `container_of` |
| `<linux/init.h>` | Init/exit macros | `__init`, `__exit` |
| `<linux/slab.h>` | Memory allocation | `kmalloc`, `kfree` |
| `<linux/string.h>` | String functions | `strlen`, `strcmp`, `strcpy` |

---

# Basic Module with Headers

<code_editor title="Essential Headers" module="include_basic">
#include <linux/module.h>   /* Essential for ALL kernel modules */
#include <linux/kernel.h>   /* For printk, pr_info */
#include <linux/init.h>     /* For __init and __exit macros */

static int __init hello_init(void)
{
    pr_info("[OUT] === Header Demo ===\n");
    pr_info("[OUT] linux/module.h - Module support loaded\n");
    pr_info("[OUT] linux/kernel.h - Kernel utilities available\n");
    pr_info("[OUT] linux/init.h - Init macros ready\n");
    return 0;
}

static void __exit hello_exit(void) { }

module_init(hello_init);
module_exit(hello_exit);
MODULE_LICENSE("GPL");
MODULE_AUTHOR("KernelQ Learner");
MODULE_DESCRIPTION("Header demonstration module");
</code_editor>

---

# Using linux/string.h

The kernel has its own string functions - similar to userspace but kernel-safe:

<code_editor title="Kernel String Functions" module="include_string">
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/string.h>   /* Kernel string functions */

static int __init string_demo_init(void)
{
    char buffer[64];
    const char *msg = "Hello Kernel";

    pr_info("[OUT] === String Functions Demo ===\n");

    /* strlen - get string length */
    pr_info("[OUT] strlen(\"%s\") = %zu\n", msg, strlen(msg));

    /* strcpy - copy string */
    strcpy(buffer, msg);
    pr_info("[OUT] After strcpy: buffer = \"%s\"\n", buffer);

    /* strcat - concatenate strings */
    strcat(buffer, " World!");
    pr_info("[OUT] After strcat: buffer = \"%s\"\n", buffer);

    /* strcmp - compare strings (0 = equal) */
    pr_info("[OUT] strcmp(\"abc\", \"abc\") = %d\n", strcmp("abc", "abc"));
    pr_info("[OUT] strcmp(\"abc\", \"xyz\") = %d\n", strcmp("abc", "xyz"));

    return 0;
}

static void __exit string_demo_exit(void) { }

module_init(string_demo_init);
module_exit(string_demo_exit);
MODULE_LICENSE("GPL");
</code_editor>

---

# Using linux/slab.h for Memory

The kernel uses `kmalloc`/`kfree` instead of `malloc`/`free`:

<code_editor title="Kernel Memory Allocation" module="include_slab">
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/slab.h>     /* For kmalloc, kfree */
#include <linux/string.h>

static int __init memory_demo_init(void)
{
    char *buffer;
    int *numbers;

    pr_info("[OUT] === Memory Allocation Demo ===\n");

    /* Allocate memory for a string (GFP_KERNEL = can sleep) */
    buffer = kmalloc(64, GFP_KERNEL);
    if (!buffer) {
        pr_err("[OUT] Failed to allocate buffer!\n");
        return -ENOMEM;
    }

    strcpy(buffer, "Dynamically allocated!");
    pr_info("[OUT] buffer = \"%s\"\n", buffer);

    /* Allocate memory for integers */
    numbers = kmalloc(3 * sizeof(int), GFP_KERNEL);
    if (!numbers) {
        kfree(buffer);
        return -ENOMEM;
    }

    numbers[0] = 10;
    numbers[1] = 20;
    numbers[2] = 30;
    pr_info("[OUT] numbers = [%d, %d, %d]\n", numbers[0], numbers[1], numbers[2]);

    /* Always free what you allocate! */
    kfree(buffer);
    kfree(numbers);
    pr_info("[OUT] Memory freed successfully\n");

    return 0;
}

static void __exit memory_demo_exit(void) { }

module_init(memory_demo_init);
module_exit(memory_demo_exit);
MODULE_LICENSE("GPL");
</code_editor>

---

# Quick Reference

```c
/* Minimum headers for any module */
#include <linux/module.h>
#include <linux/kernel.h>

/* Add these as needed */
#include <linux/init.h>     /* __init, __exit */
#include <linux/slab.h>     /* kmalloc, kfree */
#include <linux/string.h>   /* strlen, strcpy, etc. */
#include <linux/fs.h>       /* File operations */
#include <linux/device.h>   /* Device classes */
```
