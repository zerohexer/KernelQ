import React, { useState } from 'react';
import { Play, RotateCcw, Terminal, Code, Loader2 } from 'lucide-react';
import CodeMirrorKernelEditor from '../Editor/CodeMirrorKernelEditor';
import PremiumStyles from '../../styles/PremiumStyles';
import useIsMobile from '../../hooks/useIsMobile';

const PlaygroundTab = ({
    playground,
    setPlayground,
    runPlaygroundCode,
    premiumStyles
}) => {
    const [isHoveringRun, setIsHoveringRun] = useState(false);
    const isMobile = useIsMobile();

    // Dynamic LSP server URL based on environment
    const getLspServerUri = () => {
        if (window.location.hostname === 'localhost') {
            return 'ws://localhost:3002/?stack=clangd11';
        } else {
            return 'wss://lsp.kernelq.com/?stack=clangd11';
        }
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: isMobile ? '16px' : '24px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: isMobile ? '12px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            height: 'calc(100% + 20px)',
            maxHeight: 'calc(100% + 20px)',
            gap: isMobile ? '12px' : '24px'
        }}>
            {/* Header Section */}
            <div>
                <h1 style={{
                    fontSize: isMobile ? '1.25rem' : '1.5rem',
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: isMobile ? '4px' : '8px',
                    letterSpacing: '-0.02em',
                    color: '#f5f5f7'
                }}>
                    Code Playground
                </h1>
                {!isMobile && (
                    <p style={{
                        ...premiumStyles.textSecondary,
                        margin: 0,
                        fontSize: '0.9375rem'
                    }}>
                        Experiment with kernel code in a safe, sandboxed environment
                    </p>
                )}
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '16px' : '20px',
                minHeight: 0
            }}>
                {/* Code Editor Panel */}
                <div style={{
                    flex: isMobile
                        ? (playground.output ? '0 0 50%' : '1 1 100%')
                        : (playground.output ? '1 1 60%' : '1 1 100%'),
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: isMobile ? '200px' : 0,
                    transition: 'flex 0.3s ease'
                }}>
                    {/* Editor Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px 16px 0 0',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                        <Code size={16} color={PremiumStyles.colors.accent} />
                        <span style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: PremiumStyles.colors.text,
                            letterSpacing: '0.01em'
                        }}>
                            playground.c
                        </span>

                        {/* Action Buttons */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginLeft: 'auto'
                        }}>
                            {/* Clear Button */}
                            <button
                                onClick={() => setPlayground({ ...playground, code: '', output: null })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    color: PremiumStyles.colors.textSecondary,
                                    fontSize: '0.93rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.color = PremiumStyles.colors.text;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                    e.currentTarget.style.color = PremiumStyles.colors.textSecondary;
                                }}
                            >
                                <RotateCcw size={14} />
                                Clear
                            </button>

                            {/* Run Button */}
                            <button
                                onClick={() => runPlaygroundCode()}
                                disabled={playground.isRunning}
                                onMouseEnter={() => setIsHoveringRun(true)}
                                onMouseLeave={() => setIsHoveringRun(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 14px',
                                    background: playground.isRunning
                                        ? 'rgba(50, 215, 75, 0.3)'
                                        : PremiumStyles.gradients.green,
                                    borderRadius: '8px',
                                    border: 'none',
                                    color: '#000',
                                    fontSize: '0.93rem',
                                    fontWeight: 600,
                                    cursor: playground.isRunning ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isHoveringRun && !playground.isRunning
                                        ? '0 4px 12px rgba(50, 215, 75, 0.4)'
                                        : '0 2px 8px rgba(50, 215, 75, 0.2)'
                                }}
                            >
                                {playground.isRunning ? (
                                    <>
                                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                        Compiling...
                                    </>
                                ) : (
                                    <>
                                        <Play size={14} fill="currentColor" />
                                        Compile & Test
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Editor */}
                    <div style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: '0 0 16px 16px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderTop: 'none',
                        overflow: 'hidden',
                        minHeight: 0
                    }}>
                        <CodeMirrorKernelEditor
                            value={playground.code}
                            onChange={(newCode) => setPlayground({ ...playground, code: newCode })}
                            height="100%"
                            theme="dark"
                            enableLSP={true}
                            lspServerUri={getLspServerUri()}
                            documentUri="file:///kernel/playground.c"
                        />
                    </div>
                </div>

                {/* Output Panel */}
                {playground.output && (
                    <div style={{
                        flex: isMobile ? '0 0 50%' : '1 1 40%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: isMobile ? '200px' : 0,
                        animation: isMobile ? 'none' : 'slideInRight 0.3s ease'
                    }}>
                        {/* Output Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: 'rgba(50, 215, 75, 0.08)',
                            borderRadius: '16px 16px 0 0',
                            borderBottom: '1px solid rgba(50, 215, 75, 0.15)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <Terminal size={16} color={PremiumStyles.colors.accent} />
                                <span style={{
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    color: PremiumStyles.colors.text,
                                    letterSpacing: '0.01em'
                                }}>
                                    Output
                                </span>
                            </div>
                            <button
                                onClick={() => setPlayground({ ...playground, output: null })}
                                style={{
                                    padding: '6px 12px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    borderRadius: '8px',
                                    border: 'none',
                                    color: PremiumStyles.colors.textSecondary,
                                    fontSize: '0.93rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Close
                            </button>
                        </div>

                        {/* Output Content */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '0 0 16px 16px',
                            border: '1px solid rgba(50, 215, 75, 0.15)',
                            borderTop: 'none',
                            overflow: 'auto',
                            padding: '16px',
                            minHeight: 0
                        }}>
                            <pre style={{
                                margin: 0,
                                fontSize: '1rem',
                                lineHeight: 1.6,
                                color: PremiumStyles.colors.text,
                                fontFamily: PremiumStyles.typography.fontFamilyMono,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {playground.output}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaygroundTab;
