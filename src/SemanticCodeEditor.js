import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
// Import EVERYTHING from your central definition file
import {
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
    AUTOCOMPLETE_DATA
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

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // --- A. REGISTER COMPLETION ITEM PROVIDER (AUTOCOMPLETE) ---
        monaco.languages.registerCompletionItemProvider('c', {
            provideCompletionItems: (model, position) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                    startColumn: word.startColumn, endColumn: word.endColumn
                };

                const suggestions = [];
                const lineContent = model.getLineContent(position.lineNumber);
                const currentWord = word.word.toLowerCase();

                // 1. FUNCTION SIGNATURES (static int, static void, etc.) - HIGHEST PRIORITY
                FUNCTION_SIGNATURES.forEach(sig => {
                    const matchScore = sig.name.toLowerCase().includes(currentWord) ? 10 : 0;
                    suggestions.push({
                        label: sig.name,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        documentation: { value: `**${sig.name}**\n\n${sig.description}\n\n*Category: ${sig.category}*` },
                        insertText: sig.signature,
                        insertTextRules: sig.snippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                        range: range,
                        sortText: `0${matchScore}${sig.name}` // High priority
                    });
                });

                // 2. KERNEL FUNCTIONS with enhanced matching
                KERNEL_FUNCTIONS.forEach(func => {
                    const matchScore = func.name.toLowerCase().includes(currentWord) ? 8 : 0;
                    suggestions.push({
                        label: func.name,
                        kind: monaco.languages.CompletionItemKind.Function,
                        documentation: { value: `**${func.name}**\n\n${func.description}\n\n*Category: ${func.category}*` },
                        insertText: func.signature,
                        insertTextRules: func.snippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                        range: range,
                        sortText: `1${matchScore}${func.name}`
                    });
                });

                // 3. KERNEL TYPES with CMAKE definitions
                [...KERNEL_TYPES, ...CMAKE_KERNEL_DEFS.standardTypes].forEach(type => {
                    const matchScore = type.name.toLowerCase().includes(currentWord) ? 7 : 0;
                    suggestions.push({
                        label: type.name,
                        kind: monaco.languages.CompletionItemKind.Struct,
                        documentation: type.description + (type.size ? ` (${type.size} bytes)` : ''),
                        insertText: type.name,
                        range: range,
                        sortText: `2${matchScore}${type.name}`
                    });
                });

                // 4. KEYWORDS with descriptions
                AUTOCOMPLETE_DATA.keywords.forEach(keyword => {
                    const matchScore = keyword.name.toLowerCase().includes(currentWord) ? 6 : 0;
                    suggestions.push({
                        label: keyword.name,
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        documentation: keyword.description,
                        insertText: keyword.name,
                        range: range,
                        sortText: `3${matchScore}${keyword.name}`
                    });
                });

                // 5. KERNEL CONSTANTS and MODULE_MACROS
                [...KERNEL_CONSTANTS, ...MODULE_MACROS].forEach(item => {
                    const matchScore = item.name.toLowerCase().includes(currentWord) ? 5 : 0;
                    suggestions.push({
                        label: item.name,
                        kind: monaco.languages.CompletionItemKind.Constant,
                        documentation: item.description,
                        insertText: item.signature || item.name,
                        insertTextRules: item.snippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
                        range: range,
                        sortText: `4${matchScore}${item.name}`
                    });
                });

                // 6. CODE TEMPLATES
                CODE_TEMPLATES.forEach(template => {
                    const matchScore = template.name.toLowerCase().includes(currentWord) ? 4 : 0;
                    suggestions.push({
                        label: template.name,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        documentation: template.description,
                        insertText: template.content.join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        range: range,
                        sortText: `5${matchScore}${template.name}`
                    });
                });

                // 7. KERNEL HEADERS (for #include)
                if (lineContent.trim().startsWith('#include')) {
                    KERNEL_HEADERS.forEach(header => {
                        const matchScore = header.name.toLowerCase().includes(currentWord) ? 3 : 0;
                        suggestions.push({
                            label: `<${header.name}>`,
                            kind: monaco.languages.CompletionItemKind.Module,
                            documentation: header.description,
                            insertText: `<${header.name}>`,
                            range: range,
                            sortText: `6${matchScore}${header.name}`
                        });
                    });
                }

                // 8. COMMON PATTERNS for context-aware completion
                if (currentWord.includes('static') || lineContent.includes('static')) {
                    AUTOCOMPLETE_DATA.patterns.forEach(pattern => {
                        if (pattern.includes('static')) {
                            suggestions.push({
                                label: pattern.split('${')[0].trim(),
                                kind: monaco.languages.CompletionItemKind.Snippet,
                                documentation: 'Common kernel pattern',
                                insertText: pattern,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                range: range,
                                sortText: `0${pattern}` // Very high priority for static
                            });
                        }
                    });
                }

                return { suggestions: suggestions };
            }
        });

        // --- B. REGISTER HOVER PROVIDER (TOOLTIPS ON HOVER) ---
        monaco.languages.registerHoverProvider('c', {
            provideHover: (model, position) => {
                const word = model.getWordAtPosition(position);
                if (!word) return;

                const allItems = [
                    ...KERNEL_FUNCTIONS,
                    ...KERNEL_TYPES,
                    ...KERNEL_CONSTANTS,
                    ...MODULE_MACROS,
                    ...FUNCTION_SIGNATURES,
                    ...CMAKE_KERNEL_DEFS.standardTypes,
                    ...AUTOCOMPLETE_DATA.keywords
                ];
                const item = allItems.find(i => i.name === word.word);

                if (item) {
                    const signature = item.signature ? `\`\`\`c\n${item.signature.replace(/\$\{\d+:[^}]+\}/g, '').replace(/\$\d+/g, '')}\n\`\`\`` : '';
                    const contents = [
                        { value: `**${item.name}** (*${item.category}*)` },
                        { value: item.description },
                        { value: signature }
                    ];
                    return { contents: contents };
                }
            }
        });

        // --- C. REGISTER SIGNATURE HELP PROVIDER (PARAMETER INFO) ---
        monaco.languages.registerSignatureHelpProvider('c', {
            signatureHelpTriggerCharacters: ['(', ','],
            provideSignatureHelp: (model, position) => {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: 1, startColumn: 1,
                    endLineNumber: position.lineNumber, endColumn: position.column
                });

                // Match the function call, e.g., "my_func(" or "my_func(arg1, "
                const match = textUntilPosition.match(/(\w+)\s*\(\s*([^)]*)$/);
                if (!match) return;

                const functionName = match[1];
                const paramsStr = match[2];
                const activeParameter = (paramsStr.match(/,/g) || []).length;

                const funcData = [...KERNEL_FUNCTIONS, ...FUNCTION_SIGNATURES].find(f => f.name === functionName);
                if (!funcData || !funcData.params) return;

                return {
                    value: {
                        activeSignature: 0,
                        activeParameter: activeParameter,
                        signatures: [
                            {
                                label: `${funcData.name}(${funcData.params.map(p => p.label).join(', ')})`,
                                documentation: funcData.description,
                                parameters: funcData.params.map(p => ({
                                    label: p.label,
                                    documentation: p.documentation
                                }))
                            }
                        ]
                    },
                    dispose: () => {}
                };
            }
        });

        // --- D. SEMANTIC VALIDATION (ENHANCED) ---
        const updateMarkers = () => {
            const model = editor.getModel();
            if (!model) return;
            const diagnostics = [];
            const content = model.getValue();

            // KERNEL_VIOLATIONS check
            KERNEL_VIOLATIONS.forEach(violation => {
                const pattern = violation.pattern;
                if (typeof pattern === 'string') {
                    let index = content.indexOf(pattern);
                    while (index !== -1) {
                        const startPos = model.getPositionAt(index);
                        const endPos = model.getPositionAt(index + pattern.length);
                        diagnostics.push({
                            severity: violation.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
                            startLineNumber: startPos.lineNumber,
                            startColumn: startPos.column,
                            endLineNumber: endPos.lineNumber,
                            endColumn: endPos.column,
                            message: violation.message,
                        });
                        index = content.indexOf(pattern, index + 1);
                    }
                } else {
                    // RegExp pattern
                    const regex = new RegExp(pattern.source, 'g');
                    let match;
                    while ((match = regex.exec(content)) !== null) {
                        const startPos = model.getPositionAt(match.index);
                        const endPos = model.getPositionAt(match.index + match[0].length);
                        diagnostics.push({
                            severity: violation.severity === 'error' ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
                            startLineNumber: startPos.lineNumber,
                            startColumn: startPos.column,
                            endLineNumber: endPos.lineNumber,
                            endColumn: endPos.column,
                            message: violation.message,
                        });
                    }
                }
            });

            // BEST_PRACTICES check
            BEST_PRACTICES.forEach(practice => {
                if (content.includes(practice.pattern)) {
                    const requirementMet = Array.isArray(practice.requirement) ?
                        practice.requirement.some(req => content.includes(req)) :
                        content.includes(practice.requirement);

                    if (!requirementMet) {
                        const matchIndex = content.indexOf(practice.pattern);
                        const startPos = model.getPositionAt(matchIndex);
                        diagnostics.push({
                            severity: monaco.MarkerSeverity.Warning,
                            startLineNumber: startPos.lineNumber,
                            startColumn: startPos.column,
                            endLineNumber: startPos.lineNumber,
                            endColumn: startPos.column + practice.pattern.length,
                            message: practice.message,
                        });
                    }
                }
            });

            monaco.editor.setModelMarkers(model, 'kernel-validator', diagnostics);
        };

        editor.onDidChangeModelContent(() => {
            // Debounce validation
            clearTimeout(editor.validationTimeout);
            editor.validationTimeout = setTimeout(updateMarkers, 500);
        });

        updateMarkers(); // Initial validation

        // Enhanced editor options for better kernel coding experience
        editor.updateOptions({
            fontSize: 14,
            tabSize: 8, // Linux kernel uses 8-space tabs
            insertSpaces: false, // Use tabs, not spaces (kernel style)
            detectIndentation: false,
            wordWrap: 'on',
            minimap: { enabled: false },
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false
            },
            parameterHints: { enabled: true }
        });

        // Auto-resize functionality with safety checks
        const resizeEditor = () => {
            try {
                if (editor && editorRef.current === editor) {
                    editor.layout();
                }
            } catch (error) {
                // Silently handle layout errors
                console.debug('Editor layout error:', error);
            }
        };

        // Add resize listener
        resizeListenerRef.current = resizeEditor;
        window.addEventListener('resize', resizeEditor);

        // Initial focus and validation with safety checks
        setTimeout(() => {
            try {
                if (editor && editorRef.current === editor) {
                    editor.focus();
                    updateMarkers();
                }
            } catch (error) {
                console.debug('Editor initialization error:', error);
            }
        }, 1000);
    };

    // Handle editor change
    const handleEditorChange = (newValue, event) => {
        if (onChange) {
            onChange(newValue);
        }
    };

    return (
        <div className={`semantic-code-editor ${className}`} style={{ height }}>
            <Editor
                height={height}
                defaultLanguage="c"
                theme={theme}
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                    readOnly: readOnly,
                    fontSize: 14,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    lineHeight: 1.6,
                    tabSize: 8,
                    insertSpaces: false,
                    detectIndentation: false,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    renderLineHighlight: 'all',
                    cursorStyle: 'line',
                    lineNumbers: 'on',
                    glyphMargin: true,
                    folding: true,
                    // Enhanced features
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnEnter: 'on',
                    acceptSuggestionOnCommitCharacter: true,
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false
                    },
                    parameterHints: {
                        enabled: true,
                        cycle: true
                    },
                    suggest: {
                        showKeywords: true,
                        showSnippets: true,
                        showFunctions: true,
                        showConstants: true,
                        showStructs: true,
                        showModules: true
                    }
                }}
            />
        </div>
    );
};

export default SemanticCodeEditor;