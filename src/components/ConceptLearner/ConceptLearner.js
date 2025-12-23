import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, BookOpen, Code, GraduationCap, Lightbulb, Terminal } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

// CodeMirror imports for syntax highlighting
import { EditorView, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { cpp } from '@codemirror/lang-cpp';

// Custom dark theme matching our editor (VS Code style)
const customHighlightStyle = HighlightStyle.define([
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
    // Modifiers
    { tag: [t.modifier], color: '#c586c0' },
    // Invalid/error highlighting
    { tag: [t.invalid], color: '#f44747', textDecoration: 'underline' }
]);

const editorTheme = EditorView.theme({
    '&': {
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        fontSize: '0.85rem',
        fontFamily: 'SF Mono, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    '.cm-content': {
        padding: '16px 0',
        caretColor: '#ffffff',
    },
    '.cm-line': {
        padding: '0 16px',
    },
    '.cm-gutters': {
        backgroundColor: '#1e1e1e',
        color: 'rgba(255, 255, 255, 0.3)',
        border: 'none',
        paddingRight: '8px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 8px 0 16px',
        minWidth: '32px',
    },
    '.cm-activeLine': {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    '.cm-activeLineGutter': {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    '&.cm-focused': {
        outline: 'none',
    },
    '.cm-scroller': {
        overflow: 'auto',
        fontFamily: 'inherit',
    },
});

// Read-only code viewer component
const CodeViewer = ({ code }) => {
    const containerRef = useRef(null);
    const editorRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || !code) return;

        // Create read-only editor state
        const state = EditorState.create({
            doc: code,
            extensions: [
                EditorView.editable.of(false),
                EditorState.readOnly.of(true),
                lineNumbers(),
                highlightActiveLine(),
                cpp(),
                syntaxHighlighting(customHighlightStyle),
                editorTheme,
                EditorView.lineWrapping,
            ],
        });

        // Create editor view
        const view = new EditorView({
            state,
            parent: containerRef.current,
        });

        editorRef.current = view;

        return () => {
            view.destroy();
        };
    }, [code]);

    return (
        <div
            ref={containerRef}
            style={{
                borderRadius: '0 0 16px 16px',
                overflow: 'hidden',
            }}
        />
    );
};

