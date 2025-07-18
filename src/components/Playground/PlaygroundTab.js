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
        <div style={premiumStyles.glassCard}>
            <h2 style={premiumStyles.headingLG}>Kernel Code Playground</h2>
            <p style={premiumStyles.textSecondary}>
                Experiment with kernel code in a safe environment. Test your ideas and explore kernel concepts.
            </p>

            <div style={{ marginTop: '2rem' }}>
                <div style={premiumStyles.codeEditorContainer}>
                    <SemanticCodeEditor
                        value={playground.code}
                        onChange={(newCode) => setPlayground({...playground, code: newCode})}
                        height="400px"
                        theme="vs-dark"
                    />
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
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

                {playground.output && (
                    <div style={{
                        ...premiumStyles.glassCard,
                        marginTop: '1rem',
                        backgroundColor: PremiumStyles.colors.backgroundTertiary,
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
                    }}>
                        <h4 style={premiumStyles.headingMD}>Output</h4>
                        <pre style={{
                            ...premiumStyles.textBase,
                            fontSize: '0.875rem',
                            whiteSpace: 'pre-wrap',
                            margin: 0
                        }}>
                            {playground.output}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaygroundTab;