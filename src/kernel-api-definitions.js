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

// Kernel API functions with signatures and descriptions
export const KERNEL_FUNCTIONS = [
    {
        name: 'printk',
        signature: 'printk(KERN_INFO "message\\n");',
        description: 'Kernel logging function - use instead of printf',
        category: 'logging',
        params: ['log_level', 'format', '...']
    },
    {
        name: 'kmalloc',
        signature: 'kmalloc(size, GFP_KERNEL)',
        description: 'Allocate kernel memory - use instead of malloc',
        category: 'memory',
        params: ['size', 'flags']
    },
    {
        name: 'kfree',
        signature: 'kfree(ptr);',
        description: 'Free kernel memory - use instead of free',
        category: 'memory',
        params: ['ptr']
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
        signature: 'copy_from_user(to, from, size)',
        description: 'Copy data from user space to kernel space',
        category: 'userspace',
        params: ['to', 'from', 'size']
    },
    {
        name: 'copy_to_user',
        signature: 'copy_to_user(to, from, size)',
        description: 'Copy data from kernel space to user space',
        category: 'userspace',
        params: ['to', 'from', 'size']
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
    supportsErrorDetection: true
};

export default {
    KERNEL_HEADERS,
    KERNEL_FUNCTIONS,
    KERNEL_CONSTANTS,
    MODULE_MACROS,
    CODE_TEMPLATES,
    KERNEL_VIOLATIONS,
    BEST_PRACTICES,
    PLATFORM_INFO
};