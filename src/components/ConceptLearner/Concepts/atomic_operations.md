---
title: "Atomic Operations"
category: "Synchronization"
difficulty: "Advanced"
id: atomic_operations
relatedConcepts: ["memory_barriers", "lock_free", "smp", "race_conditions"]
---

# Description

Indivisible operations that cannot be interrupted or partially completed

# Explanation

Atomic operations ensure that complex operations appear as a single, indivisible unit to other CPUs.

**Why atomics are needed:**
- Multi-CPU systems can interleave operations
- Prevents race conditions without locks
- Lower overhead than mutexes for simple operations
- Essential for lock-free programming

**Types of atomic operations:**
- `atomic_t` - atomic integers
- `atomic64_t` - atomic 64-bit integers
- `atomic_long_t` - atomic longs
- Bitwise atomic operations
- Compare-and-swap operations

**Memory ordering:**
- Acquire semantics
- Release semantics
- Full memory barriers
- Relaxed ordering

# Code

```c
#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/init.h>
#include <linux/atomic.h>

// Global atomic counters
static atomic_t shared_counter = ATOMIC_INIT(0);
static atomic64_t large_counter = ATOMIC64_INIT(0);

static int __init atomic_demo_init(void) {
    // Basic atomic increment
    atomic_inc(&shared_counter);

    // Atomic add with return value
    int old_val = atomic_add_return(5, &shared_counter);
    printk(KERN_INFO "Counter after add: %d\n", old_val);

    // 64-bit atomic operations
    atomic64_inc(&large_counter);

    // Compare and swap example
    int expected = 6;
    int new_val = 10;

    if (atomic_cmpxchg(&shared_counter, expected, new_val) == expected) {
        printk(KERN_INFO "Compare-and-swap succeeded\n");
    }

    return 0;
}

static void __exit atomic_demo_exit(void) {
    printk(KERN_INFO "Final counter: %d\n", atomic_read(&shared_counter));
}

module_init(atomic_demo_init);
module_exit(atomic_demo_exit);
MODULE_LICENSE("GPL");
```

# Exercises

1. Implement lock-free counter using atomic operations
2. Create atomic reference counting system
3. Build compare-and-swap based stack
