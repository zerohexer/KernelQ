import React, { useState } from 'react';
import { Target, Book, Star, Zap, Code, Terminal, Play, Timer, Shuffle } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';
import ResizableSplitter from '../Layout/ResizableSplitter';
import MultiFileEditor from '../Editor/MultiFileEditor';
import SemanticCodeEditor from '../Editor/SemanticCodeEditor';
import TestResultsView from './TestResultsView';

const ChallengeView = ({
    challenge,
    codeEditor,
    onCodeChange,
    onRun,
    onReset,
    onShowHints,
    onShowConcepts,
    detectUnfamiliarConcepts,
    getConcept,
    setSelectedConcept,
    switchToTab
}) => {
    const [activeTab, setActiveTab] = useState('code');
    const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Initial width as percentage - splitter moved left for more code space
    
    if (!challenge) {
        return (
            <div style={{ 
                ...PremiumStyles.glass.light,
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: PremiumStyles.shadows.md,
                textAlign: 'center', 
                padding: '3rem 2rem' 
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <Target size={48} style={{ color: PremiumStyles.colors.primary, margin: '0 auto 1.5rem auto' }} />
                    <h2 style={{
                        fontSize: PremiumStyles.typography.sizes['2xl'],
                        fontWeight: PremiumStyles.typography.weights.semibold,
                        color: PremiumStyles.colors.text,
                        marginBottom: '1rem',
                        letterSpacing: '-0.02em'
                    }}>No Active Challenge</h2>
                    <p style={{
                        fontSize: PremiumStyles.typography.sizes.sm,
                        color: PremiumStyles.colors.textSecondary,
                        lineHeight: '1.5'
                    }}>
                        Select a problem from the "Problem Bank" to get started.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                        <button
                            style={{ 
                                background: `linear-gradient(135deg, ${PremiumStyles.colors.primary} 0%, ${PremiumStyles.colors.primaryDark} 100%)`,
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '0.75rem 1.5rem',
                                fontSize: PremiumStyles.typography.sizes.base,
                                fontWeight: PremiumStyles.typography.weights.semibold,
                                cursor: 'pointer',
                                transition: PremiumStyles.animations.transition,
                                boxShadow: PremiumStyles.shadows.md,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontFamily: PremiumStyles.typography.fontFamily
                            }}
                            onClick={() => switchToTab('problemBank')}
                        >
                            <Book size={18} />
                            <span>Browse Problem Bank</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { title, description, difficulty, xp, phase, starter, validation, inputOutput } = challenge;
    
    return (
        <div style={{ 
            background: 'rgba(29, 29, 31, 0.8)', 
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden',
            minHeight: `calc(100vh - 100px)`,
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            {/* Subtle background glow effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)'
            }} />
            
            {/* Main Resizable Layout: Header + Description + Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <ResizableSplitter 
                    leftPanelWidth={leftPanelWidth}
                    onWidthChange={setLeftPanelWidth}
                >
                {/* Left Panel: Header + Description & Requirements */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '24px', 
                    paddingRight: '20px',
                    height: '100%',
                    overflow: 'auto'
                }}>
                    {/* Challenge Header */}
                    <div style={{ 
                        marginBottom: '8px',
                        flexShrink: 0
                    }}>
                        <h2 style={{ 
                            fontSize: 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
                            fontWeight: 700,
                            color: '#f5f5f7',
                            margin: 0,
                            marginBottom: '16px',
                            letterSpacing: '-0.025em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                        }}>
                            {challenge.id ? `#${challenge.id}: ${title}` : title}
                        </h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                                background: difficulty <= 3 ? 
                                    'linear-gradient(135deg, #30d158 0%, #bf5af2 100%)' :
                                    difficulty <= 6 ?
                                    'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)' :
                                    'linear-gradient(135deg, #ff453a 0%, #bf5af2 100%)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}>
                                <Star size={14} />
                                <span>Level {difficulty}</span>
                            </span>
                            <span style={{
                                background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}>
                                <Zap size={14} />
                                <span>{xp} XP</span>
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                color: '#f5f5f7',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                border: '1px solid rgba(255, 255, 255, 0.15)'
                            }}>
                                {phase}
                            </span>
                            {challenge.id && (
                                <span style={{
                                    background: 'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)',
                                    color: 'white',
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    border: 'none',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                                }}>
                                    <Book size={14} />
                                    <span>From Problem Bank</span>
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '24px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ 
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: 0,
                            marginBottom: '16px',
                            letterSpacing: '-0.02em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                        }}>
                            Problem Description
                        </h3>
                        <p style={{ 
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: 'rgba(245, 245, 247, 0.8)',
                            margin: 0,
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                            {description}
                        </p>
                    </div>
                    
                    {(validation?.exactRequirements || inputOutput?.requirements) && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '24px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <h4 style={{ 
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '16px',
                                letterSpacing: '-0.015em',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                            }}>
                                Requirements
                            </h4>
                            <ul style={{ 
                                fontSize: '0.95rem',
                                lineHeight: '1.6',
                                color: 'rgba(245, 245, 247, 0.7)',
                                paddingLeft: '20px',
                                margin: 0,
                                listStyleType: 'none'
                            }}>
                                {/* Header Requirements Section */}
                                {((validation?.exactRequirements?.variables && validation.exactRequirements.variables.length > 0) || 
                                  (validation?.exactRequirements?.mustContain && validation.exactRequirements.mustContain.some(item => item.includes('(') && !item.includes('='))) ||
                                  (validation?.testCases?.find(tc => tc.id === 'function_declarations' || tc.id === 'function_declaration')?.expectedSymbols?.length > 0)
                                ) && (
                                    <>
                                        <li style={{
                                            marginBottom: '16px',
                                            paddingLeft: '0',
                                            fontWeight: 600,
                                            color: '#ff9f0a',
                                            fontSize: '1rem',
                                            borderBottom: '1px solid rgba(255, 159, 10, 0.2)',
                                            paddingBottom: '8px'
                                        }}>
                                            Header File Requirements
                                        </li>
                                        {/* Display variables */}
                                        {validation?.exactRequirements?.variables?.map((variable, idx) => (
                                            <li key={`header-var-${idx}`} style={{ 
                                                marginBottom: '12px',
                                                position: 'relative',
                                                paddingLeft: '20px'
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '8px',
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: '#ff9f0a'
                                                }} />
                                                Declare variable: <code style={{ 
                                                    background: 'rgba(255, 159, 10, 0.15)',
                                                    border: '1px solid rgba(255, 159, 10, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#ff9f0a',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>{variable.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)' }}>({variable.type})</span>
                                            </li>
                                        ))}
                                        {/* Display function declarations from function_declarations test case */}
                                        {validation?.testCases?.find(tc => 
                                            tc.id === 'function_declarations' || tc.id === 'function_declaration'
                                        )?.expectedSymbols?.map((funcDecl, idx) => {
                                            // Parse function signature: "int add_numbers(int a, int b)" -> returnType: "int", name: "add_numbers", params: "(int a, int b)"
                                            const parseFunction = (signature) => {
                                                const match = signature.match(/(\w+)\s+(\w+)\s*(\([^)]*\))/);
                                                if (match) {
                                                    return {
                                                        returnType: match[1],
                                                        name: match[2],
                                                        params: match[3]
                                                    };
                                                }
                                                // Fallback for other patterns
                                                const parenIndex = signature.indexOf('(');
                                                if (parenIndex > 0) {
                                                    const beforeParen = signature.substring(0, parenIndex).trim();
                                                    const words = beforeParen.split(/\s+/);
                                                    const name = words[words.length - 1];
                                                    const returnType = words.length > 1 ? words[words.length - 2] : '';
                                                    const params = signature.substring(parenIndex);
                                                    return { returnType, name, params };
                                                }
                                                return { returnType: '', name: signature, params: '' };
                                            };
                                            
                                            const parsed = parseFunction(funcDecl);
                                            
                                            return (
                                                <li key={`header-func-${idx}`} style={{ 
                                                    marginBottom: '12px',
                                                    position: 'relative',
                                                    paddingLeft: '20px'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: '8px',
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        background: '#ffcc02'
                                                    }} />
                                                    Declare function: {' '}
                                                    {parsed.returnType && <code style={{ 
                                                        background: 'rgba(255, 204, 2, 0.15)',
                                                        border: '1px solid rgba(255, 204, 2, 0.3)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#ffcc02',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        marginRight: '6px'
                                                    }}>{parsed.returnType}</code>}
                                                    <code style={{ 
                                                        background: 'rgba(255, 204, 2, 0.15)',
                                                        border: '1px solid rgba(255, 204, 2, 0.3)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#ffcc02',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}>{parsed.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)' }}>{parsed.params}</span>
                                                </li>
                                            );
                                        })}
                                        <li style={{
                                            marginBottom: '24px',
                                            paddingLeft: '0'
                                        }}></li>
                                    </>
                                )}

                                {/* Source File Requirements Section */}
                                {(validation?.exactRequirements?.functionNames || validation?.exactRequirements?.outputMessages) && (
                                    <li style={{
                                        marginBottom: '16px',
                                        paddingLeft: '0',
                                        fontWeight: 600,
                                        color: '#ff9f0a',
                                        fontSize: '1rem',
                                        borderBottom: '1px solid rgba(255, 159, 10, 0.2)',
                                        paddingBottom: '8px'
                                    }}>
                                        Source File Requirements
                                    </li>
                                )}

                                {/* Show validation.exactRequirements if available */}
                                {validation?.exactRequirements?.variables?.map((variable, idx) => (
                                    <li key={`source-var-${idx}`} style={{ 
                                        marginBottom: '12px',
                                        position: 'relative',
                                        paddingLeft: '20px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '8px',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: '#ff9f0a'
                                        }} />
                                        Define variable: <code style={{ 
                                            background: 'rgba(255, 159, 10, 0.15)',
                                            border: '1px solid rgba(255, 159, 10, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#ff9f0a',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>{variable.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)' }}>({variable.type})</span>
                                        {variable.value && (
                                            <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}> = {variable.value}</span>
                                        )}
                                    </li>
                                ))}
                                {/* Display function signatures from function_signatures_source test case */}
                                {validation?.testCases?.some(tc => tc.id === 'function_signatures_source') && 
                                 validation?.testCases?.find(tc => tc.id === 'function_signatures_source')?.expectedSymbols?.map((funcSig, idx) => {
                                    // Parse function signature: "static int __init hello_init(void)" -> attributes: "__init", returnType: "int", name: "hello_init", params: "(void)"
                                    const parseFunction = (signature) => {
                                        // Match pattern: [static] [returnType] [__init/__exit] functionName(params)
                                        const fullMatch = signature.match(/(?:static\s+)?(\w+)\s+(?:(__init|__exit)\s+)?(\w+)\s*(\([^)]*\))/);
                                        if (fullMatch) {
                                            return {
                                                returnType: fullMatch[1],
                                                attribute: fullMatch[2] || '',  // __init, __exit, or empty
                                                name: fullMatch[3],
                                                params: fullMatch[4]
                                            };
                                        }
                                        
                                        // Fallback for simpler patterns without static
                                        const simpleMatch = signature.match(/(\w+)\s+(\w+)\s*(\([^)]*\))/);
                                        if (simpleMatch) {
                                            return {
                                                returnType: simpleMatch[1],
                                                attribute: '',
                                                name: simpleMatch[2],
                                                params: simpleMatch[3]
                                            };
                                        }
                                        
                                        // Final fallback
                                        const parenIndex = signature.indexOf('(');
                                        if (parenIndex > 0) {
                                            const beforeParen = signature.substring(0, parenIndex).trim();
                                            const words = beforeParen.split(/\s+/);
                                            const name = words[words.length - 1];
                                            const params = signature.substring(parenIndex);
                                            return { 
                                                returnType: '',
                                                attribute: '', 
                                                name, 
                                                params 
                                            };
                                        }
                                        return { 
                                            returnType: '',
                                            attribute: '', 
                                            name: signature, 
                                            params: '' 
                                        };
                                    };
                                    
                                    const parsed = parseFunction(funcSig);
                                    
                                    return (
                                        <li key={idx} style={{ 
                                            marginBottom: '12px',
                                            position: 'relative',
                                            paddingLeft: '20px'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '8px',
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: '#ffcc02'
                                            }} />
                                            Implement function: {' '}
                                            {parsed.attribute && <span style={{ color: 'rgba(255, 204, 2, 0.8)', marginRight: '6px' }}>{parsed.attribute}</span>}
                                            {parsed.returnType && <code style={{ 
                                                background: 'rgba(255, 204, 2, 0.15)',
                                                border: '1px solid rgba(255, 204, 2, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#ffcc02',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                marginRight: '6px'
                                            }}>{parsed.returnType}</code>}
                                            <code style={{ 
                                                background: 'rgba(255, 204, 2, 0.15)',
                                                border: '1px solid rgba(255, 204, 2, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#ffcc02',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>{parsed.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)' }}>{parsed.params}</span>
                                        </li>
                                    );
                                })}
                                {validation?.exactRequirements?.outputMessages?.map((msg, idx) => (
                                    <li key={idx} style={{ 
                                        marginBottom: '12px',
                                        position: 'relative',
                                        paddingLeft: '20px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '8px',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: '#30d158'
                                        }} />
                                        Output: <code style={{ 
                                            background: 'rgba(48, 209, 88, 0.15)',
                                            border: '1px solid rgba(48, 209, 88, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#30d158',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>"{msg}"</code>
                                    </li>
                                ))}
                                {validation?.exactRequirements?.requiredIncludes?.map((inc, idx) => (
                                    <li key={idx} style={{ 
                                        marginBottom: '12px',
                                        position: 'relative',
                                        paddingLeft: '20px'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '8px',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: '#bf5af2'
                                        }} />
                                        Include: <code style={{ 
                                            background: 'rgba(191, 90, 242, 0.15)',
                                            border: '1px solid rgba(191, 90, 242, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#bf5af2',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>&lt;{inc}&gt;</code>
                                    </li>
                                ))}
                                
                                {/* Show inputOutput.requirements only if exactRequirements doesn't exist */}
                                {!validation?.exactRequirements && inputOutput?.requirements?.map((req, idx) => (
                                    <li key={idx} style={{ 
                                        marginBottom: '12px',
                                        position: 'relative',
                                        paddingLeft: '20px',
                                        color: 'rgba(245, 245, 247, 0.8)'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '8px',
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: '#30d158'
                                        }} />
                                        {req}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {challenge.skills && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '24px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{ 
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '16px',
                                letterSpacing: '-0.015em',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                            }}>
                                Skills You'll Learn
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {challenge.skills.map((skill, idx) => (
                                    <span key={idx} style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(20px)',
                                        color: 'rgba(245, 245, 247, 0.8)',
                                        padding: '6px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        border: '1px solid rgba(255, 255, 255, 0.15)'
                                    }}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Editor & Output */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '20px', 
                    paddingLeft: '20px',
                    height: '100%',
                    overflow: 'hidden'
                }}>
                    {/* Tab Navigation */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '8px',
                        display: 'flex',
                        gap: '4px'
                    }}>
                        <button
                            onClick={() => setActiveTab('code')}
                            style={{
                                background: activeTab === 'code' ? 
                                    'linear-gradient(135deg, #007aff 0%, #0056b3 100%)' : 
                                    'transparent',
                                color: activeTab === 'code' ? 'white' : 'rgba(245, 245, 247, 0.7)',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                flex: 1,
                                justifyContent: 'center',
                                boxShadow: activeTab === 'code' ? '0 4px 16px rgba(0, 122, 255, 0.3)' : 'none'
                            }}
                        >
                            <Code size={18} />
                            <span>Code</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('results')}
                            style={{
                                background: activeTab === 'results' ? 
                                    'linear-gradient(135deg, #30d158 0%, #28a745 100%)' : 
                                    'transparent',
                                color: activeTab === 'results' ? 'white' : 'rgba(245, 245, 247, 0.7)',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                flex: 1,
                                justifyContent: 'center',
                                boxShadow: activeTab === 'results' ? '0 4px 16px rgba(48, 209, 88, 0.3)' : 'none',
                                position: 'relative'
                            }}
                        >
                            <Terminal size={18} />
                            <span>Results</span>
                            {codeEditor.output && (
                                <div style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: '#30d158',
                                    boxShadow: '0 0 6px rgba(48, 209, 88, 0.6)'
                                }} />
                            )}
                        </button>
                    </div>
                    
                    {/* Tab Content */}
                    {activeTab === 'code' && (
                        <>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}>
                                <div style={{ 
                                    padding: '24px',
                                    flex: 1
                                }}>
                                    <div style={{
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        height: '100%'
                                    }}>
                                        {/* Multi-file editor for projects with multiple files */}
                                        {codeEditor.files && codeEditor.files.length > 0 ? (
                                            <MultiFileEditor
                                                files={codeEditor.files}
                                                mainFile={challenge.mainFile}
                                                onFilesChange={onCodeChange}
                                                premiumStyles={PremiumStyles}
                                                height="100%"
                                                requiredFiles={challenge.requiredFiles || []}
                                                allowFileCreation={challenge.requiredFiles && challenge.requiredFiles.length > 0}
                                                allowFileDeletion={challenge.requiredFiles && challenge.requiredFiles.length > 0}
                                            />
                                        ) : (
                                            /* Legacy single-file editor */
                                            <SemanticCodeEditor
                                                key={challenge.id || challenge.title || 'editor'}
                                                value={codeEditor.code || challenge.starter || ''}
                                                onChange={onCodeChange}
                                                height="100%"
                                                theme="vs-dark"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '16px' }}>
                        <button 
                            style={{
                                background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                opacity: codeEditor.isRunning ? 0.6 : 1,
                                transform: 'translateY(0)',
                                ...(codeEditor.isRunning ? {} : {
                                    ':hover': {
                                        transform: 'translateY(-1px) scale(1.02)',
                                        boxShadow: '0 8px 24px rgba(0, 122, 255, 0.4)'
                                    }
                                })
                            }}
                            onClick={onRun} 
                            disabled={codeEditor.isRunning}
                            onMouseEnter={(e) => {
                                if (!codeEditor.isRunning) {
                                    e.target.style.transform = 'translateY(-1px) scale(1.02)';
                                    e.target.style.boxShadow = '0 8px 24px rgba(0, 122, 255, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0) scale(1)';
                                e.target.style.boxShadow = '0 4px 16px rgba(0, 122, 255, 0.3)';
                            }}
                        >
                            {codeEditor.isRunning ? <Timer size={18} /> : <Play size={18} />}
                            <span>{codeEditor.isRunning ? 'Testing...' : 'Run & Validate'}</span>
                        </button>
                        <button 
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                color: '#f5f5f7',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                            onClick={onReset}
                            onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            <Shuffle size={18} />
                            <span>Reset</span>
                        </button>
                            </div>
                        </>
                    )}
                    
                    {activeTab === 'results' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            {codeEditor.output || codeEditor.overallResult === 'COMPILATION_ERROR' || codeEditor.overallResult === 'PRE_COMPILATION_ERROR' ? (
                                <div style={{
                                    background: 'rgba(29, 29, 31, 0.9)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '0',
                                    flex: 1,
                                    overflow: 'hidden',
                                    fontFamily: 'SF Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
                                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                                    margin: '24px',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{
                                        padding: '20px 24px 16px 24px',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.02)'
                                    }}>
                                        <h4 style={{
                                            fontSize: '1.125rem',
                                            fontWeight: 600,
                                            color: '#f5f5f7',
                                            margin: 0,
                                            letterSpacing: '-0.015em',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                                        }}>
                                            Test Results
                                        </h4>
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        overflow: 'auto',
                                        padding: '24px'
                                    }}>
                                        <TestResultsView 
                                            testResults={codeEditor.testResults} 
                                            rawOutput={codeEditor.output}
                                            overallResult={codeEditor.overallResult}
                                            feedback={codeEditor.feedback}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '48px 24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    flex: 1
                                }}>
                                    <Terminal size={48} style={{ 
                                        color: 'rgba(245, 245, 247, 0.3)', 
                                        marginBottom: '16px' 
                                    }} />
                                    <h4 style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 600,
                                        color: 'rgba(245, 245, 247, 0.6)',
                                        margin: 0,
                                        marginBottom: '8px',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                                    }}>
                                        No Test Results Yet
                                    </h4>
                                    <p style={{
                                        color: 'rgba(245, 245, 247, 0.4)',
                                        margin: 0,
                                        marginBottom: '24px',
                                        fontSize: '0.9rem'
                                    }}>
                                        Run your code to see the results here
                                    </p>
                                    <button 
                                        style={{
                                            background: 'linear-gradient(135deg, #30d158 0%, #28a745 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '12px',
                                            padding: '12px 24px',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 4px 16px rgba(48, 209, 88, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                            opacity: codeEditor.isRunning ? 0.6 : 1
                                        }}
                                        onClick={() => {
                                            onRun();
                                            // Results will automatically appear in this tab after execution
                                        }}
                                        disabled={codeEditor.isRunning}
                                    >
                                        {codeEditor.isRunning ? <Timer size={18} /> : <Play size={18} />}
                                        <span>{codeEditor.isRunning ? 'Testing...' : 'Run & Validate'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ResizableSplitter>
            </div>
        </div>
    );
};

export default ChallengeView;
