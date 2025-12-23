---
title: "Pointers"
category: "Kernel C Fundamentals"
difficulty: "Intermediate"
id: pointers
relatedConcepts: ["memory", "structures", "arrays", "address-of", "dereference"]
---

# Description

Variables that store memory addresses, enabling indirect access to data and efficient data manipulation in kernel code.

# Explanation

**What is a Pointer?**

Think of memory like a street with houses. Each house has an address and contains something inside.

- **Variable** = A house with a value inside
- **Address** = The street address of that house (like 0x1000)
- **Pointer** = A piece of paper with an address written on it

**Memory Diagram - Basic Variable:**

```
When you create: int age = 25;

Memory:
┌─────────────────┐
│  age = 25       │  ← The VALUE lives here
└─────────────────┘
   Address: 0x1000   ← WHERE it lives in memory
```

**Memory Diagram - Pointer to Variable:**

```
int age = 25;
int *ptr = &age;

Memory Layout:
┌─────────────────┐         ┌─────────────────┐
│  ptr = 0x1000   │ ──────► │  age = 25       │
└─────────────────┘         └─────────────────┘
   Address: 0x2000             Address: 0x1000

ptr contains 0x1000 (the address where age lives)
*ptr gives you 25 (the value at that address)
```

**The Two Key Operators:**

- `&variable` → "Where does this variable live?" → Returns address
- `*pointer` → "What's at this address?" → Returns value

```
int age = 25;
int *ptr = &age;

age      → 25        (the value)
&age     → 0x1000    (the address)
ptr      → 0x1000    (pointer holds the address)
*ptr     → 25        (value at the address ptr holds)
```

**Why Functions Need Pointers - The Core Problem:**

```
WITHOUT pointers (pass by value):
┌──────────────────────────────────────────────────┐
│ void double_it(int x) {                          │
│     x = x * 2;  // Only modifies the COPY!       │
│ }                                                │
│                                                  │
│ int num = 5;                                     │
│ double_it(num);                                  │
│ // num is STILL 5! The function got a copy.      │
└──────────────────────────────────────────────────┘

What happens in memory:

BEFORE call:              DURING call:              AFTER call:
┌───────────┐            ┌───────────┐            ┌───────────┐
│ num = 5   │            │ num = 5   │ (unchanged)│ num = 5   │ ← Still 5!
└───────────┘            └───────────┘            └───────────┘
                         ┌───────────┐
                         │ x = 5     │ (copy)
                         └───────────┘
                              ↓
                         ┌───────────┐
                         │ x = 10    │ (modified copy, then destroyed)
                         └───────────┘
```

```
WITH pointers (pass by reference):
┌──────────────────────────────────────────────────┐
│ void double_it(int *ptr) {                       │
│     *ptr = *ptr * 2;  // Modifies the ORIGINAL!  │
│ }                                                │
│                                                  │
│ int num = 5;                                     │
│ double_it(&num);    // Pass address of num       │
│ // num is NOW 10! Function modified original.    │
└──────────────────────────────────────────────────┘

What happens in memory:

BEFORE call:              DURING call:              AFTER call:
┌───────────┐            ┌───────────┐            ┌───────────┐
│ num = 5   │            │ num = 5   │            │ num = 10  │ ← Changed!
└───────────┘            └───────────┘            └───────────┘
  0x1000                   0x1000                   0x1000
                              ↑
                         ┌───────────┐
                         │ptr= 0x1000│ (points to num)
                         └───────────┘
                         *ptr = 10 modifies num directly!
```

**Why `int *ptr` in Function Parameter?**

```
void modify(int *ptr)
           ─────────
               │
               └─► "I expect to receive an ADDRESS of an int"

When you call: modify(&num)
                     ────
                       │
                       └─► "Here's the ADDRESS of num"

The * in parameter declaration means:
"This parameter will hold an ADDRESS (pointer)"

The & when calling means:
"Give me the ADDRESS of this variable"
```

**Structure Pointers - Arrow Operator:**

```
struct device {
    char name[32];
    int id;
};

struct device dev = {"sensor", 100};
struct device *ptr = &dev;

Memory Layout:
┌─────────────────────────────────────┐
│ dev (entire struct)                 │
│ ┌─────────────────────────────────┐ │
│ │ name: "sensor"                  │ │ ← ptr->name accesses this
│ ├─────────────────────────────────┤ │
│ │ id: 100                         │ │ ← ptr->id accesses this
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
   Address: 0x3000
        ↑
        │
┌───────────────┐
│ ptr = 0x3000  │
└───────────────┘

Accessing members:
dev.name      → "sensor"  (dot with variable)
ptr->name     → "sensor"  (arrow with pointer)
(*ptr).name   → "sensor"  (same as arrow, but uglier)
```

**Why Pass Struct by Pointer?**

```
Pass by VALUE (bad for large structs):
┌────────────────────────────────────────────────┐
│ void print_dev(struct device d) {              │
│     // d is a COPY - wastes memory!            │
│     // Copying 100+ bytes every call           │
│ }                                              │
│ print_dev(my_device);  // Copies entire struct │
└────────────────────────────────────────────────┘

Pass by POINTER (efficient):
┌────────────────────────────────────────────────┐
│ void print_dev(struct device *d) {             │
│     // d is just 8 bytes (address)             │
│     // Access original via d->field            │
│ }                                              │
│ print_dev(&my_device);  // Just passes address │
└────────────────────────────────────────────────┘
```

**Pointer Arithmetic with Arrays:**

