/**
 * CodeMirror 6 Kernel Development Editor with clangd LSP Support
 * Replaces SemanticCodeEditor with proper language server integration
 */

import React, { useRef, useEffect, useState } from 'react';
import useIsMobile from '../../hooks/useIsMobile';
import {
    EditorView,
    highlightSpecialChars,
    drawSelection,
    highlightActiveLine,
    keymap,
    lineNumbers,
    rectangularSelection,
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import {
    indentOnInput,
    indentUnit,
    bracketMatching,
    foldGutter,
    foldKeymap,
    defaultHighlightStyle,
    syntaxHighlighting,
    HighlightStyle,
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import {
    defaultKeymap,
    indentWithTab,
    history,
    historyKeymap,
} from '@codemirror/commands';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import {
    completionKeymap,
    closeBrackets,
    closeBracketsKeymap,
} from '@codemirror/autocomplete';
import { lintKeymap } from '@codemirror/lint';
import { cpp } from '@codemirror/lang-cpp';

// Import our kernel-specific autocomplete data
import {
    KERNEL_FUNCTIONS,
    KERNEL_TYPES,
    KERNEL_CONSTANTS,
    MODULE_MACROS,
    KERNEL_HEADERS,
    AUTOCOMPLETE_DATA,
    KERNEL_VIOLATIONS,
    BEST_PRACTICES
} from '../../data/kernel-api-definitions.js';

const CodeMirrorKernelEditor = ({
    value = '',
    onChange,
    height = '500px',
    theme = 'dark',
    readOnly = false,
    placeholder = '',
    className = '',
    enableLSP = false,
    lspServerUri = null,
    documentUri = 'file:///kernel/main.c',
    sessionId = 'default',
    allFiles = [],
    fileContents = {},
    initialScrollTop = 0,
    onScrollChange = null
}) => {
    const containerRef = useRef(null);
    const editorRef = useRef(null);
    const lspClientRef = useRef(null);
    const syncedFilesRef = useRef(new Set());
    const [status, setStatus] = useState('initializing');
    const [error, setError] = useState(null);
    const isMobile = useIsMobile();

    // Theme compartment for dynamic theme switching
    const themeCompartment = new Compartment();

    // Filter source files that should be sent to clangd (exclude Makefile and other non-source files)
    const getSourceFiles = (files) => {
        return files.filter(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            const name = file.name.toLowerCase();
            
            // Include C/C++ source and header files
            if (['c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx'].includes(ext)) {
                return true;
            }
            
            // Exclude Makefile and other build files
            if (name === 'makefile' || name.startsWith('makefile.') || 
                ['mk', 'make', 'cmake'].includes(ext)) {
                return false;
            }
            
            return false;
        });
    };

    // Sync all source files with the LSP server via WebSocket
    const syncAllFilesWithLSP = (ws, files, fileContents) => {
        if (!ws || ws.readyState !== WebSocket.OPEN || !files || files.length === 0) return;
        
        const sourceFiles = getSourceFiles(files);
        console.log('🔄 Syncing', sourceFiles.length, 'source files with clangd...');
        
        sourceFiles.forEach((file, index) => {
            const fileUri = `file:///kernel-${sessionId}/${file.name}`;
            const content = fileContents[file.name] || file.content || '';
            
            try {
                // Check if file is already synced
                if (!syncedFilesRef.current.has(fileUri)) {
                    // Send textDocument/didOpen via WebSocket
                    console.log('📤 Opening file in LSP:', file.name);
                    const didOpenMessage = {
                        jsonrpc: '2.0',
                        method: 'textDocument/didOpen',
                        params: {
                            textDocument: {
                                uri: fileUri,
                                languageId: 'c',
                                version: 1,
                                text: content
                            }
                        }
                    };
                    ws.send(JSON.stringify(didOpenMessage));
                    syncedFilesRef.current.add(fileUri);
                } else {
                    // Send textDocument/didChange via WebSocket
                    console.log('🔄 Updating file in LSP:', file.name);
                    const didChangeMessage = {
                        jsonrpc: '2.0',
                        method: 'textDocument/didChange',
                        params: {
                            textDocument: {
                                uri: fileUri,
                                version: Date.now() // Use timestamp as version
                            },
                            contentChanges: [{
                                text: content
                            }]
                        }
                    };
                    ws.send(JSON.stringify(didChangeMessage));
                }
            } catch (error) {
                console.warn('⚠️ Failed to sync file with LSP:', file.name, error);
            }
        });
        
        console.log('✅ All files synced with clangd');
    };

    // Create kernel-specific autocompletion source
    const createKernelCompletions = () => {
        return (context) => {
            const word = context.matchBefore(/\w*/);
            if (!word) return null;

            const currentWord = word.text.toLowerCase();
            const suggestions = [];

            // Add kernel functions with higher priority
            KERNEL_FUNCTIONS.forEach(func => {
                const matchScore = func.name.toLowerCase().includes(currentWord) ? 10 : 0;
                suggestions.push({
                    label: func.name,
                    type: 'function',
                    detail: func.description,
                    info: func.signature,
                    boost: matchScore,
                    apply: func.signature && func.snippet ? func.signature : func.name
                });
            });

            // Add kernel types
            KERNEL_TYPES.forEach(type => {
                const matchScore = type.name.toLowerCase().includes(currentWord) ? 8 : 0;
                suggestions.push({
                    label: type.name,
                    type: 'type',
                    detail: type.description,
                    boost: matchScore
                });
            });

            // Add kernel constants
            [...KERNEL_CONSTANTS, ...MODULE_MACROS].forEach(constant => {
                const matchScore = constant.name.toLowerCase().includes(currentWord) ? 7 : 0;
                suggestions.push({
                    label: constant.name,
                    type: 'constant',
                    detail: constant.description,
                    boost: matchScore,
                    apply: constant.signature || constant.name
                });
            });

            // Add kernel headers for #include context
            const lineContent = context.state.doc.lineAt(context.pos).text;
            if (lineContent.trim().startsWith('#include')) {
                KERNEL_HEADERS.forEach(header => {
                    const matchScore = header.name.toLowerCase().includes(currentWord) ? 6 : 0;
                    suggestions.push({
                        label: `<${header.name}>`,
                        type: 'module',
                        detail: header.description,
                        boost: matchScore
                    });
                });
            }

            // Add keywords
            AUTOCOMPLETE_DATA.keywords.forEach(keyword => {
                const matchScore = keyword.name.toLowerCase().includes(currentWord) ? 5 : 0;
                suggestions.push({
                    label: keyword.name,
                    type: 'keyword',
                    detail: keyword.description,
                    boost: matchScore
                });
            });

            return {
                from: word.from,
                options: suggestions.sort((a, b) => (b.boost || 0) - (a.boost || 0))
            };
        };
    };

    // Create kernel-specific linting
    const createKernelLinter = () => {
        return (view) => {
            const diagnostics = [];
            const content = view.state.doc.toString();
            const lines = content.split('\n');

            lines.forEach((line, lineIndex) => {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('#')) return;

                // Check for kernel violations
                KERNEL_VIOLATIONS.forEach(violation => {
                    if (typeof violation.pattern === 'string') {
                        const index = line.indexOf(violation.pattern);
                        if (index !== -1) {
                            const from = view.state.doc.line(lineIndex + 1).from + index;
                            const to = from + violation.pattern.length;
                            diagnostics.push({
                                from,
                                to,
                                severity: violation.severity === 'error' ? 'error' : 'warning',
                                message: violation.message
                            });
                        }
                    }
                });

                // Check best practices
                BEST_PRACTICES.forEach(practice => {
                    if (line.includes(practice.pattern)) {
                        const requirementMet = Array.isArray(practice.requirement) ?
                            practice.requirement.some(req => content.includes(req)) :
                            content.includes(practice.requirement);

                        if (!requirementMet) {
                            const index = line.indexOf(practice.pattern);
                            const from = view.state.doc.line(lineIndex + 1).from + index;
                            const to = from + practice.pattern.length;
                            diagnostics.push({
                                from,
                                to,
                                severity: 'warning',
                                message: practice.message
                            });
                        }
                    }
                });
            });

            return diagnostics;
        };
    };

    useEffect(() => {
        let mounted = true;

        const initializeEditor = async () => {
            try {
                if (!containerRef.current) return;

                setStatus('loading');
                console.log('🚀 Initializing CodeMirror Kernel Editor...');

                // Import LSP if enabled
                let lspExtensions = [];
                if (enableLSP && lspServerUri) {
                    try {
                        setStatus('loading-lsp');
                        const { languageServer, ClangdInitializationOptions } = await import('codemirror-languageserver');
                        
                        console.log('🔗 Connecting to clangd server at:', lspServerUri);
                        
                        // Prepare all source files for the LSP connection
                        const sourceFiles = getSourceFiles(allFiles || []);
                        const allDocumentUris = sourceFiles.map(file => `file:///kernel/${file.name}`);
                        
                        console.log('📁 Initializing LSP with documents:', allDocumentUris);
                        
                        lspExtensions = languageServer({
                            serverUri: lspServerUri,
                            allowHTMLContent: true,
                            rootUri: `file:///kernel-${sessionId}`,
                            workspaceFolders: [
                                {
                                    name: `kernel-${sessionId}`,
                                    uri: `file:///kernel-${sessionId}`,
                                },
                            ],
                            documentUri: documentUri,
                            languageId: 'c',
                            initializationOptions: {
                                // Kernel-specific clangd configuration
                                fallbackFlags: [
                                    '-D__KERNEL__',
                                    '-DMODULE', 
                                    '-DKBUILD_BASENAME="kernel_module"',
                                    '-DKBUILD_MODNAME="kernel_module"',
                                    '-std=gnu89',
                                    '-Wall',
                                    '-Wundef', 
                                    '-Wstrict-prototypes',
                                    '-fno-strict-aliasing',
                                    '-fno-common',
                                    '-fshort-wchar',
                                    '-Werror-implicit-function-declaration',
                                    '-O2',
                                    // Kernel include paths that clangd will resolve
                                    '-I/usr/src/linux/include',
                                    '-I/usr/src/linux/arch/x86/include',
                                    '-I/usr/src/linux/arch/x86/include/generated'
                                ],
                                clangdFileStatus: true,
                                completion: {
                                    detailedLabel: true,
                                    allScopes: true,
                                },
                                hover: {
                                    showAKA: true,
                                },
                                inlayHints: {
                                    enabled: true,
                                    parameterNames: true,
                                    deducedTypes: true,
                                },
                                semanticHighlighting: true,
                                diagnostics: {
                                    unusedIncludes: 'Strict',
                                    missingIncludes: 'Strict',
                                    clangTidy: true,
                                }
                            }
                        });
                        
                        // Set up file synchronization after LSP is ready
                        setTimeout(() => {
                            console.log('🔧 Setting up multi-file synchronization');
                            
                            // Create WebSocket for file sync
                            const syncWs = new WebSocket(lspServerUri);
                            
                            syncWs.onopen = () => {
                                console.log('🔗 File sync WebSocket connected');
                                lspClientRef.current = syncWs;
                                
                                // Sync all files immediately
                                syncAllFilesWithLSP(syncWs, allFiles, fileContents);
                            };
                            
                            syncWs.onerror = (error) => {
                                console.warn('⚠️ File sync WebSocket error:', error);
                            };
                            
                            syncWs.onclose = () => {
                                console.log('🔌 File sync WebSocket closed');
                                lspClientRef.current = null;
                            };
                        }, 1500); // Wait for main LSP to initialize
                        
                        console.log('✅ Clangd LSP extensions loaded successfully');
                    } catch (lspError) {
                        console.warn('⚠️ Clangd LSP failed to load, falling back to local features:', lspError);
                        // Don't set error here, just fall back to local features
                    }
                }

                // Setup autocompletion based on LSP availability
                const { autocompletion } = await import('@codemirror/autocomplete');
                let autocompletionExtensions = [];
                
                if (lspExtensions.length === 0) {
                    // No LSP available, use local kernel completions
                    console.log('🔧 Using local kernel autocompletion');
                    autocompletionExtensions.push(autocompletion({
                        override: [createKernelCompletions()]
                    }));
                } else {
                    // LSP is available, it will handle completions
                    console.log('🔗 Using LSP autocompletion with kernel fallback');
                    // LSP extensions already include autocompletion
                }

                // Setup local linting (disabled when LSP is available)
                const { linter } = await import('@codemirror/lint');
                const localLinter = lspExtensions.length > 0 ? [] : linter(createKernelLinter());

                setStatus('creating-editor');

                // VS Code-inspired C/C++ syntax highlighting
                const kernelHighlightStyle = HighlightStyle.define([
                    // Keywords (if, else, for, while, return, etc.)
                    { tag: [t.keyword, t.controlKeyword], color: '#569cd6' },
                    // Type keywords (int, char, void, struct, etc.)
                    { tag: [t.typeName, t.className], color: '#4ec9b0' },
                    // Function names
                    { tag: [t.function(t.variableName), t.function(t.propertyName)], color: '#dcdcaa' },
                    // Variable names
                    { tag: [t.variableName, t.propertyName], color: '#9cdcfe' },
                    // Numbers
                    { tag: [t.number, t.integer, t.float], color: '#b5cea8' },
                    // Strings
                    { tag: [t.string], color: '#ce9178' },
                    // Characters
                    { tag: [t.character], color: '#ce9178' },
                    // Comments
                    { tag: [t.comment, t.blockComment, t.lineComment], color: '#6a9955', fontStyle: 'italic' },
                    // Preprocessor directives (#include, #define, etc.)
                    { tag: [t.processingInstruction, t.macroName], color: '#c586c0' },
                    // Operators
                    { tag: [t.operator, t.punctuation], color: '#d4d4d4' },
                    // Parentheses, brackets, braces
                    { tag: [t.paren, t.bracket, t.brace], color: '#ffd700' },
                    // Constants and defines
                    { tag: [t.constant(t.name), t.standard(t.name)], color: '#4fc1ff' },
                    // Kernel-specific: module macros, kernel types
                    { tag: [t.modifier], color: '#c586c0' },
                    // Invalid/error highlighting
                    { tag: [t.invalid], color: '#f44747', textDecoration: 'underline' }
                ]);

                const extensions = [
                    lineNumbers(),
                    highlightSpecialChars(),
                    history(),
                    foldGutter(),
                    drawSelection(),
                    EditorState.allowMultipleSelections.of(true),
                    indentOnInput(),
                    indentUnit.of('    '), // 4-space indentation (user preference)
                    EditorState.tabSize.of(4), // Tab width: 4 spaces
                    syntaxHighlighting(kernelHighlightStyle, { fallback: true }),
                    bracketMatching(),
                    closeBrackets(),
                    rectangularSelection(),
                    highlightActiveLine(),
                    highlightSelectionMatches(),
                    keymap.of([
                        ...closeBracketsKeymap,
                        ...defaultKeymap,
                        indentWithTab,
                        ...searchKeymap,
                        ...historyKeymap,
                        ...foldKeymap,
                        ...completionKeymap,
                        ...lintKeymap,
                    ]),
                    cpp(), // C/C++ language support
                    ...autocompletionExtensions, // Conditional autocomplete
                    localLinter, // Always include local linting
                    ...lspExtensions, // LSP extensions (if available)
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged && onChange && !readOnly) {
                            onChange(update.state.doc.toString());
                        }
                    }),
                    EditorView.theme({
                        // Main editor container
                        '&': {
                            height: '100%',
                            fontSize: isMobile ? '9px' : '15px',
                            fontFamily: 'Fira Code, Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                            backgroundColor: '#1e1e1e',
                            color: '#d4d4d4'
                        },

                        // Content area
                        '.cm-content': {
                            padding: isMobile ? '6px' : '16px',
                            minHeight: '100%',
                            color: '#d4d4d4',
                            caretColor: '#ffffff',
                            lineHeight: isMobile ? '1.7' : '1.6',
                            backgroundColor: 'transparent'
                        },

                        // Scrollable area with custom scrollbars
                        '.cm-scroller': {
                            fontSize: isMobile ? '9px' : '15px',
                            lineHeight: isMobile ? '1.7' : '1.6',
                            overflow: 'auto !important', // THIS IS THE KEY FOR SCROLLBARS
                            fontFamily: 'inherit',
                            // Firefox scrollbar styling
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#424242 #1e1e1e'
                        },
                        
                        // Webkit scrollbar styling (separate selectors)
                        '.cm-scroller::-webkit-scrollbar': {
                            width: '14px',
                            height: '14px'
                        },
                        '.cm-scroller::-webkit-scrollbar-track': {
                            background: '#1e1e1e',
                            borderRadius: '8px'
                        },
                        '.cm-scroller::-webkit-scrollbar-thumb': {
                            background: '#424242',
                            borderRadius: '8px',
                            border: '2px solid #1e1e1e'
                        },
                        '.cm-scroller::-webkit-scrollbar-thumb:hover': {
                            background: '#535353'
                        },
                        '.cm-scroller::-webkit-scrollbar-corner': {
                            background: '#1e1e1e'
                        },
                        
                        // Line numbers
                        '.cm-lineNumbers': {
                            color: '#858585',
                            backgroundColor: '#252526',
                            borderRight: '1px solid #3e3e42',
                            minWidth: '45px',
                            paddingLeft: '8px',
                            paddingRight: '8px'
                        },
                        
                        // Active line
                        '.cm-activeLine': {
                            backgroundColor: '#2a2d2e !important'
                        },
                        
                        // Current line number
                        '.cm-activeLineGutter': {
                            backgroundColor: '#252526',
                            color: '#ffffff'
                        },
                        
                        // Selection - Proper CodeMirror 6 pattern for both native and library selection
                        '.cm-selectionBackground, .cm-content ::selection': {
                            backgroundColor: '#3875d7 !important'
                        },
                        
                        // Focused editor selection with higher specificity
                        '&.cm-focused .cm-selectionBackground, &.cm-focused .cm-content ::selection': {
                            backgroundColor: '#3875d7 !important'
                        },
                        
                        // Focused state
                        '.cm-focused': {
                            outline: 'none'
                        },
                        
                        // Editor main container
                        '.cm-editor': {
                            height: '100%'
                        },
                        
                        // Gutters (line numbers, fold, etc.)
                        '.cm-gutters': {
                            backgroundColor: '#252526',
                            borderRight: '1px solid #3e3e42'
                        },
                        
                        // Fold gutter
                        '.cm-foldGutter': {
                            width: '16px'
                        },
                        
                        // Search match highlighting - Proper specificity
                        '& .cm-searchMatch': {
                            backgroundColor: '#613a00 !important',
                            outline: '1px solid #f9cc2c !important',
                            color: 'inherit'
                        },
                        
                        '& .cm-searchMatch.cm-searchMatch-selected': {
                            backgroundColor: '#f9cc2c !important',
                            color: '#000000 !important'
                        },
                        
                        // Bracket matching - Proper specificity  
                        '& .cm-matchingBracket': {
                            backgroundColor: '#0e4566 !important',
                            outline: '1px solid #007acc !important'
                        },
                        
                        // Cursor
                        '.cm-cursor': {
                            borderLeftColor: '#ffffff'
                        },
                        
                        // Panel styling (for autocomplete, etc.)
                        '.cm-panel': {
                            backgroundColor: '#2d2d30',
                            border: '1px solid #3e3e42'
                        },
                        
                        // Tooltip styling
                        '.cm-tooltip': {
                            backgroundColor: '#2d2d30',
                            border: '1px solid #3e3e42',
                            color: '#cccccc'
                        }
                    }, { dark: theme === 'dark' }),
                    EditorState.readOnly.of(readOnly)
                ];

                const state = EditorState.create({
                    doc: value || '',
                    extensions
                });

                const view = new EditorView({
                    state,
                    parent: containerRef.current
                });

                editorRef.current = view;

                // Restore initial scroll position
                if (initialScrollTop > 0) {
                    setTimeout(() => {
                        if (view.scrollDOM) {
                            view.scrollDOM.scrollTop = initialScrollTop;
                        }
                    }, 0);
                }

                // Listen to scroll events
                if (onScrollChange && view.scrollDOM) {
                    const handleScroll = () => {
                        onScrollChange(view.scrollDOM.scrollTop);
                    };
                    view.scrollDOM.addEventListener('scroll', handleScroll);
                }

                if (mounted) {
                    setStatus('ready');
                    console.log('✅ CodeMirror Kernel Editor ready!');
                }

            } catch (err) {
                console.error('❌ Failed to initialize CodeMirror Kernel Editor:', err);
                if (mounted) {
                    setError(err.message);
                    setStatus('error');
                }
            }
        };

        initializeEditor();

        return () => {
            mounted = false;
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
            if (lspClientRef.current && lspClientRef.current.close) {
                lspClientRef.current.close();
                lspClientRef.current = null;
            }
        };
    }, [enableLSP, lspServerUri, documentUri, isMobile]);

    // Sync files with LSP when allFiles or fileContents change
    useEffect(() => {
        if (lspClientRef.current && lspClientRef.current.readyState === WebSocket.OPEN && allFiles && allFiles.length > 0) {
            const syncFiles = () => {
                try {
                    syncAllFilesWithLSP(lspClientRef.current, allFiles, fileContents);
                    console.log('🔄 Re-synced files with clangd due to file changes');
                } catch (error) {
                    console.warn('⚠️ Failed to re-sync files with clangd:', error);
                }
            };
            
            // Debounce the sync operation to avoid excessive calls
            const timeoutId = setTimeout(syncFiles, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [allFiles, fileContents]);

    // Update editor value when prop changes
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.state.doc.toString()) {
            const view = editorRef.current;
            view.dispatch({
                changes: {
                    from: 0,
                    to: view.state.doc.length,
                    insert: value || ''
                }
            });
        }
    }, [value]);

    const getStatusColor = () => {
        if (status === 'error') return '#ff6b6b';
        if (status === 'ready') return '#51cf66';
        return '#ffa726';
    };

    const getStatusText = () => {
        switch (status) {
            case 'loading': return 'Loading CodeMirror...';
            case 'loading-lsp': return 'Loading LSP...';
            case 'creating-editor': return 'Creating Editor...';
            case 'ready': return enableLSP ? 'Kernel Editor with LSP' : 'Kernel Editor';
            case 'error': return 'Error';
            default: return 'Initializing...';
        }
    };

    if (error) {
        return (
            <div className={`codemirror-kernel-editor ${className}`} style={{ height }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    gap: '16px',
                    background: '#1a1a1a',
                    color: '#ff6b6b',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #ff6b6b'
                }}>
                    <h3>❌ CodeMirror Editor Error</h3>
                    <p>Failed to initialize the editor:</p>
                    <code style={{ 
                        background: '#2a2a2a', 
                        padding: '10px', 
                        borderRadius: '4px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </code>
                </div>
            </div>
        );
    }

    return (
        <div className={`codemirror-kernel-editor ${className}`} style={{ height, position: 'relative' }}>
            {/* Status indicator */}
            {status !== 'ready' && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 1000,
                    background: 'rgba(0,0,0,0.9)',
                    color: getStatusColor(),
                    padding: '20px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    border: `2px solid ${getStatusColor()}`,
                    minWidth: '200px'
                }}>
                    <div style={{ marginBottom: '10px', fontSize: '24px' }}>⚡</div>
                    <div>{getStatusText()}</div>
                </div>
            )}

            {/* Status indicator when ready - DISABLED */}
            {false && status === 'ready' && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)',
                    color: getStatusColor(),
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                }}>
                    ● {enableLSP ? 'LSP + Kernel API' : 'Kernel API'}
                </div>
            )}

            {/* Editor container */}
            <div 
                ref={containerRef}
                style={{ 
                    width: '100%', 
                    height: '100%',
                    background: '#1e1e1e',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}
            />
        </div>
    );
};

export default CodeMirrorKernelEditor;