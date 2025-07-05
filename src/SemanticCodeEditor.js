import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
    KERNEL_HEADERS, 
    KERNEL_FUNCTIONS, 
    KERNEL_CONSTANTS, 
    MODULE_MACROS, 
    CODE_TEMPLATES,
    KERNEL_VIOLATIONS,
    BEST_PRACTICES,
    PLATFORM_INFO
} from './kernel-api-definitions.js';

const SemanticCodeEditor = ({ 
    value, 
    onChange, 
    height = '500px', 
    theme = 'vs-dark',
    readOnly = false,
    placeholder = '',
    className = ''
}) => {
    const editorRef = useRef(null);
    const resizeListenerRef = useRef(null);

    // Cleanup resize listener on unmount
    useEffect(() => {
        return () => {
            if (resizeListenerRef.current) {
                window.removeEventListener('resize', resizeListenerRef.current);
            }
        };
    }, []);

    // Handle editor mount with semantic analysis
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // Enhanced C language support with kernel-specific completions
        monaco.languages.registerCompletionItemProvider('c', {
            triggerCharacters: [' ', '(', '<', '#', '*', 's', 'i', 'v'],
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const lineContent = model.getLineContent(position.lineNumber);
                const textBeforeCursor = lineContent.substring(0, position.column - 1);
                
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const suggestions = [];

                // Function signature completions
                if (textBeforeCursor.includes('static int ') || textBeforeCursor.includes('static void ')) {
                    suggestions.push(
                        {
                            label: '__init module_name_init(void)',
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: '__init ${1:module_name}_init(void) {\n\tprintk(KERN_INFO "${1:module_name}: Module loaded\\n");\n\treturn 0;\n}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Module initialization function template',
                            range: range
                        },
                        {
                            label: '__exit module_name_exit(void)',
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: '__exit ${1:module_name}_exit(void) {\n\tprintk(KERN_INFO "${1:module_name}: Module unloaded\\n");\n}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Module cleanup function template',
                            range: range
                        },
                        {
                            label: 'device_open(struct inode *, struct file *)',
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: '${1:device}_open(struct inode *inode, struct file *file) {\n\tprintk(KERN_INFO "${1:device}: Device opened\\n");\n\treturn 0;\n}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Character device open function',
                            range: range
                        },
                        {
                            label: 'device_release(struct inode *, struct file *)',
                            kind: monaco.languages.CompletionItemKind.Function,
                            insertText: '${1:device}_release(struct inode *inode, struct file *file) {\n\tprintk(KERN_INFO "${1:device}: Device closed\\n");\n\treturn 0;\n}',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Character device release function',
                            range: range
                        }
                    );
                }

                // Variable declaration completions
                if (textBeforeCursor.includes('static ') || textBeforeCursor.match(/^\s*(static\s+)?\w*\s*$/)) {
                    suggestions.push(
                        {
                            label: 'static int major_number = 0;',
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: 'static int major_number = 0;',
                            documentation: 'Major device number variable',
                            range: range
                        },
                        {
                            label: 'static struct class *device_class = NULL;',
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: 'static struct class *${1:device}_class = NULL;',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Device class pointer',
                            range: range
                        },
                        {
                            label: 'static struct device *device_struct = NULL;',
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: 'static struct device *${1:device}_struct = NULL;',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Device structure pointer',
                            range: range
                        },
                        {
                            label: 'static struct cdev device_cdev;',
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: 'static struct cdev ${1:device}_cdev;',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Character device structure',
                            range: range
                        },
                        {
                            label: 'static dev_t device_number;',
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: 'static dev_t ${1:device}_number;',
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            documentation: 'Device number variable',
                            range: range
                        }
                    );
                }

                // Include completions - Generated from kernel-api-definitions.js
                if (textBeforeCursor.includes('#include ')) {
                    const headerCompletions = KERNEL_HEADERS.map(header => ({
                        label: `#include <${header.name}>`,
                        kind: monaco.languages.CompletionItemKind.Module,
                        insertText: `#include <${header.name}>`,
                        documentation: `${header.description} (${header.category})`,
                        range: range
                    }));
                    suggestions.push(...headerCompletions);
                }

                // Universal kernel API completions - Generated from kernel-api-definitions.js
                if (!textBeforeCursor.includes('#include ')) {
                    // Generate function completions
                    const functionCompletions = KERNEL_FUNCTIONS.map(func => ({
                        label: func.name,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: func.signature,
                        insertTextRules: func.snippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                        documentation: `${func.description} (${func.category})`,
                        range: range
                    }));

                    // Generate constant completions
                    const constantCompletions = KERNEL_CONSTANTS.map(constant => ({
                        label: constant.name,
                        kind: monaco.languages.CompletionItemKind.Constant,
                        insertText: constant.name,
                        documentation: `${constant.description} (${constant.category})`,
                        range: range
                    }));

                    // Generate module macro completions
                    const macroCompletions = MODULE_MACROS.map(macro => ({
                        label: macro.name,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: macro.signature,
                        insertTextRules: macro.snippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                        documentation: `${macro.description} (${macro.category})`,
                        range: range
                    }));

                    // Generate code template completions
                    const templateCompletions = CODE_TEMPLATES.map(template => ({
                        label: template.name,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: template.content.join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: template.description,
                        range: range
                    }));

                    suggestions.push(...functionCompletions, ...constantCompletions, ...macroCompletions, ...templateCompletions);
                }

                return { suggestions: suggestions };
            }
        });

        // Universal cross-platform semantic validation for kernel development
        const validateKernelCode = (model) => {
            const diagnostics = [];
            const content = model.getValue();
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                const lineNumber = index + 1;
                
                // Check for kernel violations using definitions
                KERNEL_VIOLATIONS.forEach(violation => {
                    if (line.includes(violation.pattern) && !line.includes('//')) {
                        const severity = violation.severity === 'error' ? 
                            monaco.MarkerSeverity.Error : 
                            monaco.MarkerSeverity.Warning;
                        
                        const startColumn = line.indexOf(violation.pattern) + 1;
                        const endColumn = startColumn + violation.pattern.length;
                        
                        diagnostics.push({
                            severity,
                            startLineNumber: lineNumber,
                            startColumn,
                            endLineNumber: lineNumber,
                            endColumn,
                            message: violation.message,
                            code: `kernel-${violation.pattern.replace(/[^a-z0-9]/gi, '')}-${violation.severity}`
                        });
                    }
                });

                // Check for best practice violations using definitions
                BEST_PRACTICES.forEach(practice => {
                    if (line.includes(practice.pattern)) {
                        let hasRequirement = false;
                        
                        if (Array.isArray(practice.requirement)) {
                            hasRequirement = practice.requirement.some(req => content.includes(req));
                        } else {
                            hasRequirement = content.includes(practice.requirement);
                        }
                        
                        if (!hasRequirement) {
                            const severity = practice.severity === 'error' ? 
                                monaco.MarkerSeverity.Error : 
                                monaco.MarkerSeverity.Warning;
                            
                            diagnostics.push({
                                severity,
                                startLineNumber: lineNumber,
                                startColumn: 1,
                                endLineNumber: lineNumber,
                                endColumn: line.length + 1,
                                message: practice.message,
                                code: `kernel-practice-${practice.pattern.replace(/[^a-z0-9]/gi, '')}`
                            });
                        }
                    }
                });

                // Additional custom validations
                if (line.includes('MODULE_VERSION(') && !line.match(/MODULE_VERSION\("[\d\.]+"\)/)) {
                    diagnostics.push({
                        severity: monaco.MarkerSeverity.Info,
                        startLineNumber: lineNumber,
                        startColumn: line.indexOf('MODULE_VERSION(') + 1,
                        endLineNumber: lineNumber,
                        endColumn: line.indexOf('MODULE_VERSION(') + 15,
                        message: 'Use semantic versioning format (e.g., "1.0.0")',
                        code: 'kernel-version-format'
                    });
                }
            });

            return diagnostics;
        };

        // Register basic C language keywords and constructs
        monaco.languages.setLanguageConfiguration('c', {
            keywords: [
                'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
                'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
                'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
                'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
                'unsigned', 'void', 'volatile', 'while', '_Alignas', '_Alignof',
                '_Atomic', '_Static_assert', '_Noreturn', '_Thread_local', '_Generic',
                
                // Kernel specific
                '__init', '__exit', '__user', '__kernel', '__iomem', '__must_check',
                'EXPORT_SYMBOL', 'EXPORT_SYMBOL_GPL', 'module_init', 'module_exit',
                'MODULE_LICENSE', 'MODULE_AUTHOR', 'MODULE_DESCRIPTION', 'MODULE_VERSION'
            ],
            operators: [
                '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
                '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
                '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
                '%=', '<<=', '>>=', '>>>='
            ],
            symbols: /[=><!~?:&|+\-*\/\^%]+/,
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        });

        // Enhanced keyword completion provider
        monaco.languages.registerCompletionItemProvider('c', {
            triggerCharacters: ['s', 'i', 'v', 'c', 'f', 'w', 'r', 'u', 'd', 'e'],
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };

                const keywordSuggestions = [
                    { label: 'static', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'static ', documentation: 'Static storage class' },
                    { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int ', documentation: 'Integer type' },
                    { label: 'void', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'void ', documentation: 'Void type' },
                    { label: 'char', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'char ', documentation: 'Character type' },
                    { label: 'struct', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'struct ', documentation: 'Structure type' },
                    { label: 'const', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'const ', documentation: 'Constant qualifier' },
                    { label: 'return', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'return ', documentation: 'Return statement' },
                    { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n\t${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'If statement' },
                    { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (${1:int i = 0}; ${2:i < count}; ${3:i++}) {\n\t${4:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'For loop' },
                    { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while (${1:condition}) {\n\t${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'While loop' },
                ];

                return { suggestions: keywordSuggestions.map(s => ({ ...s, range })) };
            }
        });

        // Configure Monaco editor settings with responsive font size
        const updateEditorOptions = () => {
            const isMobile = window.innerWidth < 640; // sm breakpoint
            editor.updateOptions({
                fontSize: isMobile ? 11 : 14,
                lineHeight: isMobile ? 16 : 20,
                fontFamily: 'Monaco, Consolas, "Ubuntu Mono", monospace',
                tabSize: 4,
                insertSpaces: false,
                automaticLayout: true,
                minimap: { enabled: !isMobile },
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: true,
                folding: true,
                showFoldingControls: isMobile ? 'mouseover' : 'always',
                scrollBeyondLastLine: false,
                renderWhitespace: 'selection',
                bracketPairColorization: { enabled: true },
                guides: {
                    bracketPairs: true,
                    indentation: true
                },
                lineNumbersMinChars: isMobile ? 2 : 3,
                padding: { top: isMobile ? 8 : 12 }
            });

            // Mobile-specific touch and keyboard handling
            if (isMobile) {
                // Auto-focus on mobile to enable keyboard
                const editorContainer = editor.getDomNode();
                if (editorContainer) {
                    // Make the editor container touch-friendly
                    editorContainer.style.touchAction = 'manipulation';
                    
                    // Add touch event listener to ensure focus
                    const handleTouch = (e) => {
                        e.preventDefault();
                        editor.focus();
                        // Trigger virtual keyboard on mobile
                        const textArea = editorContainer.querySelector('textarea');
                        if (textArea) {
                            textArea.focus();
                            textArea.click();
                        }
                    };

                    editorContainer.addEventListener('touchstart', handleTouch, { passive: false });
                    editorContainer.addEventListener('click', handleTouch);
                }
            }
        };

        // Initial setup
        updateEditorOptions();

        // Listen for window resize to update editor options
        const resizeListener = () => updateEditorOptions();
        resizeListenerRef.current = resizeListener;
        window.addEventListener('resize', resizeListener);

        // Set theme
        monaco.editor.setTheme('vs-dark');

        // Mobile-specific styling
        const isMobile = window.innerWidth < 640;
        if (isMobile) {
            // Add mobile-friendly CSS directly to Monaco editor
            const style = document.createElement('style');
            style.textContent = `
                .monaco-editor .inputarea {
                    font-size: 16px !important; /* Prevents zoom on iOS */
                    -webkit-user-select: text !important;
                    user-select: text !important;
                }
                .monaco-editor .view-lines {
                    -webkit-tap-highlight-color: transparent;
                }
                .monaco-editor textarea {
                    opacity: 1 !important;
                    pointer-events: auto !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Enhanced language configuration for C
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

        // Trigger initial validation and show platform info
        setTimeout(() => {
            if (value) {
                const model = editor.getModel();
                if (model) {
                    const diagnostics = validateKernelCode(model);
                    monaco.editor.setModelMarkers(model, 'kernel-validator', diagnostics);
                }
            }
            
            // Log platform compatibility info (for debugging)
            if (PLATFORM_INFO.supportsIntelliSense) {
                console.log('🧠 Universal Kernel IntelliSense: Active (Platform-independent)');
                console.log(`📊 Platform: ${PLATFORM_INFO.isLinux ? 'Linux' : PLATFORM_INFO.isWindows ? 'Windows' : PLATFORM_INFO.isMacOS ? 'macOS' : 'Unknown'}`);
                console.log(`✨ Features: Autocomplete ✓, Error Detection ✓, Semantic Analysis ✓`);
            }
        }, 1000);
    };

    // Handle editor change with validation
    const handleEditorChange = (newValue, event) => {
        if (onChange) {
            onChange(newValue);
        }

        // Trigger validation on change
        setTimeout(() => {
            if (editorRef.current) {
                const model = editorRef.current.getModel();
                if (model && window.monaco) {
                    const validateKernelCode = (model) => {
                        const diagnostics = [];
                        const content = model.getValue();
                        const lines = content.split('\n');

                        lines.forEach((line, index) => {
                            const lineNumber = index + 1;
                            
                            // Check for common kernel development errors
                            if (line.includes('printf(') && !line.includes('//')) {
                                diagnostics.push({
                                    severity: window.monaco.MarkerSeverity.Error,
                                    startLineNumber: lineNumber,
                                    startColumn: line.indexOf('printf(') + 1,
                                    endLineNumber: lineNumber,
                                    endColumn: line.indexOf('printf(') + 7,
                                    message: 'Use printk() instead of printf() in kernel code',
                                    code: 'kernel-printf-error'
                                });
                            }

                            if (line.includes('malloc(') && !line.includes('//')) {
                                diagnostics.push({
                                    severity: window.monaco.MarkerSeverity.Error,
                                    startLineNumber: lineNumber,
                                    startColumn: line.indexOf('malloc(') + 1,
                                    endLineNumber: lineNumber,
                                    endColumn: line.indexOf('malloc(') + 7,
                                    message: 'Use kmalloc() instead of malloc() in kernel code',
                                    code: 'kernel-malloc-error'
                                });
                            }

                            if (line.includes('free(') && !line.includes('//')) {
                                diagnostics.push({
                                    severity: window.monaco.MarkerSeverity.Error,
                                    startLineNumber: lineNumber,
                                    startColumn: line.indexOf('free(') + 1,
                                    endLineNumber: lineNumber,
                                    endColumn: line.indexOf('free(') + 5,
                                    message: 'Use kfree() instead of free() in kernel code',
                                    code: 'kernel-free-error'
                                });
                            }

                            if (line.includes('#include <stdio.h>')) {
                                diagnostics.push({
                                    severity: window.monaco.MarkerSeverity.Error,
                                    startLineNumber: lineNumber,
                                    startColumn: 1,
                                    endLineNumber: lineNumber,
                                    endColumn: line.length + 1,
                                    message: 'stdio.h is not available in kernel space. Remove this include.',
                                    code: 'kernel-userspace-header'
                                });
                            }

                            if (line.includes('#include <stdlib.h>')) {
                                diagnostics.push({
                                    severity: window.monaco.MarkerSeverity.Error,
                                    startLineNumber: lineNumber,
                                    startColumn: 1,
                                    endLineNumber: lineNumber,
                                    endColumn: line.length + 1,
                                    message: 'stdlib.h is not available in kernel space. Remove this include.',
                                    code: 'kernel-userspace-header'
                                });
                            }
                        });

                        return diagnostics;
                    };
                    
                    const diagnostics = validateKernelCode(model);
                    window.monaco.editor.setModelMarkers(model, 'kernel-validator', diagnostics);
                }
            }
        }, 500);
    };

    return (
        <div 
            className={`semantic-code-editor relative ${className}`} 
            style={{ isolation: 'isolate' }}
            onClick={() => {
                // Ensure editor gets focus when clicked anywhere in the container
                if (editorRef.current) {
                    editorRef.current.focus();
                }
            }}
        >
            <Editor
                height={height}
                defaultLanguage="c"
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme={theme}
                loading={
                    <div className="flex items-center justify-center h-96">
                        <div className="text-gray-500">Loading Semantic Analysis...</div>
                    </div>
                }
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
                    quickSuggestionsDelay: 10,
                    suggestOnTriggerCharacters: true,
                    // Mobile-friendly options
                    accessibilitySupport: 'on',
                    ariaLabel: 'Kernel Code Editor',
                    domReadOnly: false,
                    links: true,
                    mouseWheelZoom: false,
                    smoothScrolling: true,
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    wordBasedSuggestions: true,
                    // Enhanced suggestion settings
                    suggest: {
                        showKeywords: true,
                        showSnippets: true,
                        showFunctions: true,
                        showVariables: true,
                        showTypeParameters: true,
                        showClasses: true,
                        showInterfaces: true,
                        showWords: true,
                        insertMode: 'insert'
                    },
                    parameterHints: {
                        enabled: true
                    },
                    hover: {
                        enabled: true
                    },
                    // Enhanced semantic features
                    semanticHighlighting: {
                        enabled: true
                    },
                    'semanticTokens.enable': true
                }}
            />
            {placeholder && !value && (
                <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                    {placeholder}
                </div>
            )}
            
            {/* Universal IntelliSense Status Indicator */}

        </div>
    );
};

export default SemanticCodeEditor;