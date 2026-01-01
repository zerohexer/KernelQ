import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, StopCircle, Bot, User, AlertCircle, Lightbulb, Code, HelpCircle, RefreshCw } from 'lucide-react';

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
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    // Use aiTutor state from parent component (persists across tab switches)
    const {
        chatHistory,
        isLoading,
        error,
        streamingMessage,
        sendMessage,
        clearHistory,
        cancelStream,
        retryLastMessage,
        requestErrorHelp,
        askAboutFunction,
        hasHistory
    } = aiTutor;

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory, streamingMessage]);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

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

    // Render inline formatting (bold, inline code)
    const renderInlineFormatting = (text, keyPrefix = '') => {
        if (!text) return text;

        // Split by inline code first
        return text.split(/(`[^`]+`)/g).map((segment, segIdx) => {
            if (segment.startsWith('`') && segment.endsWith('`')) {
                return (
                    <code key={`${keyPrefix}-code-${segIdx}`} style={{
                        background: 'rgba(255, 214, 10, 0.15)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'SF Mono, Monaco, monospace',
                        fontSize: '0.85em',
                        color: '#ffd60a'
                    }}>
                        {segment.slice(1, -1)}
                    </code>
                );
            }
            // Handle bold
            return segment.split(/(\*\*[^*]+\*\*)/g).map((boldPart, boldIdx) => {
                if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
                    return <strong key={`${keyPrefix}-bold-${boldIdx}`}>{boldPart.slice(2, -2)}</strong>;
                }
                return boldPart;
            });
        });
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
                        borderRadius: '8px',
                        padding: '12px',
                        margin: '12px 0',
                        overflow: 'auto',
                        fontSize: '0.8rem',
                        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        {language && (
                            <div style={{
                                color: 'rgba(255, 255, 255, 0.4)',
                                fontSize: '0.7rem',
                                marginBottom: '8px',
                                textTransform: 'uppercase'
                            }}>
                                {language}
                            </div>
                        )}
                        <code style={{ color: '#e6e6e6' }}>{code}</code>
                    </pre>
                );
            }

            // Process regular text line by line for headers, lists, blockquotes
            const lines = part.split('\n');
            return (
                <div key={idx}>
                    {lines.map((line, lineIdx) => {
                        const trimmedLine = line.trim();

                        // Headers
                        if (trimmedLine.startsWith('### ')) {
                            return (
                                <div key={lineIdx} style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    color: '#ffd60a',
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
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: '#f5f5f7',
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
                                    borderLeft: '3px solid #ffd60a',
                                    paddingLeft: '12px',
                                    margin: '8px 0',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontStyle: 'italic'
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
                                    <span style={{ color: '#ffd60a', fontWeight: 600, minWidth: '20px' }}>
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
                                    <span style={{ color: '#ffd60a' }}>•</span>
                                    <span>{renderInlineFormatting(trimmedLine.slice(2), `bullet-${lineIdx}`)}</span>
                                </div>
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
            background: '#1a1a1e',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot size={20} color="#ffd60a" />
                    <span style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: '#f5f5f7'
                    }}>
                        AI Tutor
                    </span>
                    <span style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.4)',
                        background: 'rgba(255, 214, 10, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '4px'
                    }}>
                        Socratic Mode
                    </span>
                </div>
                {hasHistory && (
                    <button
                        onClick={clearHistory}
                        style={{
                            background: 'rgba(255, 69, 58, 0.1)',
                            border: '1px solid rgba(255, 69, 58, 0.2)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            color: '#ff453a',
                            fontSize: '0.75rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'}
                    >
                        <Trash2 size={12} />
                        Clear
                    </button>
                )}
            </div>

            {/* Quick Actions (shown when no chat history) */}
            {!hasHistory && (
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        marginBottom: '12px'
                    }}>
                        Quick Actions
                    </div>
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        {/* Error help button */}
                        {hasError && (
                            <button
                                onClick={() => requestErrorHelp(codeEditor.output)}
                                style={{
                                    background: 'rgba(255, 69, 58, 0.1)',
                                    border: '1px solid rgba(255, 69, 58, 0.3)',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    color: '#ff6961',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'}
                            >
                                <AlertCircle size={14} />
                                Help with error
                            </button>
                        )}

                        {/* Function help buttons */}
                        {functionNames.slice(0, 4).map((fn, idx) => (
                            <button
                                key={idx}
                                onClick={() => askAboutFunction(fn)}
                                style={{
                                    background: 'rgba(255, 214, 10, 0.08)',
                                    border: '1px solid rgba(255, 214, 10, 0.2)',
                                    borderRadius: '8px',
                                    padding: '8px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    color: '#ffd60a',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 214, 10, 0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 214, 10, 0.08)'}
                            >
                                <Code size={14} />
                                {fn}()
                            </button>
                        ))}

                        {/* General help */}
                        <button
                            onClick={() => sendMessage("Where should I start with this problem?")}
                            style={{
                                background: 'rgba(50, 215, 75, 0.08)',
                                border: '1px solid rgba(50, 215, 75, 0.2)',
                                borderRadius: '8px',
                                padding: '8px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                color: '#32d74b',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(50, 215, 75, 0.15)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(50, 215, 75, 0.08)'}
                        >
                            <Lightbulb size={14} />
                            Where do I start?
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
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}
            >
                {/* Welcome message if no history */}
                {!hasHistory && !streamingMessage && (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: 'rgba(255, 255, 255, 0.4)'
                    }}>
                        <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <div style={{ fontSize: '1rem', marginBottom: '8px', color: 'rgba(255, 255, 255, 0.6)' }}>
                            I'm your Socratic C tutor
                        </div>
                        <div style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                            I won't give you direct solutions—instead, I'll guide you<br />
                            with questions, building blocks, and memory diagrams.<br />
                            <strong style={{ color: '#ffd60a' }}>You write every line yourself.</strong>
                        </div>
                    </div>
                )}

                {/* Chat history */}
                {chatHistory.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: msg.role === 'user'
                                ? 'linear-gradient(135deg, #0a84ff, #5e5ce6)'
                                : 'linear-gradient(135deg, #ffd60a, #ff9f0a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {msg.role === 'user'
                                ? <User size={16} color="#fff" />
                                : <Bot size={16} color="#000" />
                            }
                        </div>

                        {/* Message bubble */}
                        <div style={{
                            maxWidth: '80%',
                            background: msg.role === 'user'
                                ? 'rgba(10, 132, 255, 0.15)'
                                : 'rgba(255, 255, 255, 0.05)',
                            borderRadius: msg.role === 'user'
                                ? '16px 16px 4px 16px'
                                : '16px 16px 16px 4px',
                            padding: '12px 16px',
                            border: msg.role === 'user'
                                ? '1px solid rgba(10, 132, 255, 0.2)'
                                : '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <div style={{
                                fontSize: '0.875rem',
                                lineHeight: 1.6,
                                color: '#f5f5f7'
                            }}>
                                {renderMessage(msg.content)}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Streaming message */}
                {streamingMessage && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Bot size={16} color="#000" />
                        </div>
                        <div style={{
                            maxWidth: '80%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px 16px 16px 4px',
                            padding: '12px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <div style={{
                                fontSize: '0.875rem',
                                lineHeight: 1.6,
                                color: '#f5f5f7'
                            }}>
                                {renderMessage(streamingMessage)}
                                <span style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '16px',
                                    background: '#ffd60a',
                                    marginLeft: '2px',
                                    animation: 'blink 1s infinite'
                                }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && !streamingMessage && (
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                    }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Bot size={16} color="#000" />
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            padding: '12px 20px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: '4px'
                            }}>
                                {[0, 1, 2].map(i => (
                                    <div
                                        key={i}
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: '#ffd60a',
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
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#ff6961',
                        fontSize: '0.85rem'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-end'
                }}>
                    <textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about pointers, functions, errors..."
                        disabled={isLoading}
                        rows={1}
                        style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '0.9rem',
                            color: '#f5f5f7',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                            transition: 'border-color 0.2s ease',
                            minHeight: '44px',
                            maxHeight: '120px'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(255, 214, 10, 0.5)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />

                    {isLoading ? (
                        <button
                            type="button"
                            onClick={cancelStream}
                            style={{
                                background: 'rgba(255, 69, 58, 0.2)',
                                border: '1px solid rgba(255, 69, 58, 0.3)',
                                borderRadius: '12px',
                                padding: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <StopCircle size={20} color="#ff453a" />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={!inputMessage.trim()}
                            style={{
                                background: inputMessage.trim()
                                    ? 'linear-gradient(135deg, #ffd60a, #ff9f0a)'
                                    : 'rgba(255, 255, 255, 0.06)',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px',
                                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                opacity: inputMessage.trim() ? 1 : 0.5
                            }}
                        >
                            <Send size={20} color={inputMessage.trim() ? '#000' : '#666'} />
                        </button>
                    )}
                </div>

                <div style={{
                    marginTop: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.3)'
                    }}>
                        Press Enter to send, Shift+Enter for new line
                    </div>
                    {hasHistory && !isLoading && (
                        <button
                            type="button"
                            onClick={retryLastMessage}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '6px',
                                padding: '4px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.7rem',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                            }}
                        >
                            <RefreshCw size={12} />
                            Retry
                        </button>
                    )}
                </div>
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
