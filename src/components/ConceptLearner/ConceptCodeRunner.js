/**
 * ConceptCodeRunner - Interactive code editor with Run button for concept examples
 *
 * Renders an editable CodeMirror editor with:
 * - Run button to compile and execute kernel module
 * - Reset button to restore original code
 * - Clean output display (filtered from dmesg)
 */

import React, { useState, useCallback } from 'react';
import { Play, RotateCcw, Loader2, CheckCircle, XCircle } from 'lucide-react';
import CodeMirrorKernelEditor from '../Editor/CodeMirrorKernelEditor';
import PremiumStyles from '../../styles/PremiumStyles';

const ConceptCodeRunner = ({
    title = 'Example',
    module = 'example',
    initialCode = '',
    height = '670px'
}) => {
    const [code, setCode] = useState(initialCode);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');

    const handleRun = useCallback(async () => {
        setIsRunning(true);
        setOutput('');
        setStatus(null);
        setErrorMessage('');

        try {
            const response = await fetch('/api/concept-run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    moduleName: module
                })
            });

            const data = await response.json();

            if (data.success) {
                setOutput(data.output || 'Module loaded successfully (no output)');
                setStatus('success');
            } else {
                setOutput(data.output || '');
                setErrorMessage(data.error || 'Compilation failed');
                setStatus('error');
            }
        } catch (error) {
            setErrorMessage(`Network error: ${error.message}`);
            setStatus('error');
        } finally {
            setIsRunning(false);
        }
    }, [code, module]);

    const handleReset = useCallback(() => {
        setCode(initialCode);
        setOutput('');
        setStatus(null);
        setErrorMessage('');
    }, [initialCode]);

    return (
        <div style={{
            background: '#1a1a1c',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            marginBottom: '24px'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Traffic light dots */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255, 69, 58, 0.8)' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(255, 159, 10, 0.8)' }} />
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'rgba(50, 215, 75, 0.8)' }} />
                    </div>
                    <span style={{
                        fontSize: '0.8rem',
                        color: PremiumStyles.colors.textSecondary,
                        fontFamily: PremiumStyles.typography.fontFamilyMono
                    }}>
                        {title}
                    </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleReset}
                        disabled={isRunning || code === initialCode}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: PremiumStyles.colors.textSecondary,
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: code === initialCode ? 'not-allowed' : 'pointer',
                            opacity: code === initialCode ? 0.5 : 1,
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (code !== initialCode) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }}
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            background: isRunning
                                ? 'rgba(50, 215, 75, 0.2)'
                                : 'linear-gradient(135deg, rgba(50, 215, 75, 0.3) 0%, rgba(50, 215, 75, 0.2) 100%)',
                            border: '1px solid rgba(50, 215, 75, 0.4)',
                            borderRadius: '6px',
                            color: '#32d74b',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isRunning) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(50, 215, 75, 0.4) 0%, rgba(50, 215, 75, 0.3) 100%)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isRunning) {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(50, 215, 75, 0.3) 0%, rgba(50, 215, 75, 0.2) 100%)';
                            }
                        }}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                Running...
                            </>
                        ) : (
                            <>
                                <Play size={14} />
                                Run
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Code Editor */}
            <div style={{ height }}>
                <CodeMirrorKernelEditor
                    value={code}
                    onChange={setCode}
                    height="100%"
                    readOnly={isRunning}
                />
            </div>

            {/* Output Section */}
            {(output || errorMessage || status) && (
                <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(0, 0, 0, 0.3)'
                }}>
                    {/* Output Header */}
                    <div style={{
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                    }}>
                        {status === 'success' && (
                            <CheckCircle size={14} color="#32d74b" />
                        )}
                        {status === 'error' && (
                            <XCircle size={14} color="#ff453a" />
                        )}
                        <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: status === 'success' ? '#32d74b' :
                                   status === 'error' ? '#ff453a' :
                                   PremiumStyles.colors.textSecondary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            {status === 'success' ? 'Output' :
                             status === 'error' ? 'Error' : 'Output'}
                        </span>
                    </div>

                    {/* Output Content */}
                    <div style={{
                        padding: '12px 16px',
                        maxHeight: '200px',
                        overflow: 'auto'
                    }}>
                        {errorMessage && (
                            <pre style={{
                                margin: 0,
                                padding: 0,
                                fontFamily: PremiumStyles.typography.fontFamilyMono,
                                fontSize: '0.8rem',
                                lineHeight: 1.6,
                                color: '#ff453a',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {errorMessage}
                            </pre>
                        )}
                        {output && (
                            <pre style={{
                                margin: errorMessage ? '8px 0 0 0' : 0,
                                padding: 0,
                                fontFamily: PremiumStyles.typography.fontFamilyMono,
                                fontSize: '0.8rem',
                                lineHeight: 1.6,
                                color: status === 'success' ? '#32d74b' : '#a1a1aa',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {output}
                            </pre>
                        )}
                    </div>
                </div>
            )}

            {/* CSS for spinner animation */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ConceptCodeRunner;
