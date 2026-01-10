---
title: "Functions (Kernel)"
category: "Kernel C Fundamentals"
difficulty: "Beginner"
id: function
relatedConcepts: ["module_init", "static", "printk", "__init", "__exit"]
---

# What are Kernel Functions?

Kernel functions work like regular C functions but with special attributes for the kernel environment.

## Function Parts

| Part | Description | Example |
|------|-------------|---------|
| Return type | What the function gives back | `int`, `void` |
| Name | What you call it | `add_numbers` |
| Parameters | What you give it | `(int a, int b)` |
| Body | What it does | `{ return a + b; }` |
| Attributes | Special kernel markers | `static`, `__init` |

## Special Kernel Attributes

- ``static`` - Function only visible in this file (very common in kernel)
- ``__init`` - Function only used during module loading (memory freed after)
- ``__exit`` - Function only used during module unloading
- ``inline`` - Hint to compiler to inline for performance

---

# Basic Function Example

**No main() function!** Kernel modules use ``module_init()`` and ``module_exit()`` instead.

<code_editor title="Basic Kernel Functions" module="func_basic">
#include <linux/module.h>
#include <linux/kernel.h>

/* Helper function - static keeps it private to this module */
static int add_numbers(int a, int b)
{
    int result = a + b;
    pr_info("[OUT] Adding %d + %d = %d\n", a, b, result);
    return result;
}

/* Function with no return value */
static void greet_kernel(const char *name)
{
    pr_info("[OUT] Hello from kernel, %s!\n", name);
}

static int __init func_demo_init(void)
{
    int sum;

    pr_info("[OUT] === Function Demo ===\n");

    sum = add_numbers(5, 3);
    greet_kernel("Linux Learner");

    pr_info("[OUT] Final sum = %d\n", sum);
    return 0;
}

static void __exit func_demo_exit(void) { }

module_init(func_demo_init);
module_exit(func_demo_exit);
MODULE_LICENSE("GPL");
</code_editor>

Try changing the numbers in ``add_numbers(5, 3)`` and run again!

---

# Functions with Different Return Types

Functions can return different types or nothing at all (``void``):

<code_editor title="Return Types" module="func_returns">
#include <linux/module.h>
#include <linux/kernel.h>

/* Returns an integer */
static int multiply(int a, int b)
{
    return a * b;
}

/* Returns a boolean (true/false) */
static bool is_positive(int num)
{
    return num > 0;
}

/* Returns nothing (void) - just does something */
static void print_status(const char *status)
{
    pr_info("[OUT] Status: %s\n", status);
}

static int __init return_demo_init(void)
{
    int product;
    bool positive;

    product = multiply(4, 7);
    pr_info("[OUT] 4 x 7 = %d\n", product);

    positive = is_positive(product);
    pr_info("[OUT] Is positive? %s\n", positive ? "yes" : "no");

    print_status("All checks passed");

    return 0;
}

static void __exit return_demo_exit(void) { }

module_init(return_demo_init);
module_exit(return_demo_exit);
MODULE_LICENSE("GPL");
</code_editor>

---

# The __init and __exit Attributes

These special attributes help the kernel manage memory efficiently:

```
__init  →  "Free this function's memory after module loads"
__exit  →  "Only include this if module can be unloaded"
```

<code_editor title="Init and Exit Functions" module="func_init_exit">
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>

/* __init: This function runs ONCE at load time, then memory is freed */
static int __init my_module_init(void)
{
    pr_info("[OUT] Module initializing...\n");
    pr_info("[OUT] This __init function will be freed from memory!\n");
    pr_info("[OUT] Initialization complete.\n");
    return 0;  /* 0 = success, negative = error */
}

/* __exit: Only used when unloading - not included in built-in modules */
static void __exit my_module_exit(void)
{
    pr_info("[OUT] Module cleanup running...\n");
}

module_init(my_module_init);  /* Register init function */
module_exit(my_module_exit);  /* Register exit function */
MODULE_LICENSE("GPL");
</code_editor>

---

# Quick Reference

| Userspace | Kernel |
|-----------|--------|
| `main()` | `module_init()` / `module_exit()` |
| `printf()` | `printk()` / `pr_info()` |
| Global functions | `static` functions (file-private) |
| Regular functions | `__init` / `__exit` attributes |
