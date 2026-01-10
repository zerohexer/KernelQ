/**
 * ConceptLearner - Interactive concept viewer with runnable code examples
 *
 * Renders markdown content with embedded <code_editor> blocks that can be
 * compiled and executed as kernel modules.
 *
 * Format:
 * ```markdown
 * # What are Pointers?
 *
 * Explanation text here...
 *
 * <code_editor title="Basic Example" module="ptr_basic">
 * #include <linux/module.h>
 * // ... kernel module code
 * </code_editor>
 *
 * More text after...
 * ```
 */

import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, BookOpen } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';
import ConceptCodeRunner from './ConceptCodeRunner';

// ============ MARKDOWN TABLE PARSER ============
// Parses markdown tables and renders them as React components
// Same approach as MultiFileEditor

const parseMarkdownTable = (tableText) => {
    const lines = tableText.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return null;

    const parseRow = (line) => {
        return line
            .split('|')
            .map(cell => cell.trim())
            .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1);
    };

    const headers = parseRow(lines[0]);

    const separatorRow = lines[1];
    const alignments = parseRow(separatorRow).map(cell => {
        const trimmed = cell.replace(/-/g, '').trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        return 'left';
    });

    const rows = lines.slice(2)
        .map(parseRow)
        .filter(row => row.length > 0 && row.some(cell => cell.trim()));

    return { headers, alignments, rows };
};

