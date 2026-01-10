---
title: "Pointers"
category: "Kernel C Fundamentals"
difficulty: "Intermediate"
id: pointers
relatedConcepts: ["memory", "structures", "arrays", "address-of", "dereference"]
---

# What is a Pointer?

Think of memory like a street with houses. Each house has an address and contains something inside.

- **Variable** = A house with a value inside
- **Address** = The street address of that house (like 0x1000)
- **Pointer** = A piece of paper with an address written on it

## Memory Diagram - Basic Variable

```
When you create: int age = 25;

Memory:
┌─────────────────┐
│  age = 25       │  ← The VALUE lives here
└─────────────────┘
   Address: 0x1000   ← WHERE it lives in memory
```

## The Two Key Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `&variable` | "Where does this variable live?" | Returns address |
| `*pointer` | "What's at this address?" | Returns value |

---

# Basic Pointer Example

Let's see pointers in action. Run this code to see how a pointer stores an address and can access the value:

<code_editor title="Basic Pointer Declaration" module="ptr_basic">
#include <linux/module.h>
#include <linux/kernel.h>

static int __init example_init(void)
{
    int value = 42;
    int *ptr = &value;  /* ptr now holds the address of value */

    pr_info("[OUT] Value directly: %d\n", value);
    pr_info("[OUT] Address of value: %px\n", &value);
    pr_info("[OUT] Pointer holds: %px\n", ptr);
    pr_info("[OUT] Value via pointer: %d\n", *ptr);

    return 0;
}

static void __exit example_exit(void) { }

module_init(example_init);
module_exit(example_exit);
MODULE_LICENSE("GPL");
</code_editor>

Try changing `value` to different numbers and run again to see the output change!

---

# Why Functions Need Pointers

Without pointers, functions receive **copies** of values. Changes inside the function are lost!

## The Problem: Pass by Value

```
void double_it(int x) {
    x = x * 2;  // Only modifies the COPY!
}

int num = 5;
double_it(num);
// num is STILL 5! The function got a copy.
```

## The Solution: Pass by Pointer

When you pass a pointer, the function can modify the **original** variable:

<code_editor title="Passing by Pointer" module="ptr_pass">
#include <linux/module.h>
#include <linux/kernel.h>

/* WITHOUT pointer - can't modify caller's variable */
static void bad_double(int x) {
    x = x * 2;  /* Only modifies local copy */
    pr_info("[OUT] Inside bad_double: x = %d\n", x);
}

/* WITH pointer - modifies original variable */
static void good_double(int *ptr) {
    *ptr = *ptr * 2;  /* Modifies what ptr points to */
    pr_info("[OUT] Inside good_double: *ptr = %d\n", *ptr);
}

static int __init example_init(void)
{
    int val = 5;

    pr_info("[OUT] Original value: %d\n", val);

    bad_double(val);
    pr_info("[OUT] After bad_double: %d (unchanged!)\n", val);

    good_double(&val);  /* Pass address with & */
    pr_info("[OUT] After good_double: %d (doubled!)\n", val);

    return 0;
}

static void __exit example_exit(void) { }

module_init(example_init);
module_exit(example_exit);
MODULE_LICENSE("GPL");
</code_editor>

Notice how `bad_double` doesn't change the original, but `good_double` does!

---

# Structure Pointers

When working with structures, pointers become even more important:

1. **Efficiency**: Passing a pointer (8 bytes) is faster than copying a large struct
2. **Modification**: Functions can modify the original struct
3. **Arrow operator**: Use `->` instead of `.` with pointers

<code_editor title="Structure Pointers" module="ptr_struct">
#include <linux/module.h>
#include <linux/kernel.h>

struct device_info {
    char name[32];
    int id;
    bool active;
};

/* Takes pointer - efficient, can modify original */
static void print_device(struct device_info *dev) {
    /* Use -> because dev is a pointer */
    pr_info("[OUT] Name: %s\n", dev->name);
    pr_info("[OUT] ID: %d\n", dev->id);
    pr_info("[OUT] Active: %s\n", dev->active ? "yes" : "no");
}

static void activate_device(struct device_info *dev) {
    dev->active = true;  /* Modifies original struct */
    pr_info("[OUT] Device %s activated!\n", dev->name);
}

static int __init example_init(void)
{
    struct device_info my_device = {
        .name = "sensor01",
        .id = 1001,
        .active = false
    };

    pr_info("[OUT] --- Before activation ---\n");
    print_device(&my_device);

    activate_device(&my_device);

    pr_info("[OUT] --- After activation ---\n");
    print_device(&my_device);

    return 0;
}

static void __exit example_exit(void) { }

module_init(example_init);
module_exit(example_exit);
MODULE_LICENSE("GPL");
</code_editor>

---

# Pointer Arithmetic

When you add 1 to a pointer, it moves by `sizeof(type)` bytes - not just 1 byte!

```
int arr[5] = {10, 20, 30, 40, 50};
int *ptr = arr;  // Points to first element

ptr + 0  → 0x1000  → *ptr = 10
ptr + 1  → 0x1004  → *(ptr+1) = 20  (moved 4 bytes because sizeof(int) = 4)
ptr + 2  → 0x1008  → *(ptr+2) = 30
```

<code_editor title="Pointer Arithmetic with Arrays" module="ptr_array">
#include <linux/module.h>
#include <linux/kernel.h>

static int __init example_init(void)
{
    int arr[] = {10, 20, 30, 40, 50};
    int *ptr = arr;  /* Points to first element */
    int i;

    pr_info("[OUT] Array traversal using pointer arithmetic:\n");

    for (i = 0; i < 5; i++) {
        pr_info("[OUT]   *(ptr + %d) = %d\n", i, *(ptr + i));
    }

    /* Move pointer forward */
    pr_info("[OUT] \nMoving pointer:\n");
    pr_info("[OUT]   *ptr = %d\n", *ptr);
    ptr++;  /* Now points to arr[1] */
    pr_info("[OUT]   After ptr++, *ptr = %d\n", *ptr);
    ptr += 2;  /* Now points to arr[3] */
    pr_info("[OUT]   After ptr += 2, *ptr = %d\n", *ptr);

    return 0;
}

static void __exit example_exit(void) { }

module_init(example_init);
module_exit(example_exit);
MODULE_LICENSE("GPL");
</code_editor>

---

# Common Pointer Mistakes

Avoid these common errors when working with pointers:

| Mistake | Wrong | Correct |
|---------|-------|---------|
| Forgetting `&` | `modify(x)` | `modify(&x)` |
| Wrong operator | `ptr.field` | `ptr->field` |
| Uninitialized pointer | `int *ptr; *ptr = 10;` | `int x; int *ptr = &x; *ptr = 10;` |

---

# Quick Reference

```c
int x = 42;
int *ptr = &x;   // ptr holds address of x

x        → 42       (the value)
&x       → 0x1000   (the address)
ptr      → 0x1000   (pointer holds the address)
*ptr     → 42       (value at the address ptr holds)

// Function parameter:
void modify(int *ptr)  // "I expect an ADDRESS"

// Calling:
modify(&num)           // "Here's the ADDRESS of num"
```
