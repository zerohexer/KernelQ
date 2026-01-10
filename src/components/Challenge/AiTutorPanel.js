import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, StopCircle, Bot, User, AlertCircle, Lightbulb, Code, RefreshCw, Pencil, Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PremiumStyles } from '../../styles/PremiumStyles';
import useIsMobile from '../../hooks/useIsMobile';

/**
 * AiTutorPanel - Socratic AI Tutor Chat Interface
 *
 * Provides a chat-based learning experience where the AI guides
 * students through problem-solving using Socratic methodology.
 *
 * Note: aiTutor state is passed from parent (ChallengeView) to persist
 * chat history across tab switches.
 */
const AiTutorPanel = ({ challenge, codeEditor, aiTutor, onSwitchToCode }) => {
    const [inputMessage, setInputMessage] = useState('');
    const [editText, setEditText] = useState('');
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);
    const editInputRef = useRef(null);
    const isMobile = useIsMobile();

    // Use aiTutor state from parent component (persists across tab switches)
    const {
        chatHistory,
        isLoading,
        error,
        streamingMessage,
        editingMessageId,
        sendMessage,
        clearHistory,
        cancelStream,
        retryLastMessage,
        editMessage,
        startEditingMessage,
        cancelEditing,
        switchMessageVersion,
        requestErrorHelp,
        askAboutFunction,
        hasHistory
    } = aiTutor;

    // Focus edit input when editing starts and scroll it into view
    useEffect(() => {
        if (editingMessageId && editInputRef.current) {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
                if (editInputRef.current) {
                    // Scroll the edit textarea into view smoothly
                    editInputRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                    // Focus after a small delay to let scroll complete
                    setTimeout(() => {
                        if (editInputRef.current) {
                            editInputRef.current.focus({ preventScroll: true });
                            // Set cursor to end
                            const length = editInputRef.current.value.length;
                            editInputRef.current.setSelectionRange(length, length);
                        }
                    }, 100);
                }
            });
        }
    }, [editingMessageId]);

    // Handle starting edit mode
    const handleStartEdit = (msg) => {
        setEditText(msg.content);
        startEditingMessage(msg.id);
    };

    // Handle submitting edit
    const handleSubmitEdit = () => {
        if (editText.trim() && editingMessageId) {
            editMessage(editingMessageId, editText.trim());
            setEditText('');
        }
    };

    // Handle canceling edit
    const handleCancelEdit = () => {
        cancelEditing();
        setEditText('');
    };

    // Handle edit keydown
    const handleEditKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    // Auto-scroll to bottom when new messages arrive (but not while editing)
    useEffect(() => {
        // Don't auto-scroll if user is editing a message - they need to see the edit
        if (editingMessageId) return;

        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, streamingMessage, editingMessageId]);

    // Focus input on mount (desktop only - avoid triggering keyboard on mobile)
    useEffect(() => {
        if (inputRef.current && !isMobile) {
            inputRef.current.focus();
        }
    }, [isMobile]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputMessage.trim() && !isLoading) {
            sendMessage(inputMessage);
            setInputMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Get function names from the challenge for quick-ask buttons
    const functionNames = challenge?.validation?.exactRequirements?.functionNames || [];
    const hasError = codeEditor?.output?.toLowerCase().includes('error') ||
                    codeEditor?.output?.toLowerCase().includes('fail');

    // Strip <think>...</think> tags from Qwen3 thinking model output
    const stripThinkTags = (content) => {
        if (!content) return content;
        // Remove <think>...</think> blocks (including multiline)
        return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    };

    // Render inline formatting (bold, italic, inline code)
    const renderInlineFormatting = (text, keyPrefix = '') => {
        if (!text) return text;

        const result = [];
        let remaining = text;
        let idx = 0;

        // Process text character by character to handle nested formatting
        while (remaining.length > 0) {
            // Check for bold **...**
            const boldMatch = remaining.match(/^\*\*([\s\S]*?)\*\*/);
            if (boldMatch) {
                // Recursively render content inside bold (may contain inline code)
                result.push(
                    <strong key={`${keyPrefix}-bold-${idx}`}>
                        {renderInlineFormatting(boldMatch[1], `${keyPrefix}-bold-${idx}`)}
                    </strong>
                );
                remaining = remaining.slice(boldMatch[0].length);
                idx++;
                continue;
            }

            // Check for italic *...* (single asterisk, not double)
            const italicMatch = remaining.match(/^\*([^*]+)\*/);
            if (italicMatch) {
                result.push(
                    <em key={`${keyPrefix}-italic-${idx}`}>
                        {renderInlineFormatting(italicMatch[1], `${keyPrefix}-italic-${idx}`)}
                    </em>
                );
                remaining = remaining.slice(italicMatch[0].length);
                idx++;
                continue;
            }

            // Check for inline code `...`
            const codeMatch = remaining.match(/^`([^`]+)`/);
            if (codeMatch) {
                result.push(
                    <code key={`${keyPrefix}-code-${idx}`} style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '2px 6px',
                        borderRadius: PremiumStyles.radius.sm,
                        fontFamily: PremiumStyles.typography.fontFamilyMono,
                        fontSize: '0.9em',
                        color: 'rgba(245, 245, 247, 0.65)'
                    }}>
                        {codeMatch[1]}
                    </code>
                );
                remaining = remaining.slice(codeMatch[0].length);
                idx++;
                continue;
            }

            // Find next special character or end
            const nextBold = remaining.indexOf('**');
            const nextCode = remaining.indexOf('`');
            // Find single asterisk that's not part of **
            let nextItalic = -1;
            for (let i = 0; i < remaining.length; i++) {
                if (remaining[i] === '*' && remaining[i + 1] !== '*' && (i === 0 || remaining[i - 1] !== '*')) {
                    nextItalic = i;
                    break;
                }
            }
            let nextSpecial = remaining.length;

            if (nextBold !== -1 && nextBold < nextSpecial) nextSpecial = nextBold;
            if (nextCode !== -1 && nextCode < nextSpecial) nextSpecial = nextCode;
            if (nextItalic !== -1 && nextItalic < nextSpecial) nextSpecial = nextItalic;

            if (nextSpecial > 0) {
                result.push(<span key={`${keyPrefix}-text-${idx}`}>{remaining.slice(0, nextSpecial)}</span>);
                remaining = remaining.slice(nextSpecial);
                idx++;
            } else {
                // Couldn't match anything, add one character and continue
                result.push(<span key={`${keyPrefix}-char-${idx}`}>{remaining[0]}</span>);
                remaining = remaining.slice(1);
                idx++;
            }
        }

        return result;
    };

    // Render markdown-like content with code blocks, headers, lists
    const renderMessage = (content) => {
        if (!content) return null;

        // First strip any thinking tags from the content
        const cleanContent = stripThinkTags(content);
        if (!cleanContent) return null;

        // Split by code blocks first
        const parts = cleanContent.split(/(```[\s\S]*?```)/g);

        return parts.map((part, idx) => {
            if (part.startsWith('```')) {
                // Code block
                const lines = part.split('\n');
                const language = lines[0].replace('```', '').trim();
                const code = lines.slice(1, -1).join('\n');

                return (
                    <pre key={idx} style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: PremiumStyles.radius.md,
                        padding: '12px',
                        margin: '12px 0',
                        overflow: 'auto',
                        fontSize: PremiumStyles.typography.sizes.sm,
                        fontFamily: PremiumStyles.typography.fontFamilyMono,
                        border: `1px solid ${PremiumStyles.colors.border}`
                    }}>
                        {language && (
                            <div style={{
                                color: PremiumStyles.colors.textTertiary,
                                fontSize: PremiumStyles.typography.sizes.xs,
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {language}
                            </div>
                        )}
                        <code style={{ color: 'rgba(245, 245, 247, 0.85)' }}>{code}</code>
                    </pre>
                );
            }

            // Process regular text line by line for headers, lists, blockquotes, tables
            const lines = part.split('\n');

            // Check for tables - collect consecutive lines starting with |
            const processedLines = [];
            let i = 0;
            while (i < lines.length) {
                const line = lines[i].trim();

                // Check if this starts a table
                if (line.startsWith('|') && line.endsWith('|')) {
                    const tableLines = [];
                    while (i < lines.length && lines[i].trim().startsWith('|')) {
                        tableLines.push(lines[i].trim());
                        i++;
                    }

                    // Parse table if we have at least header + separator + 1 row
                    if (tableLines.length >= 2) {
                        const parseRow = (row) => {
                            return row.split('|').slice(1, -1).map(cell => cell.trim());
                        };

                        const headerRow = parseRow(tableLines[0]);
                        // Skip separator row (contains dashes)
                        const dataStartIdx = tableLines[1].includes('-') ? 2 : 1;
                        const dataRows = tableLines.slice(dataStartIdx).map(parseRow);

                        processedLines.push({
                            type: 'table',
                            header: headerRow,
                            rows: dataRows
                        });
                    }
                } else {
                    processedLines.push({ type: 'line', content: lines[i] });
                    i++;
                }
            }

            return (
                <div key={idx}>
                    {processedLines.map((item, lineIdx) => {
                        if (item.type === 'table') {
                            return (
                                <div key={lineIdx} style={{
                                    overflowX: 'auto',
                                    margin: '12px 0'
                                }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '0.85rem',
                                        fontFamily: PremiumStyles.typography.fontFamilyMono
                                    }}>
                                        <thead>
                                            <tr>
                                                {item.header.map((cell, cellIdx) => (
                                                    <th key={cellIdx} style={{
                                                        padding: '8px 12px',
                                                        textAlign: 'left',
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: 'rgba(245, 245, 247, 0.8)',
                                                        fontWeight: PremiumStyles.typography.weights.semibold,
                                                        background: 'rgba(255, 255, 255, 0.03)'
                                                    }}>
                                                        {renderInlineFormatting(cell, `th-${lineIdx}-${cellIdx}`)}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {item.rows.map((row, rowIdx) => (
                                                <tr key={rowIdx}>
                                                    {row.map((cell, cellIdx) => (
                                                        <td key={cellIdx} style={{
                                                            padding: '8px 12px',
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                                            color: 'rgba(245, 245, 247, 0.65)'
                                                        }}>
                                                            {renderInlineFormatting(cell, `td-${lineIdx}-${rowIdx}-${cellIdx}`)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        }

                        const line = item.content;
                        const trimmedLine = line.trim();

                        // Headers
                        if (trimmedLine.startsWith('#### ')) {
                            return (
                                <div key={lineIdx} style={{
                                    fontSize: '0.95rem',
                                    fontWeight: PremiumStyles.typography.weights.semibold,
                                    color: 'rgba(245, 245, 247, 0.8)',
                                    marginTop: lineIdx > 0 ? '14px' : '6px',
                                    marginBottom: '6px'
                                }}>
                                    {renderInlineFormatting(trimmedLine.slice(5), `h4-${lineIdx}`)}
                                </div>
                            );
                        }
                        if (trimmedLine.startsWith('### ')) {
                            return (
                                <div key={lineIdx} style={{
                                    fontSize: '1rem',
                                    fontWeight: PremiumStyles.typography.weights.semibold,
                                    color: 'rgba(245, 245, 247, 0.85)',
                                    marginTop: lineIdx > 0 ? '16px' : '8px',
                                    marginBottom: '8px'
                                }}>
                                    {renderInlineFormatting(trimmedLine.slice(4), `h3-${lineIdx}`)}
                                </div>
                            );
                        }
                        if (trimmedLine.startsWith('## ')) {
                            return (
                                <div key={lineIdx} style={{
                                    fontSize: '1.1rem',
                                    fontWeight: PremiumStyles.typography.weights.semibold,
                                    color: 'rgba(245, 245, 247, 0.9)',
                                    marginTop: lineIdx > 0 ? '16px' : '8px',
                                    marginBottom: '8px'
                                }}>
                                    {renderInlineFormatting(trimmedLine.slice(3), `h2-${lineIdx}`)}
                                </div>
                            );
                        }

                        // Blockquotes (questions/prompts from tutor)
                        if (trimmedLine.startsWith('> ')) {
                            return (
                                <div key={lineIdx} style={{
                                    borderLeft: '3px solid rgba(255, 255, 255, 0.2)',
                                    paddingLeft: '12px',
                                    margin: '8px 0',
                                    color: 'rgba(245, 245, 247, 0.7)',
                                    fontStyle: 'italic',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    padding: '8px 12px',
                                    borderRadius: `0 ${PremiumStyles.radius.sm} ${PremiumStyles.radius.sm} 0`
                                }}>
                                    {renderInlineFormatting(trimmedLine.slice(2), `quote-${lineIdx}`)}
                                </div>
                            );
                        }

                        // Numbered lists
                        const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
                        if (numberedMatch) {
                            return (
                                <div key={lineIdx} style={{
                                    display: 'flex',
                                    gap: '8px',
                                    margin: '4px 0',
                                    paddingLeft: '4px'
                                }}>
                                    <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontWeight: PremiumStyles.typography.weights.semibold, minWidth: '20px' }}>
                                        {numberedMatch[1]}.
                                    </span>
                                    <span>{renderInlineFormatting(numberedMatch[2], `num-${lineIdx}`)}</span>
                                </div>
                            );
                        }

                        // Bullet lists
                        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
                            return (
                                <div key={lineIdx} style={{
                                    display: 'flex',
                                    gap: '8px',
                                    margin: '4px 0',
                                    paddingLeft: '4px'
                                }}>
                                    <span style={{ color: 'rgba(245, 245, 247, 0.5)' }}>•</span>
                                    <span>{renderInlineFormatting(trimmedLine.slice(2), `bullet-${lineIdx}`)}</span>
                                </div>
                            );
                        }

                        // Horizontal rule (---)
                        if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
                            return (
                                <div key={lineIdx} style={{
                                    height: '1px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    margin: '16px 0'
                                }} />
                            );
                        }

                        // Empty lines become spacing
                        if (trimmedLine === '') {
                            return <div key={lineIdx} style={{ height: '8px' }} />;
                        }

                        // Regular text
                        return (
                            <div key={lineIdx} style={{ margin: '2px 0' }}>
                                {renderInlineFormatting(line, `text-${lineIdx}`)}
                            </div>
                        );
                    })}
                </div>
            );
        });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: PremiumStyles.colors.backgroundTertiary,
            borderRadius: PremiumStyles.radius.lg,
            overflow: 'hidden',
            border: `1px solid ${PremiumStyles.colors.border}`
        }}>
            {/* Header */}
            <div style={{
                padding: isMobile ? '12px 14px' : '16px 20px',
                borderBottom: `1px solid ${PremiumStyles.colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: PremiumStyles.colors.surface
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '10px' }}>
                    <Bot size={isMobile ? 18 : 20} color="rgba(245, 245, 247, 0.6)" />
                    <span style={{
                        fontSize: isMobile ? PremiumStyles.typography.sizes.sm : PremiumStyles.typography.sizes.base,
                        fontWeight: PremiumStyles.typography.weights.semibold,
                        color: 'rgba(245, 245, 247, 0.9)'
                    }}>
                        AI Tutor
                    </span>
                    {!isMobile && (
                        <span style={{
                            fontSize: PremiumStyles.typography.sizes.xs,
                            color: 'rgba(245, 245, 247, 0.5)',
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '2px 8px',
                            borderRadius: PremiumStyles.radius.sm
                        }}>
                            In Development
                        </span>
                    )}
                </div>
                {hasHistory && (
                    <button
                        onClick={clearHistory}
                        style={{
                            background: 'rgba(245, 245, 247, 0.9)',
                            border: 'none',
                            borderRadius: PremiumStyles.radius.sm,
                            padding: isMobile ? '5px 8px' : '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            color: '#000',
                            fontSize: PremiumStyles.typography.sizes.xs,
                            fontWeight: PremiumStyles.typography.weights.semibold,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        <Trash2 size={12} />
                        {!isMobile && 'Clear'}
                    </button>
                )}
            </div>

            {/* Quick Actions (shown when no chat history) */}
            {!hasHistory && (
                <div style={{
                    padding: isMobile ? '14px' : '20px',
                    borderBottom: `1px solid ${PremiumStyles.colors.border}`
                }}>
                    <div style={{
                        fontSize: isMobile ? PremiumStyles.typography.sizes.xs : PremiumStyles.typography.sizes.sm,
                        color: PremiumStyles.colors.textSecondary,
                        marginBottom: isMobile ? '10px' : '12px',
                        fontWeight: PremiumStyles.typography.weights.medium
                    }}>
                        Quick Actions
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: isMobile ? '6px' : '8px'
                    }}>
                        {/* Error help button */}
                        {hasError && (
                            <button
                                onClick={() => requestErrorHelp(codeEditor.output)}
                                style={{
                                    background: 'rgba(255, 69, 58, 0.1)',
                                    border: '1px solid rgba(255, 69, 58, 0.3)',
                                    borderRadius: PremiumStyles.radius.md,
                                    padding: isMobile ? '6px 10px' : '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '6px' : '8px',
                                    cursor: 'pointer',
                                    color: PremiumStyles.colors.error,
                                    fontSize: isMobile ? PremiumStyles.typography.sizes.xs : PremiumStyles.typography.sizes.sm,
                                    fontWeight: PremiumStyles.typography.weights.medium,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'}
                            >
                                <AlertCircle size={isMobile ? 12 : 14} />
                                {isMobile ? 'Error help' : 'Help with error'}
                            </button>
                        )}

                        {/* Function help buttons - show fewer on mobile */}
                        {functionNames.slice(0, isMobile ? 2 : 4).map((fn, idx) => (
                            <button
                                key={idx}
                                onClick={() => askAboutFunction(fn)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: PremiumStyles.radius.md,
                                    padding: isMobile ? '6px 10px' : '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '6px' : '8px',
                                    cursor: 'pointer',
                                    color: 'rgba(245, 245, 247, 0.7)',
                                    fontSize: isMobile ? PremiumStyles.typography.sizes.xs : PremiumStyles.typography.sizes.sm,
                                    fontWeight: PremiumStyles.typography.weights.medium,
                                    fontFamily: PremiumStyles.typography.fontFamilyMono,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                            >
                                <Code size={isMobile ? 12 : 14} />
                                {fn}()
                            </button>
                        ))}

                        {/* General help */}
                        <button
                            onClick={() => sendMessage("Where should I start with this problem?")}
                            style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: PremiumStyles.radius.md,
                                padding: isMobile ? '6px 10px' : '8px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: isMobile ? '6px' : '8px',
                                cursor: 'pointer',
                                color: 'rgba(245, 245, 247, 0.7)',
                                fontSize: isMobile ? PremiumStyles.typography.sizes.xs : PremiumStyles.typography.sizes.sm,
                                fontWeight: PremiumStyles.typography.weights.medium,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
                        >
                            <Lightbulb size={isMobile ? 12 : 14} />
                            {isMobile ? 'Start?' : 'Where do I start?'}
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Messages */}
            <div
                ref={chatContainerRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: isMobile ? '12px 14px' : '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: isMobile ? '12px' : '16px'
                }}
            >
                {/* Welcome message if no history */}
                {!hasHistory && !streamingMessage && (
                    <div style={{
                        textAlign: 'center',
                        padding: isMobile ? '24px 16px' : '40px 20px',
                        color: 'rgba(245, 245, 247, 0.5)'
                    }}>
                        <Bot size={isMobile ? 36 : 48} style={{ marginBottom: isMobile ? '12px' : '16px', opacity: 0.5 }} color="rgba(245, 245, 247, 0.5)" />
                        <div style={{ fontSize: isMobile ? PremiumStyles.typography.sizes.base : PremiumStyles.typography.sizes.lg, marginBottom: '8px', color: 'rgba(245, 245, 247, 0.7)', fontWeight: PremiumStyles.typography.weights.medium }}>
                            I'm your Socratic C tutor
                        </div>
                        <div style={{ fontSize: isMobile ? PremiumStyles.typography.sizes.xs : PremiumStyles.typography.sizes.sm, lineHeight: 1.6 }}>
                            {isMobile ? (
                                <>
                                    I'll guide you with questions, not solutions.<br />
                                    <strong style={{ color: 'rgba(245, 245, 247, 0.8)' }}>You write every line yourself.</strong>
                                </>
                            ) : (
                                <>
                                    I won't give you direct solutions—instead, I'll guide you<br />
                                    with questions, building blocks, and memory diagrams.<br />
                                    <strong style={{ color: 'rgba(245, 245, 247, 0.8)' }}>You write every line yourself.</strong>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Chat history */}
                {chatHistory.map((msg, idx) => {
                    // Check if this is the last user message and AI has responded
                    const isLastUserMessage = msg.role === 'user' &&
                        chatHistory.slice(idx + 1).every(m => m.role !== 'user');
                    const hasAiResponse = idx < chatHistory.length - 1 &&
                        chatHistory[idx + 1]?.role === 'assistant';
                    const showRetry = isLastUserMessage && hasAiResponse && !isLoading && !streamingMessage;
                    const isEditing = editingMessageId === msg.id;
                    const hasMultipleVersions = msg.versionCount > 1;

                    return (
                        <div
                            key={msg.id || idx}
                            style={{
                                display: 'flex',
                                gap: isMobile ? '8px' : '12px',
                                alignItems: 'flex-start',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: isMobile ? '28px' : '32px',
                                height: isMobile ? '28px' : '32px',
                                borderRadius: PremiumStyles.radius.full,
                                background: msg.role === 'user'
                                    ? 'rgba(255, 255, 255, 0.1)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {msg.role === 'user'
                                    ? <User size={isMobile ? 14 : 16} color="rgba(245, 245, 247, 0.7)" />
                                    : <Bot size={isMobile ? 14 : 16} color="rgba(245, 245, 247, 0.6)" />
                                }
                            </div>

                            {/* Message bubble and action buttons container */}
                            <div style={{
                                maxWidth: isMobile ? '85%' : '80%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                {/* Branch navigation (if multiple versions exist) */}
                                {/* Disabled while AI is streaming to prevent response going to wrong branch */}
                                {hasMultipleVersions && msg.role === 'user' && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        marginBottom: '4px',
                                        fontSize: PremiumStyles.typography.sizes.xs,
                                        color: PremiumStyles.colors.textTertiary,
                                        opacity: (isLoading || streamingMessage) ? 0.4 : 1
                                    }}>
                                        <button
                                            onClick={() => switchMessageVersion(msg.id, msg.activeVersion - 1)}
                                            disabled={msg.activeVersion === 0 || isLoading || !!streamingMessage}
                                            title={(isLoading || streamingMessage) ? 'Cannot switch while AI is responding' : ''}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                padding: '2px',
                                                cursor: (msg.activeVersion === 0 || isLoading || streamingMessage) ? 'not-allowed' : 'pointer',
                                                opacity: (msg.activeVersion === 0 || isLoading || streamingMessage) ? 0.3 : 0.7,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <ChevronLeft size={14} color="rgba(245, 245, 247, 0.7)" />
                                        </button>
                                        <span style={{ minWidth: '40px', textAlign: 'center' }}>
                                            {msg.activeVersion + 1} / {msg.versionCount}
                                        </span>
                                        <button
                                            onClick={() => switchMessageVersion(msg.id, msg.activeVersion + 1)}
                                            disabled={msg.activeVersion === msg.versionCount - 1 || isLoading || !!streamingMessage}
                                            title={(isLoading || streamingMessage) ? 'Cannot switch while AI is responding' : ''}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                padding: '2px',
                                                cursor: (msg.activeVersion === msg.versionCount - 1 || isLoading || streamingMessage) ? 'not-allowed' : 'pointer',
                                                opacity: (msg.activeVersion === msg.versionCount - 1 || isLoading || streamingMessage) ? 0.3 : 0.7,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <ChevronRight size={14} color="rgba(245, 245, 247, 0.7)" />
                                        </button>
                                    </div>
                                )}

                                {/* Message bubble or edit input */}
                                {isEditing ? (
                                    <div style={{
                                        background: 'rgba(10, 132, 255, 0.15)',
                                        borderRadius: isMobile ? '14px' : '16px',
                                        padding: isMobile ? '10px 12px' : '12px 16px',
                                        border: '1px solid rgba(10, 132, 255, 0.4)',
                                        width: '100%'
                                    }}>
                                        <textarea
                                            ref={editInputRef}
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onKeyDown={handleEditKeyDown}
                                            style={{
                                                width: '100%',
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                resize: 'none',
                                                fontSize: isMobile ? '0.85rem' : '0.93rem',
                                                lineHeight: 1.6,
                                                color: 'rgba(245, 245, 247, 0.85)',
                                                fontFamily: PremiumStyles.typography.fontFamily,
                                                minHeight: '60px'
                                            }}
                                            rows={3}
                                        />
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: '8px',
                                            marginTop: '8px'
                                        }}>
                                            <button
                                                onClick={handleCancelEdit}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.1)',
                                                    border: 'none',
                                                    borderRadius: PremiumStyles.radius.sm,
                                                    padding: '6px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    color: 'rgba(245, 245, 247, 0.7)',
                                                    fontSize: PremiumStyles.typography.sizes.xs
                                                }}
                                            >
                                                <X size={12} />
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSubmitEdit}
                                                disabled={!editText.trim()}
                                                style={{
                                                    background: editText.trim() ? 'rgba(10, 132, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                                                    border: 'none',
                                                    borderRadius: PremiumStyles.radius.sm,
                                                    padding: '6px 12px',
                                                    cursor: editText.trim() ? 'pointer' : 'not-allowed',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    color: 'rgba(245, 245, 247, 0.9)',
                                                    fontSize: PremiumStyles.typography.sizes.xs
                                                }}
                                            >
                                                <Check size={12} />
                                                Save & Send
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: msg.role === 'user'
                                            ? 'rgba(10, 132, 255, 0.15)'
                                            : PremiumStyles.colors.surface,
                                        borderRadius: msg.role === 'user'
                                            ? isMobile ? '14px 14px 4px 14px' : '16px 16px 4px 16px'
                                            : isMobile ? '14px 14px 14px 4px' : '16px 16px 16px 4px',
                                        padding: isMobile ? '10px 12px' : '12px 16px',
                                        border: msg.role === 'user'
                                            ? '1px solid rgba(10, 132, 255, 0.2)'
                                            : `1px solid ${PremiumStyles.colors.border}`
                                    }}>
                                        <div style={{
                                            fontSize: isMobile ? '0.85rem' : '0.93rem',
                                            lineHeight: 1.6,
                                            color: 'rgba(245, 245, 247, 0.75)'
                                        }}>
                                            {renderMessage(msg.content)}
                                        </div>
                                    </div>
                                )}

                                {/* Action buttons below message */}
                                {!isEditing && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        marginTop: '4px'
                                    }}>
                                        {/* Edit button for user messages */}
                                        {msg.role === 'user' && !isLoading && !streamingMessage && (
                                            <button
                                                onClick={() => handleStartEdit(msg)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    padding: '4px 8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: 'pointer',
                                                    color: PremiumStyles.colors.textTertiary,
                                                    fontSize: PremiumStyles.typography.sizes.xs,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = PremiumStyles.colors.textSecondary;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = PremiumStyles.colors.textTertiary;
                                                }}
                                            >
                                                <Pencil size={12} />
                                                Edit
                                            </button>
                                        )}

                                        {/* Retry button for last user message */}
                                        {showRetry && (
                                            <button
                                                onClick={retryLastMessage}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    padding: '4px 8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: 'pointer',
                                                    color: PremiumStyles.colors.textTertiary,
                                                    fontSize: PremiumStyles.typography.sizes.xs,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.color = PremiumStyles.colors.textSecondary;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.color = PremiumStyles.colors.textTertiary;
                                                }}
                                            >
                                                <RefreshCw size={12} />
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Streaming message */}
                {streamingMessage && (() => {
                    // Check if still in thinking mode (has <think> but no </think> yet)
                    const isThinking = streamingMessage.includes('<think>') && !streamingMessage.includes('</think>');

                    if (isThinking) {
                        return (
                            <div style={{
                                display: 'flex',
                                gap: isMobile ? '8px' : '12px',
                                alignItems: 'flex-start'
                            }}>
                                <div style={{
                                    width: isMobile ? '28px' : '32px',
                                    height: isMobile ? '28px' : '32px',
                                    borderRadius: PremiumStyles.radius.full,
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <Bot size={isMobile ? 14 : 16} color="rgba(245, 245, 247, 0.6)" />
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    borderRadius: PremiumStyles.radius.xl,
                                    padding: isMobile ? '8px 12px' : '10px 16px',
                                    border: `1px solid ${PremiumStyles.colors.border}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: isMobile ? '6px' : '8px'
                                }}>
                                    <div style={{
                                        width: isMobile ? '5px' : '6px',
                                        height: isMobile ? '5px' : '6px',
                                        borderRadius: '50%',
                                        background: 'rgba(245, 245, 247, 0.4)',
                                        animation: 'pulse 1.5s infinite'
                                    }} />
                                    <span style={{
                                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                                        color: 'rgba(245, 245, 247, 0.5)',
                                        fontStyle: 'italic'
                                    }}>
                                        Thinking...
                                    </span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div style={{
                            display: 'flex',
                            gap: isMobile ? '8px' : '12px',
                            alignItems: 'flex-start'
                        }}>
                            <div style={{
                                width: isMobile ? '28px' : '32px',
                                height: isMobile ? '28px' : '32px',
                                borderRadius: PremiumStyles.radius.full,
                                background: 'rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Bot size={isMobile ? 14 : 16} color="rgba(245, 245, 247, 0.6)" />
                            </div>
                            <div style={{
                                maxWidth: isMobile ? '85%' : '80%',
                                background: PremiumStyles.colors.surface,
                                borderRadius: isMobile ? '14px 14px 14px 4px' : '16px 16px 16px 4px',
                                padding: isMobile ? '10px 12px' : '12px 16px',
                                border: `1px solid ${PremiumStyles.colors.border}`
                            }}>
                                <div style={{
                                    fontSize: isMobile ? '0.85rem' : '0.93rem',
                                    lineHeight: 1.6,
                                    color: 'rgba(245, 245, 247, 0.75)'
                                }}>
                                    {renderMessage(streamingMessage)}
                                    <span style={{
                                        display: 'inline-block',
                                        width: isMobile ? '6px' : '8px',
                                        height: isMobile ? '14px' : '16px',
                                        background: 'rgba(245, 245, 247, 0.5)',
                                        marginLeft: '2px',
                                        animation: 'blink 1s infinite'
                                    }} />
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Loading indicator */}
                {isLoading && !streamingMessage && (
                    <div style={{
                        display: 'flex',
                        gap: isMobile ? '8px' : '12px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{
                            width: isMobile ? '28px' : '32px',
                            height: isMobile ? '28px' : '32px',
                            borderRadius: PremiumStyles.radius.full,
                            background: 'rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Bot size={isMobile ? 14 : 16} color="rgba(245, 245, 247, 0.6)" />
                        </div>
                        <div style={{
                            background: PremiumStyles.colors.surface,
                            borderRadius: PremiumStyles.radius.xl,
                            padding: isMobile ? '10px 16px' : '12px 20px',
                            border: `1px solid ${PremiumStyles.colors.border}`
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: isMobile ? '3px' : '4px'
                            }}>
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        style={{
                                            width: isMobile ? '6px' : '8px',
                                            height: isMobile ? '6px' : '8px',
                                            borderRadius: PremiumStyles.radius.full,
                                            background: 'rgba(245, 245, 247, 0.5)',
                                            animation: `bounce 1.4s infinite ease-in-out`,
                                            animationDelay: `${i * 0.16}s`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Error display */}
                {error && (
                    <div style={{
                        background: 'rgba(255, 69, 58, 0.1)',
                        border: '1px solid rgba(255, 69, 58, 0.3)',
                        borderRadius: PremiumStyles.radius.md,
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '10px',
                        color: PremiumStyles.colors.error,
                        fontSize: isMobile ? PremiumStyles.typography.sizes.xs : PremiumStyles.typography.sizes.sm
                    }}>
                        <AlertCircle size={isMobile ? 14 : 16} />
                        {error}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} style={{
                padding: isMobile ? '12px 14px' : '16px 20px',
                borderTop: `1px solid ${PremiumStyles.colors.border}`,
                background: PremiumStyles.colors.surface
            }}>
                <div style={{
                    display: 'flex',
                    gap: isMobile ? '8px' : '12px',
                    alignItems: 'center'
                }}>
                    <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isMobile ? "Ask a question..." : "Ask about pointers, functions, errors..."}
                        disabled={isLoading}
                        rows={1}
                        style={{
                            flex: 1,
                            background: PremiumStyles.colors.surfaceHover,
                            border: `1px solid ${PremiumStyles.colors.border}`,
                            borderRadius: isMobile ? PremiumStyles.radius.md : PremiumStyles.radius.lg,
                            padding: isMobile ? '10px 12px' : '12px 16px',
                            fontSize: isMobile ? PremiumStyles.typography.sizes.xs : PremiumStyles.typography.sizes.sm,
                            color: 'rgba(245, 245, 247, 0.8)',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: PremiumStyles.typography.fontFamily,
                            transition: 'border-color 0.2s ease',
                            minHeight: isMobile ? '40px' : '44px',
                            maxHeight: isMobile ? '80px' : '120px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                        onBlur={(e) => e.target.style.borderColor = PremiumStyles.colors.border}
                    />

                    {isLoading ? (
                        <button
                            type="button"
                            onClick={cancelStream}
                            style={{
                                background: 'rgba(245, 245, 247, 0.9)',
                                border: 'none',
                                borderRadius: isMobile ? PremiumStyles.radius.md : PremiumStyles.radius.lg,
                                padding: isMobile ? '10px' : '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <StopCircle size={isMobile ? 18 : 20} color="#000" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!inputMessage.trim()}
                            style={{
                                background: inputMessage.trim()
                                    ? 'rgba(255, 255, 255, 0.15)'
                                    : PremiumStyles.colors.surfaceHover,
                                border: 'none',
                                borderRadius: isMobile ? PremiumStyles.radius.md : PremiumStyles.radius.lg,
                                padding: isMobile ? '10px' : '12px',
                                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                opacity: inputMessage.trim() ? 1 : 0.5
                            }}
                        >
                            <Send size={isMobile ? 18 : 20} color={inputMessage.trim() ? 'rgba(245, 245, 247, 0.8)' : PremiumStyles.colors.textTertiary} />
                        </button>
                    )}
                </div>

                {/* Hide hint text on mobile to save space */}
                {!isMobile && (
                    <div style={{
                        marginTop: '8px',
                        fontSize: PremiumStyles.typography.sizes.xs,
                        color: PremiumStyles.colors.textMuted,
                        textAlign: 'center'
                    }}>
                        Press Enter to send, Shift+Enter for new line
                    </div>
                )}
            </form>

            {/* CSS for animations */}
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-6px); }
                }
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default AiTutorPanel;