const renderCellContent = (text) => {
    if (!text) return text;

    const elements = [];
    let key = 0;

    const codeRegex = /`([^`]+)`/g;
    let lastIndex = 0;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            elements.push(text.slice(lastIndex, match.index));
        }
        elements.push(
            <code key={key++} style={{
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '2px 5px',
                borderRadius: '3px',
                color: 'rgba(245, 245, 247, 0.9)',
                fontFamily: '"SF Mono", Monaco, monospace',
                fontSize: '0.9rem'
            }}>{match[1]}</code>
        );
        lastIndex = match.index + match[0].length;
    }

    if (elements.length > 0) {
        if (lastIndex < text.length) {
            elements.push(text.slice(lastIndex));
        }
        return elements;
    }

    return text;
};

const MarkdownTable = ({ tableText }) => {
    const parsed = parseMarkdownTable(tableText);
    if (!parsed) return <pre>{tableText}</pre>;

    const { headers, alignments, rows } = parsed;

    const tableStyles = {
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            margin: '16px 0',
            fontSize: '1rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif'
        },
        th: {
            background: 'rgba(255, 255, 255, 0.06)',
            color: '#f5f5f7',
            fontWeight: 600,
            padding: '10px 12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '1rem'
        },
        td: {
            padding: '10px 12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: 'rgba(245, 245, 247, 0.8)',
            fontSize: '1rem'
        },
        trEven: {
            background: 'rgba(255, 255, 255, 0.02)'
        }
    };

    return (
        <table style={tableStyles.table}>
            <thead>
                <tr>
                    {headers.map((header, i) => (
                        <th key={i} style={{ ...tableStyles.th, textAlign: alignments[i] || 'left' }}>
                            {renderCellContent(header)}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} style={rowIdx % 2 === 1 ? tableStyles.trEven : {}}>
                        {row.map((cell, cellIdx) => (
                            <td key={cellIdx} style={{ ...tableStyles.td, textAlign: alignments[cellIdx] || 'left' }}>
                                {renderCellContent(cell)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

// Split content into table and non-table segments
const splitContentByTables = (content) => {
    if (!content) return [{ type: 'markdown', content: '' }];

    const segments = [];
    const lines = content.split('\n');
    let currentSegment = [];
    let inTable = false;
    let tableLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
        const isSeparator = /^\|[\s:-]+\|[\s:|-]*$/.test(line.trim());

        if (isTableRow || isSeparator) {
            if (!inTable) {
                if (currentSegment.length > 0) {
                    segments.push({ type: 'markdown', content: currentSegment.join('\n') });
                    currentSegment = [];
                }
                inTable = true;
            }
            tableLines.push(line);
        } else {
            if (inTable) {
                if (tableLines.length >= 2) {
                    segments.push({ type: 'table', content: tableLines.join('\n') });
                } else {
                    currentSegment.push(...tableLines);
                }
                tableLines = [];
                inTable = false;
            }
            currentSegment.push(line);
        }
    }

    if (inTable && tableLines.length >= 2) {
        segments.push({ type: 'table', content: tableLines.join('\n') });
    } else if (inTable) {
        currentSegment.push(...tableLines);
    }

    if (currentSegment.length > 0) {
        segments.push({ type: 'markdown', content: currentSegment.join('\n') });
    }

    return segments.length > 0 ? segments : [{ type: 'markdown', content: '' }];
};
// ============ END MARKDOWN TABLE PARSER ============

/**
 * Parse markdown content, splitting by <code_editor> tags
 * Returns array of { type: 'markdown' | 'code_editor' | 'table', content, title?, module? }
 */
function parseConceptContent(content) {
    if (!content) return [];

    const sections = [];
    const codeEditorRegex = /<code_editor\s+([^>]*)>([\s\S]*?)<\/code_editor>/g;

    let lastIndex = 0;
    let match;

    while ((match = codeEditorRegex.exec(content)) !== null) {
        // Add markdown before this code_editor block (split by tables too)
        if (match.index > lastIndex) {
            const markdownContent = content.slice(lastIndex, match.index).trim();
            if (markdownContent) {
                // Split markdown by tables
                const tableSegments = splitContentByTables(markdownContent);
                sections.push(...tableSegments);
            }
        }

        // Parse attributes: title="..." module="..."
        const attrsString = match[1];
        const attrs = {};

        const titleMatch = attrsString.match(/title=["']([^"']+)["']/);
        if (titleMatch) attrs.title = titleMatch[1];

        const moduleMatch = attrsString.match(/module=["']([^"']+)["']/);
        if (moduleMatch) attrs.module = moduleMatch[1];

        sections.push({
            type: 'code_editor',
            title: attrs.title || 'Example',
            module: attrs.module || 'example',
            code: match[2].trim()
        });

        lastIndex = match.index + match[0].length;
    }

    // Add remaining markdown after last code_editor (split by tables too)
    if (lastIndex < content.length) {
        const remainingContent = content.slice(lastIndex).trim();
        if (remainingContent) {
            const tableSegments = splitContentByTables(remainingContent);
            sections.push(...tableSegments);
        }
    }

    return sections;
}

/**
 * Custom markdown components - matches MultiFileEditor styling
 */
const markdownComponents = {
    h1: ({ node, ...props }) => (
        <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            margin: '0 0 12px 0',
            color: '#f5f5f7',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }} {...props} />
    ),
    h2: ({ node, ...props }) => (
        <h2 style={{
            fontSize: '1.0625rem',
            fontWeight: 600,
            margin: '20px 0 10px 0',
            color: '#f5f5f7'
        }} {...props} />
    ),
    h3: ({ node, ...props }) => (
        <h3 style={{
            fontSize: '0.9375rem',
            fontWeight: 600,
            margin: '16px 0 8px 0',
            color: '#f5f5f7'
        }} {...props} />
    ),
    h4: ({ node, ...props }) => (
        <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            margin: '12px 0 6px 0',
            color: '#f5f5f7'
        }} {...props} />
    ),
    p: ({ node, ...props }) => (
        <p style={{
            margin: '0 0 10px 0',
            lineHeight: 1.6,
            fontSize: '1rem'
        }} {...props} />
    ),
    code: ({ node, inline, ...props }) => (
        inline ? (
            <code style={{
                background: 'rgba(50, 215, 75, 0.12)',
                padding: '2px 5px',
                borderRadius: '4px',
                color: '#32d74b',
                fontFamily: 'SF Mono, Monaco, monospace',
                fontSize: '0.93rem'
            }} {...props} />
        ) : (
            <code style={{
                display: 'block',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '12px',
                borderRadius: '8px',
                overflowX: 'auto',
                color: 'rgba(245, 245, 247, 0.85)',
                fontFamily: 'SF Mono, Monaco, monospace',
                fontSize: '0.93rem',
                lineHeight: 1.5
            }} {...props} />
        )
    ),
    pre: ({ node, ...props }) => (
        <pre style={{
            margin: '12px 0 16px 0',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '8px',
            overflow: 'hidden'
        }} {...props} />
    ),
    ul: ({ node, ...props }) => (
        <ul style={{
            margin: '8px 0',
            paddingLeft: '20px',
            lineHeight: 1.6,
            listStyleType: 'disc',
            listStylePosition: 'outside',
            fontSize: '1rem'
        }} {...props} />
    ),
    ol: ({ node, ...props }) => (
        <ol style={{
            margin: '8px 0',
            paddingLeft: '20px',
            lineHeight: 1.6,
            listStyleType: 'decimal',
            listStylePosition: 'outside',
            fontSize: '1rem'
        }} {...props} />
    ),
    li: ({ node, ...props }) => (
        <li style={{
            margin: '4px 0',
            display: 'list-item'
        }} {...props} />
    ),
    blockquote: ({ node, ...props }) => (
        <blockquote style={{
            margin: '10px 0',
            padding: '8px 12px',
            borderLeft: '3px solid #32d74b',
            background: 'rgba(50, 215, 75, 0.06)',
            fontStyle: 'italic',
            fontSize: '1rem',
            borderRadius: '0 6px 6px 0'
        }} {...props} />
    ),
    a: ({ node, ...props }) => (
        <a style={{
            color: '#0a84ff',
            textDecoration: 'none'
        }} {...props} />
    ),
    hr: ({ node, ...props }) => (
        <hr style={{
            margin: '16px 0',
            border: 'none',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }} {...props} />
    ),
    strong: ({ node, ...props }) => (
        <strong style={{
            color: '#f5f5f7',
            fontWeight: 600
        }} {...props} />
    ),
    em: ({ node, ...props }) => (
        <em style={{
            color: '#ffd60a'
        }} {...props} />
    )
};

const ConceptLearner = ({ concept, setSelectedConcept }) => {
    const [rawContent, setRawContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load the concept markdown content
    useEffect(() => {
        if (!concept) return;

        setLoading(true);
        setError(null);

        if (concept.url) {
            fetch(concept.url)
                .then(res => {
                    if (!res.ok) throw new Error('Failed to load concept');
                    return res.text();
                })
                .then(text => {
                    const frontmatterMatch = text.match(/^---\n[\s\S]*?\n---\n/);
                    const content = frontmatterMatch
                        ? text.slice(frontmatterMatch[0].length)
                        : text;
                    setRawContent(content);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err.message);
                    setLoading(false);
                });
        }
        else if (concept.content) {
            setRawContent(concept.content);
            setLoading(false);
        }
        else if (concept.explanation) {
            setRawContent(concept.explanation);
            setLoading(false);
        }
        else {
            setError('No content available');
            setLoading(false);
        }
    }, [concept]);

    // Parse content into sections
    const sections = useMemo(() => {
        return parseConceptContent(rawContent);
    }, [rawContent]);

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
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    background: 'rgba(255, 255, 255, 0.02)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flex: 1
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            flexShrink: 0
                        }}>
                            <BookOpen size={16} color="rgba(255, 255, 255, 0.7)" />
                        </div>
                        <h2 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: PremiumStyles.colors.text,
                            margin: 0,
                            letterSpacing: '-0.01em'
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

                {/* Content */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '32px 48px'
                }}>
                    {loading && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '200px',
                            color: PremiumStyles.colors.textSecondary
                        }}>
                            Loading concept...
                        </div>
                    )}

                    {error && (
                        <div style={{
                            background: 'rgba(255, 69, 58, 0.1)',
                            border: '1px solid rgba(255, 69, 58, 0.3)',
                            borderRadius: '8px',
                            padding: '16px',
                            color: '#ff453a'
                        }}>
                            Error loading concept: {error}
                        </div>
                    )}

                    {!loading && !error && sections.length === 0 && (
                        <div style={{ color: PremiumStyles.colors.textSecondary }}>
                            No content available for this concept.
                        </div>
                    )}

                    {!loading && !error && sections.map((section, idx) => (
                        section.type === 'code_editor' ? (
                            <ConceptCodeRunner
                                key={idx}
                                title={section.title}
                                module={section.module}
                                initialCode={section.code}
                            />
                        ) : section.type === 'table' ? (
                            <MarkdownTable key={idx} tableText={section.content} />
                        ) : (
                            <ReactMarkdown
                                key={idx}
                                components={markdownComponents}
                            >
                                {section.content}
                            </ReactMarkdown>
                        )
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConceptLearner;