```
int arr[5] = {10, 20, 30, 40, 50};
int *ptr = arr;  // Points to first element

Memory Layout:
┌──────┬──────┬──────┬──────┬──────┐
│  10  │  20  │  30  │  40  │  50  │
└──────┴──────┴──────┴──────┴──────┘
0x1000 0x1004 0x1008 0x100C 0x1010
  ↑
  ptr

ptr + 0  → 0x1000  → *ptr = 10
ptr + 1  → 0x1004  → *(ptr+1) = 20
ptr + 2  → 0x1008  → *(ptr+2) = 30

Why +1 adds 4 bytes? Because sizeof(int) = 4
Pointer arithmetic automatically scales by element size!
```

**Common Mistakes:**

```
MISTAKE 1: Forgetting & when calling
─────────────────────────────────────
void modify(int *ptr) { *ptr = 10; }

int x = 5;
modify(x);    // WRONG: passing value, not address
modify(&x);   // CORRECT: passing address

MISTAKE 2: Using . instead of -> with pointers
──────────────────────────────────────────────
struct device *ptr = &dev;
ptr.id = 100;    // WRONG: ptr is pointer, use ->
ptr->id = 100;   // CORRECT: arrow for pointers

MISTAKE 3: Uninitialized pointer
────────────────────────────────
int *ptr;        // Contains garbage address!
*ptr = 10;       // CRASH: writing to random memory

int x;
int *ptr = &x;   // CORRECT: initialize first
*ptr = 10;       // Safe: ptr points to valid memory
```

# Code

```c
#include <linux/module.h>
#include <linux/kernel.h>

/* ===== BASIC POINTERS ===== */

int number = 42;
int *number_ptr = &number;

static void basic_pointer_demo(void) {
    printk(KERN_INFO "Value directly: %d\n", number);
    printk(KERN_INFO "Value via pointer: %d\n", *number_ptr);

    /* Modify through pointer - changes original! */
    *number_ptr = 100;
    printk(KERN_INFO "After *number_ptr = 100: %d\n", number);
}

/* ===== WHY FUNCTIONS NEED POINTERS ===== */

/* WITHOUT pointer - can't modify caller's variable */
static void bad_double(int x) {
    x = x * 2;  /* Only modifies local copy */
}

/* WITH pointer - modifies original variable */
static void good_double(int *ptr) {
    *ptr = *ptr * 2;  /* Modifies what ptr points to */
}

static void function_pointer_demo(void) {
    int val = 5;

    bad_double(val);
    printk(KERN_INFO "After bad_double: %d\n", val);   /* Still 5 */

    good_double(&val);  /* Pass address with & */
    printk(KERN_INFO "After good_double: %d\n", val);  /* Now 10 */
}

/* ===== STRUCTURE POINTERS ===== */

struct device_info {
    char name[32];
    int id;
    bool active;
};

struct device_info my_device = {
    .name = "sensor01",
    .id = 1001,
    .active = false
};

/* Takes pointer - efficient, can modify original */
static void print_device(struct device_info *dev) {
    /* Use -> because dev is a pointer */
    printk(KERN_INFO "Name: %s\n", dev->name);
    printk(KERN_INFO "ID: %d\n", dev->id);
    printk(KERN_INFO "Active: %d\n", dev->active);
}

static void activate_device(struct device_info *dev) {
    dev->active = true;  /* Modifies original struct */
    printk(KERN_INFO "Device %s activated\n", dev->name);
}

/* ===== ARRAY POINTER ARITHMETIC ===== */

int array[5] = {10, 20, 30, 40, 50};

static void array_pointer_demo(void) {
    int *ptr = array;  /* Points to first element */

    printk(KERN_INFO "*(ptr+0) = %d\n", *(ptr + 0));  /* 10 */
    printk(KERN_INFO "*(ptr+1) = %d\n", *(ptr + 1));  /* 20 */
    printk(KERN_INFO "*(ptr+2) = %d\n", *(ptr + 2));  /* 30 */
}

/* ===== MODULE INIT ===== */

static int __init pointer_demo_init(void) {
    printk(KERN_INFO "=== Pointer Demo ===\n");

    basic_pointer_demo();
    function_pointer_demo();

    printk(KERN_INFO "\n--- Structure Pointers ---\n");
    print_device(&my_device);     /* Pass address */
    activate_device(&my_device);  /* Modifies original */
    print_device(&my_device);     /* See changes */

    printk(KERN_INFO "\n--- Array Pointers ---\n");
    array_pointer_demo();

    return 0;
}

static void __exit pointer_demo_exit(void) {
    printk(KERN_INFO "Pointer demo unloaded\n");
}

module_init(pointer_demo_init);
module_exit(pointer_demo_exit);
MODULE_LICENSE("GPL");

/*
 * Summary:
 * ─────────────────────────────────────────────────
 * &var       → Get address of var
 * *ptr       → Get value at address ptr holds
 * ptr->field → Access struct member via pointer
 *
 * Function parameter int *ptr means:
 *   "I will receive an ADDRESS"
 *
 * Calling with &var means:
 *   "Here is the ADDRESS of my variable"
 *
 * This lets functions modify caller's variables!
 * ─────────────────────────────────────────────────
 */
```

# Exercises

1. Create a pointer to an integer and modify the integer through the pointer
2. Write a function that swaps two integers using pointers - why must it use pointers?
3. Access array elements using pointer arithmetic instead of indexing
4. Define a structure and write functions that modify it through pointers
5. Draw a memory diagram showing what happens when you pass &variable to a function