const ConceptLearner = ({ concept, setSelectedConcept }) => {
    if (!concept) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'center',
            padding: '12px'
        }}>
            <div style={{
                background: '#141416',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 32px 64px rgba(0, 0, 0, 0.6)',
                width: '96%',
                maxWidth: '1400px',
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '20px',
                    background: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '10px'
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, rgba(191, 90, 242, 0.2) 0%, rgba(191, 90, 242, 0.1) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(191, 90, 242, 0.3)'
                            }}>
                                <BookOpen size={18} color={PremiumStyles.colors.accentPurple} />
                            </div>
                            <span style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                color: PremiumStyles.colors.accentPurple,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                background: 'rgba(191, 90, 242, 0.1)',
                                padding: '4px 10px',
                                borderRadius: '6px'
                            }}>
                                Kernel Concept
                            </span>
                        </div>
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: PremiumStyles.colors.text,
                            margin: 0,
                            letterSpacing: '-0.02em',
                            lineHeight: 1.3
                        }}>
                            {concept.title}
                        </h2>
                    </div>

                    <button
                        onClick={() => setSelectedConcept(null)}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: PremiumStyles.colors.textSecondary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.color = PremiumStyles.colors.text;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.06)';
                            e.target.style.color = PremiumStyles.colors.textSecondary;
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '32px 40px'
                }}>
                    {/* Overview Section */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: PremiumStyles.colors.accentOrange,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            margin: '0 0 16px 0'
                        }}>
                            Overview
                        </h3>
                        <p style={{
                            fontSize: '1rem',
                            lineHeight: 1.8,
                            color: '#a1a1aa',
                            margin: 0,
                            fontWeight: 400
                        }}>
                            {concept.description}
                        </p>
                    </div>

                    {/* Explanation Section */}
                    <div style={{ marginBottom: '32px' }}>
                        <h3 style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: PremiumStyles.colors.accent,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            margin: '0 0 20px 0'
                        }}>
                            Detailed Explanation
                        </h3>
                        <div style={{
                            fontSize: '0.9375rem',
                            lineHeight: 1.8,
                            color: '#d4d4d8'
                        }}>
                            <ReactMarkdown
                                components={{
                                    p: ({ node, ...props }) => (
                                        <p style={{ margin: '0 0 16px 0', lineHeight: 1.8, color: '#a1a1aa' }} {...props} />
                                    ),
                                    ul: ({ node, ...props }) => (
                                        <ul style={{ margin: '12px 0 16px 0', paddingLeft: '24px', listStyleType: 'disc' }} {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                        <ol style={{ margin: '12px 0 16px 0', paddingLeft: '24px' }} {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                        <li style={{ margin: '8px 0', lineHeight: 1.7, color: '#a1a1aa' }} {...props} />
                                    ),
                                    strong: ({ node, ...props }) => (
                                        <strong style={{ color: '#d4d4d8', fontWeight: 500 }} {...props} />
                                    ),
                                    code: ({ node, inline, className, ...props }) => (
                                        <code style={{
                                            background: 'rgba(50, 215, 75, 0.15)',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                                            fontSize: '0.875em',
                                            color: '#32d74b',
                                            fontWeight: 500
                                        }} {...props} />
                                    ),
                                    pre: ({ node, children, ...props }) => (
                                        <pre style={{
                                            background: '#1e1e1e',
                                            padding: '16px',
                                            borderRadius: '12px',
                                            margin: '16px 0',
                                            overflow: 'auto',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            lineHeight: '1.45',
                                            fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                                            fontSize: '0.875rem',
                                            color: '#32d74b',
                                            whiteSpace: 'pre'
                                        }} {...props}>
                                            {children}
                                        </pre>
                                    ),
                                    h1: ({ node, ...props }) => (
                                        <h1 style={{ color: '#f5f5f7', fontWeight: 700, fontSize: '1.25rem', margin: '24px 0 12px 0' }} {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                        <h2 style={{ color: '#f5f5f7', fontWeight: 700, fontSize: '1.125rem', margin: '24px 0 12px 0' }} {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                        <h3 style={{ color: '#f5f5f7', fontWeight: 600, fontSize: '1rem', margin: '20px 0 10px 0' }} {...props} />
                                    ),
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote style={{
                                            borderLeft: '3px solid #32d74b',
                                            paddingLeft: '16px',
                                            margin: '16px 0',
                                            color: '#a1a1aa',
                                            background: 'rgba(50, 215, 75, 0.05)',
                                            padding: '12px 16px',
                                            borderRadius: '0 8px 8px 0'
                                        }} {...props} />
                                    )
                                }}
                            >
                                {concept.explanation}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {/* Code Example with CodeMirror */}
                    {concept.codeExample && (
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '12px'
                            }}>
                                <Code size={16} color={PremiumStyles.colors.accentBlue} />
                                <h3 style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: PremiumStyles.colors.accentBlue,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    margin: 0
                                }}>
                                    Code Example
                                </h3>
                            </div>
                            <div style={{
                                background: '#1e1e1e',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                overflow: 'hidden'
                            }}>
                                {/* Editor Header */}
                                <div style={{
                                    padding: '10px 16px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255, 69, 58, 0.8)' }} />
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255, 159, 10, 0.8)' }} />
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(50, 215, 75, 0.8)' }} />
                                    </div>
                                    <span style={{
                                        fontSize: '0.6875rem',
                                        color: PremiumStyles.colors.textTertiary,
                                        marginLeft: '8px',
                                        fontFamily: PremiumStyles.typography.fontFamilyMono
                                    }}>
                                        example.c
                                    </span>
                                </div>

                                {/* CodeMirror Editor */}
                                <CodeViewer code={concept.codeExample} />
                            </div>
                        </div>
                    )}

                    {/* Practice Exercises */}
                    {concept.exercises && concept.exercises.length > 0 && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: PremiumStyles.colors.accentOrange,
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                margin: '0 0 20px 0'
                            }}>
                                Practice Exercises
                            </h3>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                            }}>
                                {concept.exercises.map((exercise, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '16px'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            background: 'rgba(255, 159, 10, 0.15)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: '#ff9f0a',
                                            flexShrink: 0,
                                            marginTop: '2px'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.9375rem',
                                            lineHeight: 1.7,
                                            color: '#a1a1aa',
                                            fontWeight: 400
                                        }}>
                                            {exercise}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConceptLearner;
