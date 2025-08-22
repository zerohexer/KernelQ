import React from 'react';
import { Play, Shuffle } from 'lucide-react';
import CodeMirrorKernelEditor from '../Editor/CodeMirrorKernelEditor';
import PremiumStyles from '../../styles/PremiumStyles';

const PlaygroundTab = ({
    playground,
    setPlayground,
    runPlaygroundCode,
    premiumStyles
}) => {
    return (
        <div style={{
            ...premiumStyles.glassCard,
            height: `calc(100vh - 100px)`,
            maxHeight: `calc(100vh - 100px)`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative' // For absolute positioning of output
        }}>
            {/* Header Section */}
            <div style={{ 
                flexShrink: 0,
                marginBottom: '1.5rem'
            }}>
                <h2 style={premiumStyles.headingLG}>Kernel Code Playground</h2>
                <p style={premiumStyles.textSecondary}>
                    Experiment with kernel code in a safe environment. Test your ideas and explore kernel concepts.
                </p>
            </div>

            {/* Main Content Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                gap: '1rem',
                overflow: 'hidden'
            }}>
                {/* Code Editor */}
                <div style={{
                    ...premiumStyles.codeEditorContainer,
                    flex: playground.output ? '1 1 65%' : '1 1 100%',
                    padding: 0,
                    transition: 'flex 0.3s ease'
                }}>
                    <CodeMirrorKernelEditor
                        value={playground.code}
                        onChange={(newCode) => setPlayground({...playground, code: newCode})}
                        height="100%"
                        theme="dark"
                        enableLSP={true}
                        lspServerUri="ws://localhost:3002/?stack=clangd11"
                        documentUri="file:///kernel/playground.c"
                        placeholder="// Write your kernel code here..."
                    />
                </div>

                {/* Output Section - Side by side with editor */}
                {playground.output && (
                    <div style={{
                        flex: '1 1 35%',
                        ...premiumStyles.glassCard,
                        backgroundColor: PremiumStyles.colors.backgroundTertiary,
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                        overflow: 'auto',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                        border: `2px solid ${PremiumStyles.colors.accent}`,
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <h4 style={{
                            ...premiumStyles.headingMD,
                            margin: '0 0 0.5rem 0',
                            fontSize: '1rem',
                            flexShrink: 0
                        }}>Output</h4>
                        <div style={{
                            flex: 1,
                            overflow: 'auto'
                        }}>
                            <pre style={{
                                ...premiumStyles.textBase,
                                fontSize: '0.75rem',
                                whiteSpace: 'pre-wrap',
                                margin: 0
                            }}>
                                {playground.output}
                            </pre>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Section */}
            <div style={{ 
                flexShrink: 0,
                display: 'flex', 
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1.5rem'
            }}>
                <button
                    style={premiumStyles.buttonPrimary}
                    onClick={() => runPlaygroundCode()}
                    disabled={playground.isRunning}
                >
                    <Play size={18} />
                    <span>Compile & Test</span>
                </button>
                <button
                    style={premiumStyles.buttonSecondary}
                    onClick={() => setPlayground({...playground, code: ''})}
                >
                    <Shuffle size={18} />
                    <span>Clear</span>
                </button>
                {playground.output && (
                    <button
                        style={premiumStyles.buttonSecondary}
                        onClick={() => setPlayground({...playground, output: null})}
                    >
                        ✕ Close Output
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlaygroundTab;