import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';

const KernelCodeEditor = ({ 
    value, 
    onChange, 
    height = '500px', 
    theme = 'vs-dark',
    readOnly = false,
    placeholder = '',
    className = ''
}) => {
    const editorRef = useRef(null);

    // Handle editor mount
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Configure C language support with kernel-specific completions
        monaco.languages.registerCompletionItemProvider('c', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const suggestions = [
                    // Kernel Headers
                    {
                        label: '#include <linux/module.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/module.h>',
                        documentation: 'Essential header for kernel modules',
                        range: range
                    },
                    {
                        label: '#include <linux/kernel.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/kernel.h>',
                        documentation: 'Core kernel functions and macros',
                        range: range
                    },
                    {
                        label: '#include <linux/init.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/init.h>',
                        documentation: 'Module initialization and cleanup macros',
                        range: range
                    },
                    {
                        label: '#include <linux/fs.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/fs.h>',
                        documentation: 'File system operations and structures',
                        range: range
                    },
                    {
                        label: '#include <linux/device.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/device.h>',
                        documentation: 'Device driver framework',
                        range: range
                    },
                    {
                        label: '#include <linux/cdev.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/cdev.h>',
                        documentation: 'Character device operations',
                        range: range
                    },
                    {
                        label: '#include <linux/slab.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/slab.h>',
                        documentation: 'Memory allocation functions',
                        range: range
                    },
                    {
                        label: '#include <linux/uaccess.h>',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '#include <linux/uaccess.h>',
                        documentation: 'User space access functions',
                        range: range
                    },

                    // Module Macros
                    {
                        label: 'MODULE_LICENSE',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'MODULE_LICENSE("GPL");',
                        documentation: 'Specify module license (GPL, BSD, etc.)',
                        range: range
                    },
                    {
                        label: 'MODULE_AUTHOR',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'MODULE_AUTHOR("Your Name");',
                        documentation: 'Specify module author',
                        range: range
                    },
                    {
                        label: 'MODULE_DESCRIPTION',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'MODULE_DESCRIPTION("Module description");',
                        documentation: 'Provide module description',
                        range: range
                    },
                    {
                        label: 'MODULE_VERSION',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'MODULE_VERSION("1.0");',
                        documentation: 'Specify module version',
                        range: range
                    },

                    // Kernel Functions
                    {
                        label: 'printk',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'printk(KERN_INFO "message\\n");',
                        documentation: 'Kernel logging function',
                        range: range
                    },
                    {
                        label: 'kmalloc',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'kmalloc(size, GFP_KERNEL)',
                        documentation: 'Allocate kernel memory',
                        range: range
                    },
                    {
                        label: 'kfree',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'kfree(ptr);',
                        documentation: 'Free kernel memory',
                        range: range
                    },
                    {
                        label: 'kzalloc',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'kzalloc(size, GFP_KERNEL)',
                        documentation: 'Allocate and zero kernel memory',
                        range: range
                    },
                    {
                        label: 'copy_from_user',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'copy_from_user(to, from, size)',
                        documentation: 'Copy data from user space',
                        range: range
                    },
                    {
                        label: 'copy_to_user',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'copy_to_user(to, from, size)',
                        documentation: 'Copy data to user space',
                        range: range
                    },

                    // Module Init/Exit Templates
                    {
                        label: 'module_init_template',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'static int __init module_init_func(void) {',
                            '    printk(KERN_INFO "Module loaded\\n");',
                            '    return 0;',
                            '}',
                            '',
                            'module_init(module_init_func);'
                        ].join('\n'),
                        documentation: 'Complete module initialization function template',
                        range: range
                    },
                    {
                        label: 'module_exit_template',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'static void __exit module_exit_func(void) {',
                            '    printk(KERN_INFO "Module unloaded\\n");',
                            '}',
                            '',
                            'module_exit(module_exit_func);'
                        ].join('\n'),
                        documentation: 'Complete module exit function template',
                        range: range
                    },

                    // Character Device Functions
                    {
                        label: 'alloc_chrdev_region',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'alloc_chrdev_region(&dev, 0, 1, "device_name")',
                        documentation: 'Allocate character device region',
                        range: range
                    },
                    {
                        label: 'unregister_chrdev_region',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'unregister_chrdev_region(dev, count);',
                        documentation: 'Unregister character device region',
                        range: range
                    },
                    {
                        label: 'cdev_init',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'cdev_init(&cdev, &fops);',
                        documentation: 'Initialize character device',
                        range: range
                    },
                    {
                        label: 'cdev_add',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'cdev_add(&cdev, dev, 1)',
                        documentation: 'Add character device to system',
                        range: range
                    },
                    {
                        label: 'cdev_del',
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: 'cdev_del(&cdev);',
                        documentation: 'Remove character device from system',
                        range: range
                    },

                    // File Operations Template
                    {
                        label: 'file_operations_template',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'static struct file_operations device_fops = {',
                            '    .owner = THIS_MODULE,',
                            '    .open = device_open,',
                            '    .release = device_release,',
                            '    .read = device_read,',
                            '    .write = device_write,',
                            '    .llseek = default_llseek,',
                            '};'
                        ].join('\n'),
                        documentation: 'Complete file operations structure template',
                        range: range
                    },

                    // Log Levels
                    {
                        label: 'KERN_EMERG',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_EMERG',
                        documentation: 'Emergency messages - system is unusable',
                        range: range
                    },
                    {
                        label: 'KERN_ALERT',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_ALERT',
                        documentation: 'Alert messages - immediate action needed',
                        range: range
                    },
                    {
                        label: 'KERN_CRIT',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_CRIT',
                        documentation: 'Critical conditions',
                        range: range
                    },
                    {
                        label: 'KERN_ERR',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_ERR',
                        documentation: 'Error conditions',
                        range: range
                    },
                    {
                        label: 'KERN_WARNING',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_WARNING',
                        documentation: 'Warning conditions',
                        range: range
                    },
                    {
                        label: 'KERN_NOTICE',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_NOTICE',
                        documentation: 'Normal but significant conditions',
                        range: range
                    },
                    {
                        label: 'KERN_INFO',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_INFO',
                        documentation: 'Informational messages',
                        range: range
                    },
                    {
                        label: 'KERN_DEBUG',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'KERN_DEBUG',
                        documentation: 'Debug-level messages',
                        range: range
                    },

                    // Memory Allocation Flags
                    {
                        label: 'GFP_KERNEL',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'GFP_KERNEL',
                        documentation: 'Standard kernel memory allocation flag',
                        range: range
                    },
                    {
                        label: 'GFP_ATOMIC',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'GFP_ATOMIC',
                        documentation: 'Atomic memory allocation (no sleep)',
                        range: range
                    },
                    {
                        label: 'GFP_USER',
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: 'GFP_USER',
                        documentation: 'User space memory allocation',
                        range: range
                    },

                    // Complete Kernel Module Template
                    {
                        label: 'kernel_module_template',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '#include <linux/module.h>',
                            '#include <linux/kernel.h>',
                            '#include <linux/init.h>',
                            '',
                            'static int __init module_name_init(void) {',
                            '    printk(KERN_INFO "module_name: Module loaded\\n");',
                            '    return 0;',
                            '}',
                            '',
                            'static void __exit module_name_exit(void) {',
                            '    printk(KERN_INFO "module_name: Module unloaded\\n");',
                            '}',
                            '',
                            'module_init(module_name_init);',
                            'module_exit(module_name_exit);',
                            '',
                            'MODULE_LICENSE("GPL");',
                            'MODULE_AUTHOR("Your Name");',
                            'MODULE_DESCRIPTION("Module description");',
                            'MODULE_VERSION("1.0");'
                        ].join('\n'),
                        documentation: 'Complete basic kernel module template',
                        range: range
                    }
                ];

                return { suggestions: suggestions };
            }
        });

        // Configure Monaco editor settings
        editor.updateOptions({
            fontSize: 14,
            lineHeight: 20,
            fontFamily: 'Monaco, Consolas, "Ubuntu Mono", monospace',
            tabSize: 4,
            insertSpaces: false,
            automaticLayout: false, // FIXED: Disable automatic layout
            minimap: { enabled: true },
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            showFoldingControls: 'always',
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true
            }
        });

        // Set theme to dark for better coding experience
        monaco.editor.setTheme('vs-dark');

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            // Trigger save - you can emit an event here
            console.log('Save triggered');
        });

        // Enable error detection for C syntax
        monaco.languages.setLanguageConfiguration('c', {
            brackets: [
                ['{', '}'],
                ['[', ']'],
                ['(', ')']
            ],
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ],
            surroundingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"' },
                { open: "'", close: "'" }
            ]
        });
    };

    // Handle editor change
    const handleEditorChange = (value, event) => {
        if (onChange) {
            onChange(value);
        }
    };

    return (
        <div className={`kernel-code-editor relative ${className}`} style={{ isolation: 'isolate' }}>
            <Editor
                height={height}
                defaultLanguage="c"
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme={theme}
                loading={<div className="flex items-center justify-center h-96">
                    <div className="text-gray-500">Loading IntelliSense editor...</div>
                </div>}
                options={{
                    readOnly: readOnly,
                    selectOnLineNumbers: true,
                    matchBrackets: 'always',
                    autoIndent: 'full',
                    formatOnPaste: true,
                    formatOnType: true,
                    contextmenu: true,
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false
                    },
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    wordBasedSuggestions: true,
                    parameterHints: {
                        enabled: true
                    },
                    hover: {
                        enabled: true
                    }
                }}
            />
            {placeholder && !value && (
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                    {placeholder}
                </div>
            )}
        </div>
    );
};

export default KernelCodeEditor;