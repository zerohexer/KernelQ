# Dynamic Vector Operations - Complete Visual Guide

## Table of Contents
1. [What is a Vector?](#what-is-a-vector)
2. [Vector vs Fixed Arrays](#vector-vs-fixed-arrays)
3. [Vector Structure Explained](#vector-structure-explained)
4. [Memory Layout](#memory-layout)
5. [Operation: Initialization](#operation-initialization)
6. [Operation: Add with Capacity Doubling](#operation-add-with-capacity-doubling)
7. [Operation: Get and Set](#operation-get-and-set)
8. [Operation: Delete with Element Shifting](#operation-delete-with-element-shifting)
9. [Operation: Resize Mechanics](#operation-resize-mechanics)
10. [Common Pitfalls and Solutions](#common-pitfalls-and-solutions)

---

## What is a Vector?

A **vector** is a **dynamic array** that automatically grows when you need more space.

### Key Concept:
```
Fixed Array:  [A][B][C][D]           <- Size NEVER changes
              Size = 4 (forever)

Vector:       [A][B][C][D]           <- Can grow!
              Size = 4 (for now)

              Add more items...

              [A][B][C][D][E][F][G][H]
              Size = 8 (doubled!)
```

### Why "Dynamic"?
- You don't need to know the size at compile time
- It grows automatically when full
- It can shrink to save memory when mostly empty

---

## Vector vs Fixed Arrays

### Fixed Array (Static)

```c
Device devices[5];    // Size fixed at compile time

// Problem 1: What if you need 6 devices?
devices[5] = new_device;  // CRASH! Out of bounds!

// Problem 2: What if you only use 2 devices?
// Waste: 3 unused entries taking memory
```

### Vector (Dynamic)

```c
vector v;
vector_init(&v);      // Starts at capacity 4

// No problem adding 6 items:
vector_add(&v, device1);  // total=1, capacity=4
vector_add(&v, device2);  // total=2, capacity=4
vector_add(&v, device3);  // total=3, capacity=4
vector_add(&v, device4);  // total=4, capacity=4
vector_add(&v, device5);  // total=5, capacity=8 (auto-doubled!)
vector_add(&v, device6);  // total=6, capacity=8

// No waste: only uses what it needs!
```

---

## Vector Structure Explained

```c
typedef struct vector {
    void **items;     // Pointer to array of pointers
    int capacity;     // Maximum slots available
    int total;        // Current number of items
} vector;
```

### Field Meanings:

**items**: Array of `void*` pointers (generic storage)
- Each slot holds a pointer to ANY type of data
- This is why vectors are generic

**capacity**: Maximum number of items before resize needed
- Tracks allocated space
- Example: capacity=8 means 8 slots allocated

**total**: Current number of actual items stored
- Tracks how many slots are in use
- Example: total=5 means 5 items stored

### Relationship Between Fields:

```
total <= capacity (always!)

Examples:
total=3, capacity=4   <- Vector has room for 1 more item
total=4, capacity=4   <- Vector is FULL (triggers resize on next add)
total=5, capacity=8   <- Vector has room for 3 more items
```

---

## Memory Layout

### Two Levels of Memory:

```
Level 1: The Vector Structure (on stack or heap)
┌─────────────────────────────┐
│ vector v                    │
│                             │
│  void **items   ───────┐   │
│  int capacity = 4      │   │
│  int total = 2         │   │
└────────────────────────│────┘
                         │
                         │
Level 2: Items Array (on heap, allocated with kmalloc)
                         │
                         └────────────────┐
                                          ▼
         ┌───────┬───────┬───────┬───────┐
         │ ptr0  │ ptr1  │ ptr2  │ ptr3  │
         └───┬───┴───┬───┴───────┴───────┘
             │       │
             │       └──────────────┐
             │                      │
             ▼                      ▼
         "first item"           "second item"
```

### Memory Addresses Example:

```
Stack/Heap (vector struct):
  v.items    = 0x7fff1234   (points to items array)
  v.capacity = 4
  v.total    = 2

Heap (items array at 0x7fff1234):
  items[0] = 0x7fff5000   (points to "first item")
  items[1] = 0x7fff5020   (points to "second item")
  items[2] = NULL         (unused slot)
  items[3] = NULL         (unused slot)

Heap (actual data):
  0x7fff5000: "first item"
  0x7fff5020: "second item"
```

---

## Operation: Initialization

### Code:
```c
vector v;
vector_init(&v);
```

### What Happens:

```
Step 1: Allocate vector structure
┌─────────────────────────────┐
│ vector v                    │
│  void **items   = ?         │
│  int capacity   = ?         │
│  int total      = ?         │
└─────────────────────────────┘

Step 2: Set initial values
┌─────────────────────────────┐
│ vector v                    │
│  void **items   = NULL      │
│  int capacity   = 4         │
│  int total      = 0         │
└─────────────────────────────┘

Step 3: Allocate items array (kmalloc)
┌─────────────────────────────┐
│ vector v                    │
│  void **items   ───────┐    │
│  int capacity   = 4    │    │
│  int total      = 0    │    │
└────────────────────────│────┘
                         │
                         ▼
         ┌──────┬──────┬──────┬──────┐
         │ NULL │ NULL │ NULL │ NULL │
         └──────┴──────┴──────┴──────┘
           [0]    [1]    [2]    [3]
```

### Memory Allocation:
```c
// Inside vector_init():
v->capacity = 4;
v->total = 0;
v->items = kmalloc(sizeof(void*) * 4, GFP_KERNEL);
//                  ^^^^^^^^^^^^^^^^
//                  4 pointers × 8 bytes = 32 bytes
```

---

## Operation: Add with Capacity Doubling

### Scenario: Add 5 items to a vector starting with capacity=4

#### Initial State (Empty):
```
capacity = 4, total = 0

┌──────┬──────┬──────┬──────┐
│ NULL │ NULL │ NULL │ NULL │
└──────┴──────┴──────┴──────┘
  [0]    [1]    [2]    [3]
```

#### After add #1: "first"
```
capacity = 4, total = 1

┌────────┬──────┬──────┬──────┐
│ "first"│ NULL │ NULL │ NULL │
└────────┴──────┴──────┴──────┘
   [0]     [1]    [2]    [3]

Code: vector_add(&v, "first");
Action: items[0] = "first"; total++;
```

#### After add #2: "second"
```
capacity = 4, total = 2

┌────────┬─────────┬──────┬──────┐
│ "first"│ "second"│ NULL │ NULL │
└────────┴─────────┴──────┴──────┘
   [0]      [1]      [2]    [3]

Code: vector_add(&v, "second");
Action: items[1] = "second"; total++;
```

#### After add #3: "third"
```
capacity = 4, total = 3

┌────────┬─────────┬────────┬──────┐
│ "first"│ "second"│ "third"│ NULL │
└────────┴─────────┴────────┴──────┘
   [0]      [1]      [2]     [3]

Code: vector_add(&v, "third");
Action: items[2] = "third"; total++;
```

#### After add #4: "fourth"
```
capacity = 4, total = 4  <- FULL!

┌────────┬─────────┬────────┬─────────┐
│ "first"│ "second"│ "third"│ "fourth"│
└────────┴─────────┴────────┴─────────┘
   [0]      [1]      [2]      [3]

Code: vector_add(&v, "fourth");
Action: items[3] = "fourth"; total++;
Status: capacity == total (vector is FULL!)
```

#### Add #5: "fifth" - TRIGGERS RESIZE!

##### Step 1: Detect full condition
```
Check: capacity (4) == total (4)?  YES!
Action: Need to resize before adding!
```

##### Step 2: Call vector_resize(v, 8)
```
Old capacity = 4, New capacity = 8

BEFORE RESIZE:
┌────────┬─────────┬────────┬─────────┐
│ "first"│ "second"│ "third"│ "fourth"│
└────────┴─────────┴────────┴─────────┘

AFTER RESIZE (krealloc):
┌────────┬─────────┬────────┬─────────┬──────┬──────┬──────┬──────┐
│ "first"│ "second"│ "third"│ "fourth"│ NULL │ NULL │ NULL │ NULL │
└────────┴─────────┴────────┴─────────┴──────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]      [4]    [5]    [6]    [7]

Old data preserved, new slots added!
```

##### Step 3: Add "fifth" to new slot
```
capacity = 8, total = 5

┌────────┬─────────┬────────┬─────────┬────────┬──────┬──────┬──────┐
│ "first"│ "second"│ "third"│ "fourth"│ "fifth"│ NULL │ NULL │ NULL │
└────────┴─────────┴────────┴─────────┴────────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]      [4]     [5]    [6]    [7]

Code: items[4] = "fifth"; total++;
```

### Complete Doubling Sequence:

```
Capacity Progression:
4 → 8 → 16 → 32 → 64 → 128 → ...

When it happens:
capacity=4,  total=4   → Add 5th item → Resize to 8
capacity=8,  total=8   → Add 9th item → Resize to 16
capacity=16, total=16  → Add 17th item → Resize to 32
```

### Why Double (Not +1 or +10)?

```
Strategy 1: Increase by 1 each time
Add 1000 items = 1000 resizes!
Cost: O(n²) - VERY SLOW

Strategy 2: Increase by 10 each time
Add 1000 items = 100 resizes
Cost: Still expensive

Strategy 3: Double each time (×2)
Add 1000 items = ~10 resizes (log₂(1000) ≈ 10)
Cost: O(n) amortized - FAST!

Doubling gives O(1) amortized time per add operation.
```

---

## Operation: Get and Set

### Get Operation: vector_get(&v, index)

```
Vector state:
capacity = 8, total = 5

┌────────┬─────────┬────────┬─────────┬────────┬──────┬──────┬──────┐
│ "first"│ "second"│ "third"│ "fourth"│ "fifth"│ NULL │ NULL │ NULL │
└────────┴─────────┴────────┴─────────┴────────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]      [4]     [5]    [6]    [7]

Valid indices: 0, 1, 2, 3, 4 (total=5)
Invalid indices: 5, 6, 7 (beyond total), -1 (negative)

Examples:
vector_get(&v, 2)   → "third"  ✓ (index < total)
vector_get(&v, 5)   → NULL     ✓ (index >= total, return NULL)
vector_get(&v, -1)  → NULL     ✓ (negative index, return NULL)
```

### Set Operation: vector_set(&v, index, item)

```
Before: vector_set(&v, 1, "MODIFIED")

┌────────┬─────────┬────────┬─────────┬────────┐
│ "first"│ "second"│ "third"│ "fourth"│ "fifth"│
└────────┴─────────┴────────┴─────────┴────────┘
   [0]      [1]      [2]      [3]      [4]

After: items[1] = "MODIFIED"

┌────────┬───────────┬────────┬─────────┬────────┐
│ "first"│ "MODIFIED"│ "third"│ "fourth"│ "fifth"│
└────────┴───────────┴────────┴─────────┴────────┘
   [0]       [1]       [2]      [3]      [4]

Important: Can only set EXISTING indices (0 to total-1)
vector_set(&v, 10, "new")  → ERROR (index >= total)
```

### Bounds Checking Diagram:

```
total = 5, capacity = 8

                    total
                      ↓
┌────┬────┬────┬────┬────┬────┬────┬────┐
│ OK │ OK │ OK │ OK │ OK │ NO │ NO │ NO │
└────┴────┴────┴────┴────┴────┴────┴────┘
  0    1    2    3    4    5    6    7
  ↑                   ↑              ↑
Valid range      First invalid   capacity-1
(0 to total-1)
```

---

## Operation: Delete with Element Shifting

### Scenario: Delete index 1 from a vector with 5 items

#### Initial State:
```
capacity = 8, total = 5

┌────────┬─────────┬────────┬─────────┬────────┬──────┬──────┬──────┐
│ "first"│ "second"│ "third"│ "fourth"│ "fifth"│ NULL │ NULL │ NULL │
└────────┴─────────┴────────┴─────────┴────────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]      [4]     [5]    [6]    [7]
            DELETE
            THIS!
```

#### Step 1: Mark deletion target
```
Code: vector_delete(&v, 1);

Target index: 1 ("second")
Need to shift: [2], [3], [4] to the left
```

#### Step 2: Shift elements left
```
Iteration 1: i=1
items[1] = items[2];   // "third" moves to index 1

┌────────┬────────┬────────┬─────────┬────────┬──────┬──────┬──────┐
│ "first"│ "third"│ "third"│ "fourth"│ "fifth"│ NULL │ NULL │ NULL │
└────────┴────────┴────────┴─────────┴────────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]      [4]     [5]    [6]    [7]
                   (duplicate)

Iteration 2: i=2
items[2] = items[3];   // "fourth" moves to index 2

┌────────┬────────┬─────────┬─────────┬────────┬──────┬──────┬──────┐
│ "first"│ "third"│ "fourth"│ "fourth"│ "fifth"│ NULL │ NULL │ NULL │
└────────┴────────┴─────────┴─────────┴────────┴──────┴──────┴──────┘
   [0]      [1]      [2]       [3]      [4]     [5]    [6]    [7]
                              (duplicate)

Iteration 3: i=3
items[3] = items[4];   // "fifth" moves to index 3

┌────────┬────────┬─────────┬────────┬────────┬──────┬──────┬──────┐
│ "first"│ "third"│ "fourth"│ "fifth"│ "fifth"│ NULL │ NULL │ NULL │
└────────┴────────┴─────────┴────────┴────────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]      [4]     [5]    [6]    [7]
                                      (duplicate)

Loop ends: i=4, condition i < total-1 (4 < 4) is FALSE
```

#### Step 3: Clear old last position
```
items[total-1] = NULL;   // items[4] = NULL

┌────────┬────────┬─────────┬────────┬──────┬──────┬──────┬──────┐
│ "first"│ "third"│ "fourth"│ "fifth"│ NULL │ NULL │ NULL │ NULL │
└────────┴────────┴─────────┴────────┴──────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]     [4]    [5]    [6]    [7]

Old duplicate at [4] is now cleared
```

#### Step 4: Decrement total
```
total--;   // total becomes 4

capacity = 8, total = 4

┌────────┬────────┬─────────┬────────┬──────┬──────┬──────┬──────┐
│ "first"│ "third"│ "fourth"│ "fifth"│ NULL │ NULL │ NULL │ NULL │
└────────┴────────┴─────────┴────────┴──────┴──────┴──────┴──────┘
   [0]      [1]      [2]      [3]     [4]    [5]    [6]    [7]
                                   ↑
                              total=4

Deletion complete! "second" is gone, all elements shifted left.
```

### Delete Algorithm Code:

```c
int vector_delete(vector *v, int index) {
    // Step 1: Bounds check
    if (index < 0 || index >= v->total)
        return VECTOR_ERROR;

    // Step 2: Shift elements left
    for (int i = index; i < v->total - 1; i++) {
        v->items[i] = v->items[i + 1];
    }

    // Step 3: Clear old last position
    v->items[v->total - 1] = NULL;

    // Step 4: Decrement total
    v->total--;

    return VECTOR_SUCCESS;
}
```

### Multiple Deletes Example:

```
Start: total=5
┌────────┬────────┬─────────┬────────┬────────┐
│   A    │   B    │    C    │   D    │   E    │
└────────┴────────┴─────────┴────────┴────────┘
   [0]     [1]      [2]      [3]      [4]

Delete index 1 (B): total=4
┌────────┬─────────┬────────┬────────┬──────┐
│   A    │    C    │   D    │   E    │ NULL │
└────────┴─────────┴────────┴────────┴──────┘
   [0]      [1]      [2]      [3]     [4]

Delete index 2 (D): total=3
┌────────┬─────────┬────────┬──────┬──────┐
│   A    │    C    │   E    │ NULL │ NULL │
└────────┴─────────┴────────┴──────┴──────┘
   [0]      [1]      [2]     [3]    [4]

Delete index 0 (A): total=2
┌─────────┬────────┬──────┬──────┬──────┐
│    C    │   E    │ NULL │ NULL │ NULL │
└─────────┴────────┴──────┴──────┴──────┘
    [0]     [1]     [2]    [3]    [4]
```

---

## Operation: Resize Mechanics

### When Resize Happens:

**Expansion**: When vector is full (capacity == total) and you try to add
**Shrinking** (optional): When vector is 25% full (total == capacity/4)

### Resize Implementation with krealloc:

```c
static int vector_resize(vector *v, int new_capacity) {
    // Calculate new size in bytes
    size_t new_size = sizeof(void*) * new_capacity;

    // Use krealloc to resize
    void **new_items = krealloc(v->items, new_size, GFP_KERNEL);

    // Check if successful
    if (!new_items) {
        return VECTOR_ERROR;  // Allocation failed!
    }

    // Update vector fields
    v->items = new_items;
    v->capacity = new_capacity;

    return VECTOR_SUCCESS;
}
```

### What krealloc Does:

```
Before: v->items points to old 4-slot array
┌──────┬──────┬──────┬──────┐
│  A   │  B   │  C   │  D   │
└──────┴──────┴──────┴──────┘
  0x1000 (old address)

Call: krealloc(v->items, sizeof(void*) * 8, GFP_KERNEL)

krealloc process:
1. Allocate new 8-slot array at new address
2. Copy old 4 items to new array
3. Free old 4-slot array
4. Return pointer to new 8-slot array

After: v->items points to new 8-slot array
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  A   │  B   │  C   │  D   │ NULL │ NULL │ NULL │ NULL │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
  0x2000 (new address)

Old data preserved! Address may change!
```

### Capacity Doubling in Action:

```
Initial: capacity=4, total=0
┌──────┬──────┬──────┬──────┐
│ NULL │ NULL │ NULL │ NULL │
└──────┴──────┴──────┴──────┘

Add items until full: total=4
┌──────┬──────┬──────┬──────┐
│  A   │  B   │  C   │  D   │
└──────┴──────┴──────┴──────┘

Add 5th item: Resize 4 → 8
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  A   │  B   │  C   │  D   │  E   │ NULL │ NULL │ NULL │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
capacity=8, total=5

Continue adding: total=8
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  A   │  B   │  C   │  D   │  E   │  F   │  G   │  H   │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

Add 9th item: Resize 8 → 16
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│  A   │  B   │  C   │  D   │  E   │  F   │  G   │  H   │  I   │ NULL │ NULL │ NULL │ NULL │ NULL │ NULL │ NULL │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
capacity=16, total=9
```

### Capacity Shrinking (Optional Feature):

```
Start: capacity=16, total=16 (100% full)
┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┐
│ A │ B │ C │ D │ E │ F │ G │ H │ I │ J │ K │ L │ M │ N │ O │ P │
└───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘

Delete many items: capacity=16, total=8 (50% full)
┌───┬───┬───┬───┬───┬───┬───┬───┬────┬────┬────┬────┬────┬────┬────┬────┐
│ A │ B │ C │ D │ E │ F │ G │ H │NULL│NULL│NULL│NULL│NULL│NULL│NULL│NULL│
└───┴───┴───┴───┴───┴───┴───┴───┴────┴────┴────┴────┴────┴────┴────┴────┘
No shrink yet (not 25% full)

Delete more: capacity=16, total=4 (25% full)
┌───┬───┬───┬───┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ A │ B │ C │ D │NULL│NULL│NULL│NULL│NULL│NULL│NULL│NULL│NULL│NULL│NULL│NULL│
└───┴───┴───┴───┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
Trigger shrink! 25% full

Shrink 16 → 8: capacity=8, total=4 (50% full)
┌───┬───┬───┬───┬────┬────┬────┬────┐
│ A │ B │ C │ D │NULL│NULL│NULL│NULL│
└───┴───┴───┴───┴────┴────┴────┴────┘
Memory saved! Efficiency restored.

Why 25% threshold?
- Prevents thrashing (repeated resize up/down)
- Maintains good memory efficiency
- Gives headroom before next expansion
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Accessing Out-of-Bounds Index

```
WRONG:
capacity = 8, total = 3

┌───┬───┬───┬────┬────┬────┬────┬────┐
│ A │ B │ C │NULL│NULL│NULL│NULL│NULL│
└───┴───┴───┴────┴────┴────┴────┴────┘

char *item = vector_get(&v, 5);  // index 5 is beyond total!
// Returns NULL, but some code doesn't check!
printf("%s", item);  // CRASH! NULL pointer dereference

CORRECT:
char *item = vector_get(&v, 5);
if (item == NULL) {
    printf("Index out of bounds!\n");
    return;
}
printf("%s", item);  // Safe
```

### Pitfall 2: Forgetting to Check Allocation Failure

```
WRONG:
vector v;
vector_init(&v);  // What if this fails?
vector_add(&v, "data");  // CRASH if init failed!

CORRECT:
vector v;
if (vector_init(&v) != VECTOR_SUCCESS) {
    printk(KERN_ERR "Failed to initialize vector\n");
    return -ENOMEM;
}
vector_add(&v, "data");  // Safe now
```

### Pitfall 3: Memory Leak - Not Freeing Items

```
WRONG:
vector v;
vector_init(&v);

for (int i = 0; i < 100; i++) {
    char *str = kmalloc(64, GFP_KERNEL);  // Allocate string
    sprintf(str, "Item %d", i);
    vector_add(&v, str);  // Add to vector
}

vector_free(&v);  // LEAK! Only frees items array, not the strings!

CORRECT:
for (int i = 0; i < vector_total(&v); i++) {
    char *str = vector_get(&v, i);
    kfree(str);  // Free each string first
}
vector_free(&v);  // Now free the vector
```

### Pitfall 4: Using After Free

```
WRONG:
vector v;
vector_init(&v);
vector_add(&v, "data");
vector_free(&v);

char *item = vector_get(&v, 0);  // CRASH! v.items is NULL now
printf("%s", item);

CORRECT:
vector v;
vector_init(&v);
vector_add(&v, "data");

char *item = vector_get(&v, 0);  // Get BEFORE freeing
printf("%s", item);

vector_free(&v);  // Free at the end
```

### Pitfall 5: Modifying During Iteration

```
WRONG:
for (int i = 0; i < vector_total(&v); i++) {
    if (some_condition) {
        vector_delete(&v, i);  // Deletes shift elements!
        // i++ will skip an element after shift!
    }
}

CORRECT Method 1: Iterate backwards
for (int i = vector_total(&v) - 1; i >= 0; i--) {
    if (some_condition) {
        vector_delete(&v, i);  // Safe: no elements skipped
    }
}

CORRECT Method 2: Don't increment when deleting
for (int i = 0; i < vector_total(&v); ) {
    if (some_condition) {
        vector_delete(&v, i);  // Don't increment i
    } else {
        i++;  // Only increment when not deleting
    }
}
```

---

## Summary Cheat Sheet

```
Operation          Time Complexity    Space Used
-------------------------------------------------
vector_init        O(1)               capacity × sizeof(void*)
vector_add         O(1) amortized     + data pointed to
vector_get         O(1)               No extra space
vector_set         O(1)               No extra space
vector_delete      O(n)               No extra space
vector_free        O(1)               Frees all

Key Rules:
1. Always check return codes (VECTOR_SUCCESS / VECTOR_ERROR)
2. Always check if vector_get returns NULL
3. Free your data before freeing the vector
4. Don't use vector after vector_free
5. Capacity doubles when full (4→8→16→32...)
6. Capacity can shrink when 25% full (optional)
7. Delete shifts all elements after deleted index
8. Get/Set only work on indices 0 to total-1
```

---

## Practice Understanding Check

Before you start coding, make sure you understand:

1. What is the difference between `capacity` and `total`?
2. Why does capacity double instead of increasing by 1?
3. What happens to elements after a delete operation?
4. What does krealloc do when resizing?
5. Why must you check bounds in get and set operations?
6. What memory must you free when cleaning up a vector?
7. When does automatic resizing happen?
8. Why use void pointers (void**) instead of a specific type?

If you can answer these, you're ready to implement the vector!
