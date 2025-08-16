import React from 'react';
import { Play, Shuffle } from 'lucide-react';
import SemanticCodeEditor from '../Editor/SemanticCodeEditor';
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
            overflow: 'hidden'
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

            {/* Code Editor - Takes remaining space */}
            <div style={{
                ...premiumStyles.codeEditorContainer,
                flex: 1,
                padding: 0
            }}>
                <SemanticCodeEditor
                    value={playground.code}
                    onChange={(newCode) => setPlayground({...playground, code: newCode})}
                    height="100%"
                    theme="vs-dark"
                />
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
            </div>

            {/* Output Section - Overlay that doesn't affect layout */}
            {playground.output && (
                <div style={{
                    position: 'absolute',
                    top: '20%', // Start below header
                    right: '2rem',
                    width: '35%',
                    height: '50%', // Fixed height
                    ...premiumStyles.glassCard,
                    backgroundColor: PremiumStyles.colors.backgroundTertiary,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    overflow: 'auto',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                    zIndex: 10,
                    border: `2px solid ${PremiumStyles.colors.accent}`
                }}>
                    <h4 style={{
                        ...premiumStyles.headingMD,
                        margin: '0 0 0.5rem 0',
                        fontSize: '1rem'
                    }}>Output</h4>
                    <pre style={{
                        ...premiumStyles.textBase,
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        margin: 0
                    }}>
                        {playground.output}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default PlaygroundTab;