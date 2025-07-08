/**
 * Universal Kernel API Definitions
 * Platform-independent kernel API definitions for IntelliSense
 * Works on Windows, macOS, and Linux without any dependencies
 */

// Core kernel headers with descriptions
export const KERNEL_HEADERS = [
    {
        name: 'linux/module.h',
        description: 'Essential header for kernel modules',
        category: 'core'
    },
    {
        name: 'linux/kernel.h',
        description: 'Core kernel functions and macros',
        category: 'core'
    },
    {
        name: 'linux/init.h',
        description: 'Module initialization and cleanup macros',
        category: 'core'
    },
    {
        name: 'linux/fs.h',
        description: 'File system operations and structures',
        category: 'filesystem'
    },
    {
        name: 'linux/cdev.h',
        description: 'Character device operations',
        category: 'devices'
    },
    {
        name: 'linux/device.h',
        description: 'Device driver framework',
        category: 'devices'
    },
    {
        name: 'linux/slab.h',
        description: 'Memory allocation functions',
        category: 'memory'
    },
    {
        name: 'linux/uaccess.h',
        description: 'User space access functions',
        category: 'userspace'
    },
    {
        name: 'linux/mutex.h',
        description: 'Mutex synchronization primitives',
        category: 'synchronization'
    },
    {
        name: 'linux/spinlock.h',
        description: 'Spinlock synchronization primitives',
        category: 'synchronization'
    },
    {
        name: 'linux/interrupt.h',
        description: 'Interrupt handling functions',
        category: 'interrupts'
    },
    {
        name: 'linux/wait.h',
        description: 'Wait queue functions',
        category: 'synchronization'
    },
    {
        name: 'linux/proc_fs.h',
        description: 'Proc filesystem interface',
        category: 'filesystem'
    },
    {
        name: 'linux/seq_file.h',
        description: 'Sequential file interface',
        category: 'filesystem'
    },
    {
        name: 'linux/workqueue.h',
        description: 'Work queue functions',
        category: 'scheduling'
    },
    {
        name: 'linux/timer.h',
        description: 'Timer functions',
        category: 'time'
    },
    {
        name: 'linux/jiffies.h',
        description: 'Jiffies and time functions',
        category: 'time'
    },
    {
        name: 'linux/pci.h',
        description: 'PCI device support',
        category: 'devices'
    },
    {
        name: 'linux/usb.h',
        description: 'USB device support',
        category: 'devices'
    },
    {
        name: 'linux/gpio.h',
        description: 'GPIO functions',
        category: 'hardware'
    }
];

// --- UPGRADED KERNEL_FUNCTIONS STRUCTURE ---
export const KERNEL_FUNCTIONS = [
    {
        name: 'printk',
        // Monaco snippet syntax. ${1:label} is a placeholder.
        signature: 'printk(KERN_INFO "${1:Your message here}\\n");',
        description: 'Prints a message to the kernel log buffer. The kernel equivalent of printf.',
        category: 'logging',
        // Detailed parameters for signature help
        params: [
            { label: 'log_level', documentation: 'e.g., KERN_INFO, KERN_ERR. Concatenated with the format string.' },
            { label: 'fmt', documentation: 'The format string, similar to printf.' },
            { label: '...', documentation: 'Variable arguments for the format string.' }
        ],
        // Set to true to use snippet insertion
        snippet: true
    },
    {
        name: 'kmalloc',
        signature: 'kmalloc(${1:size}, ${2:GFP_KERNEL});',
        description: 'Allocates a block of physically contiguous memory.',
        category: 'memory',
        params: [
            { label: 'size_t size', documentation: 'The number of bytes to allocate.' },
            { label: 'gfp_t flags', documentation: 'Allocation flags, e.g., GFP_KERNEL (can sleep) or GFP_ATOMIC (cannot sleep).' }
        ],
        snippet: true
    },
    {
        name: 'kfree',
        signature: 'kfree(${1:ptr});',
        description: 'Free kernel memory - use instead of free',
        category: 'memory',
        params: [
            { label: 'void *ptr', documentation: 'Pointer to memory allocated with kmalloc/kzalloc.' }
        ],
        snippet: true
    },
    {
        name: 'kzalloc',
        signature: 'kzalloc(size, GFP_KERNEL)',
        description: 'Allocate and zero kernel memory',
        category: 'memory',
        params: ['size', 'flags']
    },
    {
        name: 'vmalloc',
        signature: 'vmalloc(size)',
        description: 'Allocate virtually contiguous memory',
        category: 'memory',
        params: ['size']
    },
    {
        name: 'vfree',
        signature: 'vfree(ptr);',
        description: 'Free memory allocated by vmalloc',
        category: 'memory',
        params: ['ptr']
    },
    {
        name: 'copy_from_user',
        signature: 'copy_from_user(${1:to}, ${2:from}, ${3:size})',
        description: 'Copy data from user space to kernel space',
        category: 'userspace',
        params: [
            { label: 'void *to', documentation: 'Destination in kernel space.' },
            { label: 'const void __user *from', documentation: 'Source in user space.' },
            { label: 'unsigned long size', documentation: 'Number of bytes to copy.' }
        ],
        snippet: true
    },
    {
        name: 'copy_to_user',
        signature: 'copy_to_user(${1:to}, ${2:from}, ${3:size})',
        description: 'Copy data from kernel space to user space',
        category: 'userspace',
        params: [
            { label: 'void __user *to', documentation: 'Destination in user space.' },
            { label: 'const void *from', documentation: 'Source in kernel space.' },
            { label: 'unsigned long size', documentation: 'Number of bytes to copy.' }
        ],
        snippet: true
    },
    {
        name: 'alloc_chrdev_region',
        signature: 'alloc_chrdev_region(&dev, 0, 1, "device_name")',
        description: 'Allocate character device region',
        category: 'devices',
        params: ['dev', 'baseminor', 'count', 'name']
    },
    {
        name: 'cdev_init',
        signature: 'cdev_init(&cdev, &fops);',
        description: 'Initialize character device',
        category: 'devices',
        params: ['cdev', 'fops']
    },
    {
        name: 'cdev_add',
        signature: 'cdev_add(&cdev, dev, 1)',
        description: 'Add character device to system',
        category: 'devices',
        params: ['cdev', 'dev', 'count']
    },
    {
        name: 'mutex_init',
        signature: 'mutex_init(&${1:mutex});',
        description: 'Initialize a mutex',
        category: 'synchronization',
        params: ['mutex'],
        snippet: true
    },
    {
        name: 'mutex_lock',
        signature: 'mutex_lock(&${1:mutex});',
        description: 'Lock a mutex',
        category: 'synchronization',
        params: ['mutex'],
        snippet: true
    },
    {
        name: 'mutex_unlock',
        signature: 'mutex_unlock(&${1:mutex});',
        description: 'Unlock a mutex',
        category: 'synchronization',
        params: ['mutex'],
        snippet: true
    },
    {
        name: 'snprintf',
        signature: 'snprintf(buf, size, format, ...)',
        description: 'Safe string formatting - use instead of sprintf',
        category: 'string',
        params: ['buf', 'size', 'format', '...']
    },
    {
        name: 'strscpy',
        signature: 'strscpy(dest, src, size)',
        description: 'Safe string copy - use instead of strcpy',
        category: 'string',
        params: ['dest', 'src', 'size']
    }
];

// --- NEW: KERNEL DATA TYPES ---
export const KERNEL_TYPES = [
    { name: 'struct file_operations', description: 'Defines the operations a character device can perform.', category: 'devices' },
    { name: 'struct cdev', description: 'Represents a character device within the kernel.', category: 'devices' },
    { name: 'struct pci_dev', description: 'Represents a PCI device.', category: 'pci' },
    { name: 'struct list_head', description: 'The core structure for the kernel\'s circular, doubly-linked lists.', category: 'data_structures' },
    { name: 'struct proc_dir_entry', description: 'Represents an entry in the proc filesystem.', category: 'filesystem' },
    { name: 'struct seq_file', description: 'Sequential file interface for proc entries.', category: 'filesystem' },
    { name: 'struct work_struct', description: 'Work queue structure for deferred work.', category: 'scheduling' },
    { name: 'struct timer_list', description: 'Kernel timer structure.', category: 'time' },
    { name: 'struct mutex', description: 'Mutex synchronization primitive.', category: 'synchronization' },
    { name: 'spinlock_t', description: 'The data type for a spinlock.', category: 'synchronization' },
    { name: 'atomic_t', description: 'An integer type used for atomic operations.', category: 'synchronization' },
    { name: 'wait_queue_head_t', description: 'Wait queue head for blocking operations.', category: 'synchronization' },
    { name: 'struct device', description: 'Generic device structure.', category: 'devices' },
    { name: 'struct class', description: 'Device class structure.', category: 'devices' },
    { name: 'struct inode', description: 'In-memory representation of a file system inode.', category: 'filesystem' },
    { name: 'struct file', description: 'Represents an open file.', category: 'filesystem' },
    { name: 'struct page', description: 'Represents a page of physical memory.', category: 'memory' },
    { name: 'gfp_t', description: 'Type for GFP (Get Free Pages) flags used in memory allocation.', category: 'memory' },
    { name: 'size_t', description: 'Type for representing sizes and counts.', category: 'basic_types' },
    { name: 'loff_t', description: 'Type for file offsets (64-bit).', category: 'filesystem' },
    { name: 'dev_t', description: 'Type for device numbers (major/minor).', category: 'devices' },
    { name: 'umode_t', description: 'Type for file permissions and modes.', category: 'filesystem' },
    { name: 'struct task_struct', description: 'Process/task control block.', category: 'processes' },
    { name: 'struct module', description: 'Kernel module structure.', category: 'module' },
    { name: 'struct kobject', description: 'Base kernel object for sysfs.', category: 'sysfs' }
];

// Kernel constants and macros
export const KERNEL_CONSTANTS = [
    {
        name: 'KERN_INFO',
        description: 'Informational messages',
        category: 'logging'
    },
    {
        name: 'KERN_ERR',
        description: 'Error conditions',
        category: 'logging'
    },
    {
        name: 'KERN_WARNING',
        description: 'Warning conditions',
        category: 'logging'
    },
    {
        name: 'KERN_DEBUG',
        description: 'Debug messages',
        category: 'logging'
    },
    {
        name: 'KERN_CRIT',
        description: 'Critical conditions',
        category: 'logging'
    },
    {
        name: 'GFP_KERNEL',
        description: 'Standard kernel memory allocation flag',
        category: 'memory'
    },
    {
        name: 'GFP_ATOMIC',
        description: 'Atomic memory allocation (no sleep)',
        category: 'memory'
    },
    {
        name: 'GFP_USER',
        description: 'User memory allocation flag',
        category: 'memory'
    },
    {
        name: 'THIS_MODULE',
        description: 'Pointer to current module',
        category: 'module'
    },
    {
        name: 'EXPORT_SYMBOL',
        description: 'Export symbol for use by other modules',
        category: 'module'
    },
    {
        name: 'EXPORT_SYMBOL_GPL',
        description: 'Export symbol for GPL-only modules',
        category: 'module'
    }
];

// Module macros
export const MODULE_MACROS = [
    {
        name: 'MODULE_LICENSE',
        signature: 'MODULE_LICENSE("GPL");',
        description: 'Specify module license (GPL, BSD, etc.)',
        category: 'module'
    },
    {
        name: 'MODULE_AUTHOR',
        signature: 'MODULE_AUTHOR("Your Name");',
        description: 'Specify module author',
        category: 'module'
    },
    {
        name: 'MODULE_DESCRIPTION',
        signature: 'MODULE_DESCRIPTION("Module description");',
        description: 'Provide module description',
        category: 'module'
    },
    {
        name: 'MODULE_VERSION',
        signature: 'MODULE_VERSION("1.0.0");',
        description: 'Specify module version',
        category: 'module'
    },
    {
        name: 'module_init',
        signature: 'module_init(${1:init_function});',
        description: 'Register module initialization function',
        category: 'module',
        snippet: true
    },
    {
        name: 'module_exit',
        signature: 'module_exit(${1:exit_function});',
        description: 'Register module cleanup function',
        category: 'module',
        snippet: true
    }
];

// Code templates
export const CODE_TEMPLATES = [
    {
        name: 'kernel_module_template',
        description: 'Complete basic kernel module template',
        content: [
            '#include <linux/module.h>',
            '#include <linux/kernel.h>',
            '#include <linux/init.h>',
            '',
            'static int __init ${1:module}_init(void) {',
            '    printk(KERN_INFO "${1:module}: Module loaded\\n");',
            '    return 0;',
            '}',
            '',
            'static void __exit ${1:module}_exit(void) {',
            '    printk(KERN_INFO "${1:module}: Module unloaded\\n");',
            '}',
            '',
            'module_init(${1:module}_init);',
            'module_exit(${1:module}_exit);',
            '',
            'MODULE_LICENSE("GPL");',
            'MODULE_AUTHOR("${2:Your Name}");',
            'MODULE_DESCRIPTION("${3:Module description}");',
            'MODULE_VERSION("${4:1.0.0}");'
        ]
    },
    {
        name: 'chardev_template',
        description: 'Character device file operations template',
        content: [
            'static struct file_operations ${1:device}_fops = {',
            '    .owner = THIS_MODULE,',
            '    .open = ${1:device}_open,',
            '    .release = ${1:device}_release,',
            '    .read = ${1:device}_read,',
            '    .write = ${1:device}_write,',
            '    .llseek = default_llseek,',
            '};'
        ]
    },
    {
        name: 'proc_entry_template',
        description: 'Proc filesystem entry template',
        content: [
            'static int ${1:name}_proc_show(struct seq_file *m, void *v) {',
            '    seq_printf(m, "${2:Hello from %s}\\n", "${1:name}");',
            '    return 0;',
            '}',
            '',
            'static int ${1:name}_proc_open(struct inode *inode, struct file *file) {',
            '    return single_open(file, ${1:name}_proc_show, NULL);',
            '}',
            '',
            'static const struct proc_ops ${1:name}_proc_fops = {',
            '    .proc_open = ${1:name}_proc_open,',
            '    .proc_read = seq_read,',
            '    .proc_lseek = seq_lseek,',
            '    .proc_release = single_release,',
            '};'
        ]
    }
];

// Common kernel programming violations
export const KERNEL_VIOLATIONS = [
    {
        pattern: 'printf(',
        replacement: 'printk(KERN_INFO "message\\n");',
        message: 'Use printk() instead of printf() in kernel code',
        severity: 'error'
    },
    {
        pattern: 'malloc(',
        replacement: 'kmalloc(size, GFP_KERNEL)',
        message: 'Use kmalloc() instead of malloc() in kernel code',
        severity: 'error'
    },
    {
        pattern: 'free(',
        replacement: 'kfree(ptr);',
        message: 'Use kfree() instead of free() in kernel code',
        severity: 'error'
    },
    {
        pattern: 'sprintf(',
        replacement: 'snprintf(buf, size, format, ...)',
        message: 'Use snprintf() or scnprintf() instead of sprintf() in kernel code',
        severity: 'error'
    },
    {
        pattern: 'strcpy(',
        replacement: 'strscpy(dest, src, size)',
        message: 'Consider using strscpy() instead of strcpy() for better security',
        severity: 'warning'
    },
    {
        pattern: '#include <stdio.h>',
        replacement: '',
        message: 'stdio.h is not available in kernel space. Remove this include.',
        severity: 'error'
    },
    {
        pattern: '#include <stdlib.h>',
        replacement: '',
        message: 'stdlib.h is not available in kernel space. Remove this include.',
        severity: 'error'
    },
    {
        pattern: '#include <string.h>',
        replacement: '',
        message: 'string.h is not available in kernel space. Use kernel string functions.',
        severity: 'error'
    }
];

// Best practices and warnings
export const BEST_PRACTICES = [
    {
        pattern: 'module_init(',
        requirement: 'MODULE_LICENSE',
        message: 'Missing MODULE_LICENSE declaration. Add MODULE_LICENSE("GPL");',
        severity: 'warning'
    },
    {
        pattern: 'kmalloc(',
        requirement: ['if (', 'if('],
        message: 'Always check kmalloc() return value for NULL',
        severity: 'warning'
    },
    {
        pattern: 'static int major',
        requirement: '= 0',
        message: 'Initialize major number to 0 for dynamic allocation',
        severity: 'warning'
    }
];

// === COMPREHENSIVE FUNCTION SIGNATURES & PATTERNS ===
// Based on CMake kernel development configuration
export const FUNCTION_SIGNATURES = [
    // Static function declarations (most common in kernel modules)
    {
        name: 'static int',
        signature: 'static int ${1:function_name}(${2:void}) {\n\t${3:return 0;}\n}',
        description: 'Static integer function declaration',
        category: 'declarations',
        snippet: true
    },
    {
        name: 'static void',
        signature: 'static void ${1:function_name}(${2:void}) {\n\t${3:/* implementation */}\n}',
        description: 'Static void function declaration',
        category: 'declarations',
        snippet: true
    },
    {
        name: 'static long',
        signature: 'static long ${1:function_name}(${2:void}) {\n\t${3:return 0;}\n}',
        description: 'Static long function declaration',
        category: 'declarations',
        snippet: true
    },
    {
        name: 'static ssize_t',
        signature: 'static ssize_t ${1:function_name}(${2:struct file *file, char __user *buf, size_t count, loff_t *pos}) {\n\t${3:return count;}\n}',
        description: 'Static ssize_t function (typical for read/write operations)',
        category: 'declarations',
        snippet: true
    },
    {
        name: 'static int __init',
        signature: 'static int __init ${1:module_name}_init(void) {\n\tprintk(KERN_INFO "${1:module_name}: Module loaded\\n");\n\treturn 0;\n}',
        description: 'Module initialization function',
        category: 'module',
        snippet: true
    },
    {
        name: 'static void __exit',
        signature: 'static void __exit ${1:module_name}_exit(void) {\n\tprintk(KERN_INFO "${1:module_name}: Module unloaded\\n");\n}',
        description: 'Module cleanup function',
        category: 'module',
        snippet: true
    },
    // Variable declarations
    {
        name: 'static struct',
        signature: 'static struct ${1:type} ${2:variable_name};',
        description: 'Static structure variable declaration',
        category: 'declarations',
        snippet: true
    },
    {
        name: 'struct file_operations',
        signature: 'static struct file_operations ${1:device_name}_fops = {\n\t.owner = THIS_MODULE,\n\t.open = ${1:device_name}_open,\n\t.release = ${1:device_name}_release,\n\t.read = ${1:device_name}_read,\n\t.write = ${1:device_name}_write,\n\t.llseek = default_llseek,\n};',
        description: 'File operations structure for character devices',
        category: 'devices',
        snippet: true
    },
    {
        name: 'static dev_t',
        signature: 'static dev_t ${1:device_name}_dev;',
        description: 'Device number variable',
        category: 'devices',
        snippet: true
    },
    {
        name: 'static struct cdev',
        signature: 'static struct cdev ${1:device_name}_cdev;',
        description: 'Character device structure',
        category: 'devices',
        snippet: true
    },
    {
        name: 'static struct class',
        signature: 'static struct class *${1:device_name}_class;',
        description: 'Device class pointer',
        category: 'devices',
        snippet: true
    },
    {
        name: 'static struct mutex',
        signature: 'static struct mutex ${1:mutex_name};',
        description: 'Mutex declaration',
        category: 'synchronization',
        snippet: true
    },
    // Common kernel patterns
    {
        name: 'if (IS_ERR',
        signature: 'if (IS_ERR(${1:ptr})) {\n\treturn PTR_ERR(${1:ptr});\n}',
        description: 'Error checking pattern for kernel pointers',
        category: 'error_handling',
        snippet: true
    },
    {
        name: 'unlikely',
        signature: 'if (unlikely(${1:condition})) {\n\t${2:/* error handling */}\n}',
        description: 'Unlikely condition optimization',
        category: 'optimization',
        snippet: true
    },
    {
        name: 'likely',
        signature: 'if (likely(${1:condition})) {\n\t${2:/* normal path */}\n}',
        description: 'Likely condition optimization',
        category: 'optimization',
        snippet: true
    }
];

// === CMAKE-DERIVED KERNEL DEFINITIONS ===
// Based on actual kernel headers and CMake configuration
export const CMAKE_KERNEL_DEFS = {
    // Standard kernel defines from CMake
    defines: [
        '__KERNEL__',
        'MODULE',
        'KBUILD_BASENAME="kernel_module"',
        'KBUILD_MODNAME="kernel_module"',
        'CONFIG_X86_64=1',
        'CONFIG_64BIT=1',
        'CONFIG_MMU=1',
        'CONFIG_MODULES=1',
        'CONFIG_PRINTK=1',
        'CONFIG_PROC_FS=1',
        'CONFIG_SYSFS=1'
    ],
    
    // Compiler flags for accurate syntax
    cflags: [
        '-D__KERNEL__',
        '-DMODULE',
        '-std=gnu89',
        '-Wall',
        '-Wundef',
        '-Wstrict-prototypes',
        '-Wno-trigraphs',
        '-fno-strict-aliasing',
        '-fno-common',
        '-fshort-wchar',
        '-Werror-implicit-function-declaration',
        '-Wno-format-security',
        '-O2'
    ],
    
    // Include paths that would be available
    includePaths: [
        '/lib/modules/$(KERNEL_VERSION)/build/include',
        '/lib/modules/$(KERNEL_VERSION)/build/arch/x86/include',
        '/lib/modules/$(KERNEL_VERSION)/build/arch/x86/include/generated',
        '/lib/modules/$(KERNEL_VERSION)/source/include'
    ],
    
    // Standard kernel types with size info
    standardTypes: [
        { name: 'u8', size: 1, description: 'Unsigned 8-bit integer' },
        { name: 'u16', size: 2, description: 'Unsigned 16-bit integer' },
        { name: 'u32', size: 4, description: 'Unsigned 32-bit integer' },
        { name: 'u64', size: 8, description: 'Unsigned 64-bit integer' },
        { name: 's8', size: 1, description: 'Signed 8-bit integer' },
        { name: 's16', size: 2, description: 'Signed 16-bit integer' },
        { name: 's32', size: 4, description: 'Signed 32-bit integer' },
        { name: 's64', size: 8, description: 'Signed 64-bit integer' },
        { name: 'size_t', size: 8, description: 'Size type (64-bit on x86_64)' },
        { name: 'ssize_t', size: 8, description: 'Signed size type' },
        { name: 'loff_t', size: 8, description: 'File offset type' },
        { name: 'dev_t', size: 4, description: 'Device number type' },
        { name: 'gfp_t', size: 4, description: 'GFP flags type' },
        { name: 'umode_t', size: 2, description: 'File mode type' }
    ]
};

// === COMPREHENSIVE AUTOCOMPLETE DATA ===
// Everything needed for perfect IntelliSense without external dependencies
export const AUTOCOMPLETE_DATA = {
    // Common kernel programming patterns
    patterns: [
        'static int ${1:name}(${2:void})',
        'static void ${1:name}(${2:void})',
        'static long ${1:name}(${2:void})',
        'static ssize_t ${1:name}(${2:params})',
        'if (${1:condition}) {',
        'for (${1:init}; ${2:condition}; ${3:increment}) {',
        'while (${1:condition}) {',
        'switch (${1:expression}) {',
        'struct ${1:name} {',
        'union ${1:name} {',
        'enum ${1:name} {',
        'typedef ${1:type} ${2:name};'
    ],
    
    // Keywords with descriptions
    keywords: [
        { name: 'static', description: 'Static storage class' },
        { name: 'extern', description: 'External linkage' },
        { name: 'inline', description: 'Inline function hint' },
        { name: 'volatile', description: 'Volatile qualifier' },
        { name: 'const', description: 'Constant qualifier' },
        { name: 'restrict', description: 'Restrict qualifier' },
        { name: 'typeof', description: 'Type of expression' },
        { name: '__init', description: 'Initialization section' },
        { name: '__exit', description: 'Exit section' },
        { name: '__user', description: 'User space pointer' },
        { name: '__kernel', description: 'Kernel space pointer' },
        { name: '__iomem', description: 'I/O memory pointer' },
        { name: '__force', description: 'Force type conversion' },
        { name: '__must_check', description: 'Return value must be checked' },
        { name: '__weak', description: 'Weak symbol' },
        { name: '__aligned', description: 'Alignment specification' },
        { name: '__packed', description: 'Packed structure' },
        { name: '__deprecated', description: 'Deprecated function' },
        { name: '__noreturn', description: 'Function never returns' },
        { name: '__pure', description: 'Pure function' },
        { name: '__cold', description: 'Cold function' },
        { name: '__hot', description: 'Hot function' }
    ],
    
    // Standard library replacements
    standardReplacements: [
        { from: 'printf', to: 'printk', reason: 'Kernel logging function' },
        { from: 'malloc', to: 'kmalloc', reason: 'Kernel memory allocation' },
        { from: 'free', to: 'kfree', reason: 'Kernel memory deallocation' },
        { from: 'sprintf', to: 'snprintf', reason: 'Safe string formatting' },
        { from: 'strcpy', to: 'strscpy', reason: 'Safe string copy' },
        { from: 'strcat', to: 'strncat', reason: 'Safe string concatenation' },
        { from: 'memcpy', to: 'memcpy', reason: 'Available in kernel' },
        { from: 'memset', to: 'memset', reason: 'Available in kernel' },
        { from: 'strlen', to: 'strlen', reason: 'Available in kernel' },
        { from: 'strcmp', to: 'strcmp', reason: 'Available in kernel' },
        { from: 'strncmp', to: 'strncmp', reason: 'Available in kernel' }
    ]
};

// Platform detection (for optional features)
export const PLATFORM_INFO = {
    isLinux: typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('linux'),
    isWindows: typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('win'),
    isMacOS: typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac'),
    
    // All platforms support IntelliSense
    supportsIntelliSense: true,
    
    // Optional: Real compilation support (requires backend)
    supportsCompilation: false, // This would be determined by backend availability
    
    // Browser-based features always available
    supportsSemanticAnalysis: true,
    supportsCodeCompletion: true,
    supportsErrorDetection: true,
    
    // CMake-based features
    supportsCMakeIntegration: true,
    supportsAdvancedSyntax: true
};

export default {
    KERNEL_HEADERS,
    KERNEL_FUNCTIONS,
    KERNEL_TYPES,
    KERNEL_CONSTANTS,
    MODULE_MACROS,
    CODE_TEMPLATES,
    KERNEL_VIOLATIONS,
    BEST_PRACTICES,
    FUNCTION_SIGNATURES,
    CMAKE_KERNEL_DEFS,
    AUTOCOMPLETE_DATA,
    PLATFORM_INFO
};