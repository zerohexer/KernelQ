import React, { useState, useEffect, useRef } from 'react';
import { Target, Book, Star, Zap, Code, Terminal, Play, Timer, Shuffle, Maximize2, Minimize2, HelpCircle, CheckCircle2, Circle, X } from 'lucide-react';
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
    const [expandedFunctionLinks, setExpandedFunctionLinks] = useState(new Set()); // Track which function links are expanded
    const [isFullScreen, setIsFullScreen] = useState(false); // True full-screen mode
    const [showFloatingHelp, setShowFloatingHelp] = useState(false); // Floating help modal
    const [completedRequirements, setCompletedRequirements] = useState(new Set()); // Track completed requirements
    const [editorFullScreen, setEditorFullScreen] = useState(false); // Editor full-screen within main full-screen
    const [activeFile, setActiveFile] = useState(challenge.mainFile || null); // Track active file across fullscreen toggles
    const [scrollPositions, setScrollPositions] = useState({}); // Track scroll positions per file across fullscreen toggles
    const scrollContainerRef = useRef(null); // Ref for scroll position preservation
    const floatingHelpScrollRef = useRef(null); // Ref for FloatingHelp modal scroll position

    // Keyboard shortcut handlers
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Shift+Z: Toggle floating help (only in full-screen mode)
            if (isFullScreen && event.altKey && event.key.toLowerCase() === 'z') {
                event.preventDefault();
                setShowFloatingHelp(prev => !prev);
            }
            
            // Shift+F: Toggle full-screen mode (works in any mode)
            if (event.altKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                setIsFullScreen(prev => !prev);
            }
            
            // Shift+C: Toggle editor full-screen (only in main full-screen mode)
            if (isFullScreen && event.altKey && event.key.toLowerCase() === 'c') {
                event.preventDefault();
                setEditorFullScreen(prev => !prev);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen]);

    // Helper function to extract function name from signature
    const extractFunctionName = (signature) => {
        // Find the opening parenthesis and work backwards to get function name
        const parenIndex = signature.indexOf('(');
        if (parenIndex === -1) return signature;

        const beforeParen = signature.substring(0, parenIndex).trim();
        const words = beforeParen.split(/\s+/);
        return words[words.length - 1]; // Last word before parenthesis is function name
    };

    // Dynamic function signature parser that handles complex return types
    const parseFunctionSignature = (signature) => {
        // Find the opening parenthesis - everything after is parameters
        const parenIndex = signature.indexOf('(');
        if (parenIndex === -1) {
            return { storageClass: '', returnType: '', attribute: '', name: signature, params: '' };
        }

        const beforeParen = signature.substring(0, parenIndex).trim();
        const params = signature.substring(parenIndex);
        const words = beforeParen.split(/\s+/);

        if (words.length === 0) {
            return { storageClass: '', returnType: '', attribute: '', name: signature, params: '' };
        }

        // Function name is always the last word before parenthesis
        const name = words[words.length - 1];

        // Check for storage class at the beginning
        const storageClasses = ['static', 'extern', 'auto', 'register', 'inline'];
        let storageClass = '';
        let startIndex = 0;

        if (words.length > 1 && storageClasses.includes(words[0])) {
            storageClass = words[0];
            startIndex = 1;
        }

        // Check for attributes (__init, __exit) near the end
        const attributes = ['__init', '__exit'];
        let attribute = '';
        let endIndex = words.length - 1; // Exclude function name

        if (words.length > 2 && attributes.includes(words[words.length - 2])) {
            attribute = words[words.length - 2];
            endIndex = words.length - 2;
        }

        // Everything between storage class and attribute/function name is return type
        const returnType = words.slice(startIndex, endIndex).join(' ');

        return {
            storageClass,
            returnType,
            attribute,
            name,
            params
        };
    };

    // Toggle function link expansion
    const toggleFunctionLink = (outputIndex) => {
        // For FloatingHelp modal, preserve scroll position naturally
        if (showFloatingHelp && floatingHelpScrollRef.current) {
            const scrollTop = floatingHelpScrollRef.current.scrollTop;
            
            const newExpanded = new Set(expandedFunctionLinks);
            if (newExpanded.has(outputIndex)) {
                newExpanded.delete(outputIndex);
            } else {
                newExpanded.add(outputIndex);
            }
            setExpandedFunctionLinks(newExpanded);
            
            // Use requestAnimationFrame for smooth, non-teleport restoration
            requestAnimationFrame(() => {
                if (floatingHelpScrollRef.current) {
                    floatingHelpScrollRef.current.scrollTop = scrollTop;
                }
            });
        } else {
            // Normal toggle for left panel (no scroll preservation needed)
            const newExpanded = new Set(expandedFunctionLinks);
            if (newExpanded.has(outputIndex)) {
                newExpanded.delete(outputIndex);
            } else {
                newExpanded.add(outputIndex);
            }
            setExpandedFunctionLinks(newExpanded);
        }
    };

    // Toggle requirement completion
    const toggleRequirement = (reqId) => {
        const newCompleted = new Set(completedRequirements);
        if (newCompleted.has(reqId)) {
            newCompleted.delete(reqId);
        } else {
            newCompleted.add(reqId);
        }
        setCompletedRequirements(newCompleted);
    };

    // Get compact requirements list
    const getCompactRequirements = () => {
        const requirements = [];
        
        // Add function implementations from source file requirements
        validation?.testCases?.find(tc => 
            tc.id === 'function_signatures_source'
        )?.expectedSymbols?.forEach((funcSig, idx) => {
            const funcName = extractFunctionName(funcSig);
            requirements.push({
                id: `func_impl_${idx}`,
                type: 'implementation',
                text: `Implement ${funcName}()`,
                details: funcSig
            });
        });

        // Add output messages from function-linked outputs or regular outputs
        const functionLinkedOutputs = inputOutput?.functionLinkedOutputs || [];
        const regularOutputs = validation?.exactRequirements?.outputMessages || [];
        
        // Use function-linked outputs first, then fall back to regular outputs
        const outputMessages = functionLinkedOutputs.length > 0 ? functionLinkedOutputs : regularOutputs;
        
        outputMessages.slice(0, 3).forEach((output, idx) => { // Limit to first 3 outputs
            const pattern = output.pattern || output;
            requirements.push({
                id: `output_${idx}`,
                type: 'output',
                text: `Output: "${pattern}"`,
                details: pattern
            });
        });

        return requirements;
    };

    // Floating Help Modal Component
    const FloatingHelp = () => {
        if (!showFloatingHelp) return null;

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <div style={{
                    background: 'rgba(29, 29, 31, 0.95)',
                    backdropFilter: 'blur(40px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                    paddingTop: '65px',
                    paddingLeft: '25px',
                    paddingRight: '40px',
                    paddingBottom: '17px',
                    width: '90vw',
                    maxWidth: '1200px',
                    height: '90vh',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Close Button */}
                    <button
                        onClick={() => setShowFloatingHelp(false)}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#f5f5f7',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>

                    {/* Scrollable Content Container */}
                    <div 
                        ref={floatingHelpScrollRef}
                        style={{ 
                            flex: 1, 
                            overflow: 'auto', 
                            paddingRight: '20px',
                            marginRight: '-20px',
                            scrollBehavior: 'auto'
                        }}
                        className="floating-help-scroll"
                    >
                        {/* Challenge Header */}
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{ 
                                fontSize: '1.875rem',
                                fontWeight: 700,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '16px',
                                letterSpacing: '-0.025em'
                            }}>
                                {challenge.id ? `#${challenge.id}: ${challenge.title}` : challenge.title}
                            </h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                                background: challenge.difficulty <= 3 ? 
                                    'linear-gradient(135deg, #30d158 0%, #bf5af2 100%)' :
                                    challenge.difficulty <= 6 ?
                                    'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)' :
                                    'linear-gradient(135deg, #ff453a 0%, #bf5af2 100%)',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Star size={14} />
                                <span>Level {challenge.difficulty}</span>
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
                                gap: '6px'
                            }}>
                                <Zap size={14} />
                                <span>{challenge.xp} XP</span>
                            </span>
                        </div>
                    </div>

                    {/* Problem Description */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '24px',
                        marginBottom: '24px'
                    }}>
                        <h3 style={{ 
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: 0,
                            marginBottom: '16px'
                        }}>
                            Problem Description
                        </h3>
                        <p style={{ 
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: 'rgba(245, 245, 247, 0.8)',
                            margin: 0
                        }}>
                            {challenge.description}
                        </p>
                    </div>

                    {/* Requirements - EXACT copy from original left panel requirements */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '24px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        marginBottom: '24px'
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
                            {((challenge.validation?.exactRequirements?.variables_declarations && challenge.validation.exactRequirements.variables_declarations.length > 0) || 
                              (challenge.validation?.exactRequirements?.mustContain && challenge.validation.exactRequirements.mustContain.some(item => item.includes('(') && !item.includes('='))) ||
                              (challenge.validation?.testCases?.find(tc => tc.id === 'function_declarations' || tc.id === 'function_declaration')?.expectedSymbols?.length > 0)
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
                                    {/* Display header variable declarations (no values) */}
                                    {challenge.validation?.exactRequirements?.variables_declarations?.map((variable, idx) => (
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
                                            Declare variable: {' '}
                                            {variable.storageClass && variable.storageClass !== 'none' && (
                                                <code style={{ 
                                                    background: 'rgba(255, 159, 10, 0.15)',
                                                    border: '1px solid rgba(255, 159, 10, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#ff9f0a',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    marginRight: '6px'
                                                }}>{variable.storageClass}</code>
                                            )}
                                            <code style={{ 
                                                background: 'rgba(255, 159, 10, 0.15)',
                                                border: '1px solid rgba(255, 159, 10, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#ff9f0a',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>{variable.type}</code> <code style={{ 
                                                background: 'rgba(255, 159, 10, 0.15)',
                                                border: '1px solid rgba(255, 159, 10, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#ff9f0a',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>{variable.name}</code>
                                            {variable.value && (
                                                <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}> {variable.value}</span>
                                            )}
                                        </li>
                                    ))}
                                    {/* Display header macro declarations in floating help */}
                                    {challenge.validation?.exactRequirements?.macro_declarations?.map((macro, idx) => (
                                        <li key={`floating-header-macro-${idx}`} style={{
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
                                                background: '#32d74b'
                                            }} />
                                            {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                                <>
                                                    Define macro: {' '}
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.15)',
                                                        border: '1px solid rgba(50, 215, 75, 0.3)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        marginRight: '6px'
                                                    }}>{macro.preprocessor}</code>
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.15)',
                                                        border: '1px solid rgba(50, 215, 75, 0.3)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                                </>
                                            ) : (
                                                <>
                                                    Define macro: {' '}
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.15)',
                                                        border: '1px solid rgba(50, 215, 75, 0.3)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        marginRight: '6px'
                                                    }}>#define</code>
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.15)',
                                                        border: '1px solid rgba(50, 215, 75, 0.3)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500
                                                    }}>{macro.name}</code>
                                                    {macro.type === 'function-like' && macro.parameters && (
                                                        <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.875rem' }}>
                                                            {' '}({macro.parameters.join(', ')})
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {macro.value && (
                                                macro.value.includes('\n') ? (
                                                    <span style={{
                                                        color: 'rgba(245, 245, 247, 0.5)',
                                                        fontSize: '0.875rem',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {' '}{macro.value}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}>
                                                        {' '}{macro.value}
                                                    </span>
                                                )
                                            )}
                                        </li>
                                    ))}
                                    {/* Display function declarations from function_declarations test case */}
                                    {challenge.validation?.testCases?.find(tc =>
                                        tc.id === 'function_declarations' || tc.id === 'function_declaration'
                                    )?.expectedSymbols?.map((funcDecl, idx) => {
                                        // Parse function signature dynamically for function declarations
                                        const parseFunction = (signature) => {
                                            const parsed = parseFunctionSignature(signature);
                                            return {
                                                returnType: parsed.returnType,
                                                name: parsed.name,
                                                params: parsed.params
                                            };
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
                            {(challenge.validation?.exactRequirements?.functionNames || challenge.validation?.exactRequirements?.outputMessages) && (
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
                            {challenge.validation?.exactRequirements?.variables?.map((variable, idx) => (
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
                                    Define variable: {' '}
                                    {variable.storageClass && variable.storageClass !== 'none' && (
                                        <code style={{ 
                                            background: 'rgba(255, 159, 10, 0.15)',
                                            border: '1px solid rgba(255, 159, 10, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#ff9f0a',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            marginRight: '6px'
                                        }}>{variable.storageClass}</code>
                                    )}
                                    <code style={{ 
                                        background: 'rgba(255, 159, 10, 0.15)',
                                        border: '1px solid rgba(255, 159, 10, 0.3)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                        color: '#ff9f0a',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}>{variable.type}</code> <code style={{ 
                                        background: 'rgba(255, 159, 10, 0.15)',
                                        border: '1px solid rgba(255, 159, 10, 0.3)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                        color: '#ff9f0a',
                                        fontSize: '0.875rem',
                                        fontWeight: 500
                                    }}>{variable.name}</code>
                                    {variable.value && (
                                        <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}> = {variable.value}</span>
                                    )}
                                </li>
                            ))}
                            {/* Display source macro definitions in floating help */}
                            {challenge.validation?.exactRequirements?.macro_definitions?.map((macro, idx) => (
                                <li key={`floating-source-macro-${idx}`} style={{
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
                                        background: '#32d74b'
                                    }} />
                                    {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                        <>
                                            Define macro: {' '}
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.15)',
                                                border: '1px solid rgba(50, 215, 75, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                marginRight: '6px'
                                            }}>{macro.preprocessor}</code>
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.15)',
                                                border: '1px solid rgba(50, 215, 75, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                        </>
                                    ) : (
                                        <>
                                            Define macro: {' '}
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.15)',
                                                border: '1px solid rgba(50, 215, 75, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                marginRight: '6px'
                                            }}>#define</code>
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.15)',
                                                border: '1px solid rgba(50, 215, 75, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>{macro.name}</code>
                                            {macro.type === 'function-like' && macro.parameters && (
                                                <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.875rem' }}>
                                                    {' '}({macro.parameters.join(', ')})
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {macro.value && (
                                        macro.value.includes('\n') ? (
                                            <span style={{
                                                color: 'rgba(245, 245, 247, 0.5)',
                                                fontSize: '0.875rem',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word'
                                            }}>
                                                {' '}{macro.value}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}>
                                                {' '}{macro.value}
                                            </span>
                                        )
                                    )}
                                </li>
                            ))}
                            {/* Display function signatures from function_signatures_source test case */}
                            {challenge.validation?.testCases?.some(tc => tc.id === 'function_signatures_source') && 
                             challenge.validation?.testCases?.find(tc => tc.id === 'function_signatures_source')?.expectedSymbols?.map((funcSig, idx) => {
                                // Parse function signature dynamically for function implementations
                                const parseFunction = parseFunctionSignature;
                                
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
                                        {parsed.storageClass && <code style={{ 
                                            background: 'rgba(255, 204, 2, 0.15)',
                                            border: '1px solid rgba(255, 204, 2, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#ffcc02',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            marginRight: '6px'
                                        }}>{parsed.storageClass}</code>}
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
                                        {parsed.attribute && <span style={{ color: 'rgba(255, 204, 2, 0.8)', marginRight: '6px' }}>{parsed.attribute}</span>}
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
                            {/* Function-linked outputs with collapsible function details */}
                            {challenge.inputOutput?.functionLinkedOutputs?.map((output, idx) => (
                                <li key={`linked-${idx}`} style={{ 
                                    marginBottom: expandedFunctionLinks.has(idx) ? '8px' : '16px',
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
                                    <div>
                                        Output: <code style={{ 
                                            background: 'rgba(48, 209, 88, 0.15)',
                                            border: '1px solid rgba(48, 209, 88, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#30d158',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>"{output.pattern}"</code>
                                    </div>
                                    <div style={{ 
                                        marginTop: '8px',
                                        marginLeft: '4px',
                                        marginBottom: '-6px'
                                    }}>
                                        <button
                                            onClick={() => toggleFunctionLink(idx)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#B0B0FF',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '0px',
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                                transition: 'color 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = '#ffcc02'}
                                            onMouseLeave={(e) => e.target.style.color = '#B0B0FF'}
                                        >
                                            <span style={{
                                                fontSize: '0.7rem',
                                                transform: expandedFunctionLinks.has(idx) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.2s ease'
                                            }}>▶</span>
                                            View linked function
                                        </button>
                                        {expandedFunctionLinks.has(idx) && (
                                            <div style={{
                                                marginTop: '-7px',
                                                paddingLeft: '16px',
                                                padding: '10px 4px',
                                                borderRadius: '6px',
                                                contain: 'layout style',
                                                willChange: 'auto'
                                            }}>
                                                <code style={{ 
                                                    background: 'rgba(255, 204, 2, 0.15)',
                                                    border: '0px solid rgba(255, 204, 2, 0.3)',
                                                    padding: '8px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#ffcc02',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 500,
                                                    display: 'inline-block',
                                                    maxWidth: '100%',
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word'
                                                }}>{output.linkedFunction}</code>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {/* Include statements */}
                            {challenge.validation?.exactRequirements?.requiredIncludes?.map((include, idx) => (
                                <li key={`include-${idx}`} style={{ 
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
                                    }}>{include}</code>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Skills */}
                    {challenge.skills && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '24px'
                        }}>
                            <h4 style={{ 
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '16px'
                            }}>
                                Skills You'll Learn
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {challenge.skills.map((skill, idx) => (
                                    <span key={idx} style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
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
                </div>
            </div>
        );
    };
    
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
    
    // Full-screen mode - editor takes entire viewport
    if (isFullScreen) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                background: 'rgba(29, 29, 31, 0.95)',
                backdropFilter: 'blur(40px)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Full-screen Header Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <span style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#f5f5f7'
                        }}>
                            {challenge.id ? `#${challenge.id}: ${title}` : title}
                        </span>
                        <span style={{
                            background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                        }}>
                            Level {difficulty}
                        </span>
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>

                        <button
                            onClick={() => setShowFloatingHelp(true)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#f5f5f7',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.875rem',
                                fontWeight: 500
                            }}
                            title="Show problem details"
                        >
                            <span>Alt + Z - Show problem details</span>
                            <HelpCircle size={16} />
                        </button>

                        <button
                            onClick={() => setIsFullScreen(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#f5f5f7',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Minimize2 size={16} />
                        </button>
                    </div>
                </div>

                {/* Full-screen Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Tab Navigation */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '8px 24px',
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
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Code size={16} />
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
                                borderRadius: '8px',
                                padding: '8px 16px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                position: 'relative'
                            }}
                        >
                            <Terminal size={16} />
                            <span>Results</span>
                            {codeEditor.output && (
                                <div style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#30d158'
                                }} />
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div style={{ flex: 1, padding: '24px', overflow: 'hidden', minHeight: 0 }}>
                        {activeTab === 'code' && (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    overflow: 'hidden',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{ padding: '20px', flex: 1 }}>
                                        <div style={{
                                            borderRadius: '12px',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255, 255, 255, 0.15)',
                                            background: 'rgba(0, 0, 0, 0.3)',
                                            height: '100%'
                                        }}>
                                            {codeEditor.files && codeEditor.files.length > 0 ? (
                                                <MultiFileEditor
                                                    key={challenge.id || challenge.title || 'multi-file-editor'}
                                                    files={codeEditor.files}
                                                    mainFile={challenge.mainFile}
                                                    onFilesChange={onCodeChange}
                                                    premiumStyles={PremiumStyles}
                                                    height="100%"
                                                    requiredFiles={challenge.requiredFiles || []}
                                                    allowFileCreation={challenge.requiredFiles && challenge.requiredFiles.length > 0}
                                                    allowFileDeletion={challenge.requiredFiles && challenge.requiredFiles.length > 0}
                                                    parentFullScreen={true}
                                                    editorFullScreen={editorFullScreen}
                                                    onEditorFullScreenChange={setEditorFullScreen}
                                                    activeFile={activeFile}
                                                    onActiveFileChange={setActiveFile}
                                                    scrollPositions={scrollPositions}
                                                    onScrollPositionsChange={setScrollPositions}
                                                />
                                            ) : (
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
                                            boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            opacity: codeEditor.isRunning ? 0.6 : 1
                                        }}
                                        onClick={onRun} 
                                        disabled={codeEditor.isRunning}
                                    >
                                        {codeEditor.isRunning ? <Timer size={18} /> : <Play size={18} />}
                                        <span>{codeEditor.isRunning ? 'Testing...' : 'Run & Validate'}</span>
                                    </button>
                                    <button 
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            color: '#f5f5f7',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '12px',
                                            padding: '12px 24px',
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        onClick={onReset}
                                    >
                                        <Shuffle size={18} />
                                        <span>Reset</span>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'results' && (
                            <div style={{
                                height: '100%',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}>
                                {codeEditor.output || codeEditor.overallResult === 'COMPILATION_ERROR' || codeEditor.overallResult === 'PRE_COMPILATION_ERROR' ? (
                                    <div style={{
                                        background: 'rgba(29, 29, 31, 0.9)',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        flex: 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: 0
                                    }}>
                                        <div style={{
                                            padding: '20px 24px 16px 24px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            flexShrink: 0
                                        }}>
                                            <h4 style={{
                                                fontSize: '1.125rem',
                                                fontWeight: 600,
                                                color: '#f5f5f7',
                                                margin: 0
                                            }}>
                                                Test Results
                                            </h4>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                overflow: 'auto',
                                                padding: '24px 24px 60px 24px',
                                                minHeight: 0
                                            }}
                                            className="fullscreen-test-results-scroll"
                                        >
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
                                            marginBottom: '8px'
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
                                                boxShadow: '0 4px 16px rgba(48, 209, 88, 0.3)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                opacity: codeEditor.isRunning ? 0.6 : 1
                                            }}
                                            onClick={onRun}
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
                </div>

                <FloatingHelp />
                
                {/* CSS for better scrollbars */}
                <style>{`
                    .floating-help-scroll::-webkit-scrollbar,
                    .fullscreen-test-results-scroll::-webkit-scrollbar {
                        width: 8px;
                    }
                    .floating-help-scroll::-webkit-scrollbar-track,
                    .fullscreen-test-results-scroll::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }
                    .floating-help-scroll::-webkit-scrollbar-thumb,
                    .fullscreen-test-results-scroll::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.3);
                        border-radius: 4px;
                    }
                    .floating-help-scroll::-webkit-scrollbar-thumb:hover,
                    .fullscreen-test-results-scroll::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.5);
                    }

                    /* Force scrollbar to always be visible in fullscreen mode */
                    .fullscreen-test-results-scroll {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
                    }
                `}</style>
            </div>
        );
    }
    
    return (
        <div style={{
            background: 'rgba(29, 29, 31, 0.8)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            minHeight: 'calc(100% + 20px)',
            display: 'flex',
            flexDirection: 'column'
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                <ResizableSplitter
                    leftPanelWidth={leftPanelWidth}
                    onWidthChange={setLeftPanelWidth}
                >
                {/* Left Panel: Header + Description & Compact Requirements */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingLeft: '4px',
                    paddingRight: '8px',
                    paddingTop: '4px',
                    height: '100%',
                    overflow: 'auto'
                }}>
                    {/* Challenge Header */}
                    <div style={{
                        marginBottom: '4px',
                        flexShrink: 0
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: '8px'
                        }}>
                            <h2 style={{ 
                                fontSize: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
                                fontWeight: 700,
                                color: '#f5f5f7',
                                margin: 0,
                                letterSpacing: '-0.025em',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                                flex: 1
                            }}>
                                {challenge.id ? `#${challenge.id}: ${title}` : title}
                            </h2>
                            <button
                                onClick={() => setIsFullScreen(true)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#f5f5f7',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '16px',
                                    flexShrink: 0
                                }}
                                title="Alt + F - Full-screen coding mode"
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                                background: difficulty <= 3 ?
                                    'linear-gradient(135deg, #30d158 0%, #bf5af2 100%)' :
                                    difficulty <= 6 ?
                                    'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)' :
                                    'linear-gradient(135deg, #ff453a 0%, #bf5af2 100%)',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <Star size={11} />
                                <span>Level {difficulty}</span>
                            </span>
                            <span style={{
                                background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <Zap size={11} />
                                <span>{xp} XP</span>
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#f5f5f7',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                border: '1px solid rgba(255, 255, 255, 0.15)'
                            }}>
                                {phase}
                            </span>
                        </div>
                    </div>
                    
                    {/* Problem Description */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '12px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: 0,
                            marginBottom: '8px',
                            letterSpacing: '-0.02em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                        }}>
                            Problem Description
                        </h3>
                        <p style={{
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            color: 'rgba(245, 245, 247, 0.7)',
                            margin: 0,
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                            {description}
                        </p>
                    </div>


                    {/* Skills Preview */}
                    {challenge.skills && challenge.skills.length > 0 && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '12px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '10px',
                                letterSpacing: '-0.015em',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                            }}>
                                Requirements
                            </h4>
                            <ul style={{
                                fontSize: '0.85rem',
                                lineHeight: '1.5',
                                color: 'rgba(245, 245, 247, 0.7)',
                                paddingLeft: '16px',
                                margin: 0,
                                listStyleType: 'none'
                            }}>
                                {/* Header Requirements Section */}
                                {((validation?.exactRequirements?.variables_declarations && validation.exactRequirements.variables_declarations.length > 0) ||
                                  (validation?.exactRequirements?.macro_declarations && validation.exactRequirements.macro_declarations.length > 0) ||
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
                                        {/* Display header variable declarations (no values) */}
                                        {validation?.exactRequirements?.variables_declarations?.map((variable, idx) => (
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
                                                Declare variable: {' '}
                                                {variable.storageClass && variable.storageClass !== 'none' && (
                                                    <code style={{ 
                                                        background: 'rgba(255, 159, 10, 0.15)',
                                                        border: '1px solid rgba(255, 159, 10, 0.3)',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#ff9f0a',
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                        marginRight: '6px'
                                                    }}>{variable.storageClass}</code>
                                                )}
                                                <code style={{ 
                                                    background: 'rgba(255, 159, 10, 0.15)',
                                                    border: '1px solid rgba(255, 159, 10, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#ff9f0a',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>{variable.type}</code> <code style={{ 
                                                    background: 'rgba(255, 159, 10, 0.15)',
                                                    border: '1px solid rgba(255, 159, 10, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#ff9f0a',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>{variable.name}</code>
                                                {variable.value && (
                                                    <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}> {variable.value}</span>
                                                )}
                                            </li>
                                        ))}
                                        {/* Display header macro declarations */}
                                        {validation?.exactRequirements?.macro_declarations?.map((macro, idx) => (
                                            <li key={`header-macro-${idx}`} style={{
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
                                                    background: '#32d74b'
                                                }} />
                                                {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                                    <>
                                                        Define macro: {' '}
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.15)',
                                                            border: '1px solid rgba(50, 215, 75, 0.3)',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500,
                                                            marginRight: '6px'
                                                        }}>{macro.preprocessor}</code>
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.15)',
                                                            border: '1px solid rgba(50, 215, 75, 0.3)',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500
                                                        }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                                    </>
                                                ) : (
                                                    <>
                                                        Define macro: {' '}
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.15)',
                                                            border: '1px solid rgba(50, 215, 75, 0.3)',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500,
                                                            marginRight: '6px'
                                                        }}>#define</code>
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.15)',
                                                            border: '1px solid rgba(50, 215, 75, 0.3)',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.875rem',
                                                            fontWeight: 500
                                                        }}>{macro.name}</code>
                                                        {macro.type === 'function-like' && macro.parameters && (
                                                            <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.875rem' }}>
                                                                {' '}({macro.parameters.join(', ')})
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {macro.value && (
                                                    macro.value.includes('\n') ? (
                                                        <span style={{
                                                            color: 'rgba(245, 245, 247, 0.5)',
                                                            fontSize: '0.875rem',
                                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            {' '}{macro.value}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}>
                                                            {' '}{macro.value}
                                                        </span>
                                                    )
                                                )}
                                            </li>
                                        ))}
                                        {/* Display function declarations from function_declarations test case */}
                                        {validation?.testCases?.find(tc =>
                                            tc.id === 'function_declarations' || tc.id === 'function_declaration'
                                        )?.expectedSymbols?.map((funcDecl, idx) => {
                                            // Parse function signature dynamically for function declarations (left panel)
                                            const parseFunction = (signature) => {
                                                const parsed = parseFunctionSignature(signature);
                                                return {
                                                    returnType: parsed.returnType,
                                                    name: parsed.name,
                                                    params: parsed.params
                                                };
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
                                {(validation?.exactRequirements?.functionNames ||
                                  validation?.exactRequirements?.outputMessages ||
                                  (validation?.exactRequirements?.macro_definitions && validation.exactRequirements.macro_definitions.length > 0)
                                ) && (
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
                                        Define variable: {' '}
                                        {variable.storageClass && variable.storageClass !== 'none' && (
                                            <code style={{ 
                                                background: 'rgba(255, 159, 10, 0.15)',
                                                border: '1px solid rgba(255, 159, 10, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#ff9f0a',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                marginRight: '6px'
                                            }}>{variable.storageClass}</code>
                                        )}
                                        <code style={{ 
                                            background: 'rgba(255, 159, 10, 0.15)',
                                            border: '1px solid rgba(255, 159, 10, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#ff9f0a',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>{variable.type}</code> <code style={{ 
                                            background: 'rgba(255, 159, 10, 0.15)',
                                            border: '1px solid rgba(255, 159, 10, 0.3)',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                            color: '#ff9f0a',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>{variable.name}</code>
                                        {variable.value && (
                                            <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}> = {variable.value}</span>
                                        )}
                                    </li>
                                ))}
                                {/* Display source macro definitions */}
                                {validation?.exactRequirements?.macro_definitions?.map((macro, idx) => (
                                    <li key={`source-macro-${idx}`} style={{
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
                                            background: '#32d74b'
                                        }} />
                                        {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                            <>
                                                Define macro: {' '}
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.15)',
                                                    border: '1px solid rgba(50, 215, 75, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    marginRight: '6px'
                                                }}>{macro.preprocessor}</code>
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.15)',
                                                    border: '1px solid rgba(50, 215, 75, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                            </>
                                        ) : (
                                            <>
                                                Define macro: {' '}
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.15)',
                                                    border: '1px solid rgba(50, 215, 75, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    marginRight: '6px'
                                                }}>#define</code>
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.15)',
                                                    border: '1px solid rgba(50, 215, 75, 0.3)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500
                                                }}>{macro.name}</code>
                                                {macro.type === 'function-like' && macro.parameters && (
                                                    <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.875rem' }}>
                                                        {' '}({macro.parameters.join(', ')})
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {macro.value && (
                                            macro.value.includes('\n') ? (
                                                <span style={{
                                                    color: 'rgba(245, 245, 247, 0.5)',
                                                    fontSize: '0.875rem',
                                                    fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {' '}{macro.value}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.875rem' }}>
                                                    {' '}{macro.value}
                                                </span>
                                            )
                                        )}
                                    </li>
                                ))}
                                {/* Display function signatures from function_signatures_source test case */}
                                {validation?.testCases?.some(tc => tc.id === 'function_signatures_source') && 
                                 validation?.testCases?.find(tc => tc.id === 'function_signatures_source')?.expectedSymbols?.map((funcSig, idx) => {
                                    // Parse function signature dynamically for function implementations (left panel)
                                    const parseFunction = parseFunctionSignature;
                                    
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
                                            {parsed.storageClass && <code style={{ 
                                                background: 'rgba(255, 204, 2, 0.15)',
                                                border: '1px solid rgba(255, 204, 2, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#ffcc02',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                marginRight: '6px'
                                            }}>{parsed.storageClass}</code>}
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
                                            {parsed.attribute && <span style={{ color: 'rgba(255, 204, 2, 0.8)', marginRight: '6px' }}>{parsed.attribute}</span>}
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
                                {/* Function-linked outputs with collapsible function details */}
                                {inputOutput?.functionLinkedOutputs?.map((output, idx) => (
                                    <li key={`linked-${idx}`} style={{ 
                                        marginBottom: expandedFunctionLinks.has(idx) ? '8px' : '16px',
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
                                        <div>
                                            Output: <code style={{ 
                                                background: 'rgba(48, 209, 88, 0.15)',
                                                border: '1px solid rgba(48, 209, 88, 0.3)',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                color: '#30d158',
                                                fontSize: '0.875rem',
                                                fontWeight: 500
                                            }}>"{output.pattern}"</code>
                                        </div>
                                        <div style={{ 
                                            marginTop: '8px',
                                            marginLeft: '4px',
                                            marginBottom: '-6px'
                                        }}>
                                            <button
                                                onClick={() => toggleFunctionLink(idx)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#B0B0FF',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '0px',
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                                    transition: 'color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.color = '#ffcc02'}
                                                onMouseLeave={(e) => e.target.style.color = '#B0B0FF'}
                                            >
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    transform: expandedFunctionLinks.has(idx) ? 'rotate(90deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s ease'
                                                }}>▶</span>
                                                View linked function
                                            </button>
                                            {expandedFunctionLinks.has(idx) && (
                                                <div style={{
                                                    marginTop: '-7px',
                                                    paddingLeft: '16px',
                                                    padding: '10px 4px',
                                                    borderRadius: '6px'
                                                }}>
                                                    <code style={{ 
                                                        background: 'rgba(255, 204, 2, 0.15)',
                                                        border: '0px solid rgba(255, 204, 2, 0.3)',
                                                        padding: '8px 8px',
                                                        borderRadius: '6px',
                                                        fontFamily: 'SF Mono, Monaco, Menlo, monospace',
                                                        color: '#ffcc02',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 500,
                                                        display: 'inline-block',
                                                        maxWidth: '100%',
                                                        wordBreak: 'break-word',
                                                        overflowWrap: 'break-word'
                                                    }}>
                                                        {output.linkedFunction}
                                                    </code>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {/* Regular output messages (fallback for non-linked outputs) */}
                                {!inputOutput?.functionLinkedOutputs?.length && validation?.exactRequirements?.outputMessages?.map((msg, idx) => (
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
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '12px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '10px',
                                letterSpacing: '-0.015em',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                            }}>
                                Skills You'll Learn
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {challenge.skills.map((skill, idx) => (
                                    <span key={idx} style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(20px)',
                                        color: 'rgba(245, 245, 247, 0.8)',
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
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
                    gap: '8px',
                    paddingLeft: '8px',
                    height: '100%',
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    {/* Tab Navigation */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '4px',
                        display: 'flex',
                        gap: '4px',
                        flexShrink: 0
                    }}>
                        <button
                            onClick={() => setActiveTab('code')}
                            style={{
                                background: activeTab === 'code' ?
                                    'linear-gradient(135deg, #007aff 0%, #0056b3 100%)' :
                                    'transparent',
                                color: activeTab === 'code' ? 'white' : 'rgba(245, 245, 247, 0.7)',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                flex: 1,
                                justifyContent: 'center',
                                boxShadow: activeTab === 'code' ? '0 2px 8px rgba(0, 122, 255, 0.3)' : 'none'
                            }}
                        >
                            <Code size={16} />
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
                                borderRadius: '6px',
                                padding: '8px 16px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                flex: 1,
                                justifyContent: 'center',
                                boxShadow: activeTab === 'results' ? '0 2px 8px rgba(48, 209, 88, 0.3)' : 'none',
                                position: 'relative'
                            }}
                        >
                            <Terminal size={16} />
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
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}>
                                <div style={{
                                    padding: '8px',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: 0
                                }}>
                                    <div style={{
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        flex: 1,
                                        minHeight: 0
                                    }}>
                                        {/* Multi-file editor for projects with multiple files */}
                                        {codeEditor.files && codeEditor.files.length > 0 ? (
                                            <MultiFileEditor
                                                key={challenge.id || challenge.title || 'multi-file-editor'}
                                                files={codeEditor.files}
                                                mainFile={challenge.mainFile}
                                                onFilesChange={onCodeChange}
                                                premiumStyles={PremiumStyles}
                                                height="100%"
                                                requiredFiles={challenge.requiredFiles || []}
                                                allowFileCreation={challenge.requiredFiles && challenge.requiredFiles.length > 0}
                                                allowFileDeletion={challenge.requiredFiles && challenge.requiredFiles.length > 0}
                                                parentFullScreen={false}
                                                activeFile={activeFile}
                                                onActiveFileChange={setActiveFile}
                                                scrollPositions={scrollPositions}
                                                onScrollPositionsChange={setScrollPositions}
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
                            
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                            style={{
                                background: 'linear-gradient(135deg, #007aff 0%, #0056b3 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '10px 20px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                opacity: codeEditor.isRunning ? 0.6 : 1,
                                transform: 'translateY(0)',
                                ...(codeEditor.isRunning ? {} : {
                                    ':hover': {
                                        transform: 'translateY(-1px) scale(1.02)',
                                        boxShadow: '0 4px 12px rgba(0, 122, 255, 0.4)'
                                    }
                                })
                            }}
                            onClick={onRun}
                            disabled={codeEditor.isRunning}
                            onMouseEnter={(e) => {
                                if (!codeEditor.isRunning) {
                                    e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 122, 255, 0.4)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 122, 255, 0.3)';
                            }}
                        >
                            {codeEditor.isRunning ? <Timer size={16} /> : <Play size={16} />}
                            <span>{codeEditor.isRunning ? 'Testing...' : 'Run & Validate'}</span>
                        </button>
                        <button
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(20px)',
                                color: '#f5f5f7',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                padding: '10px 20px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                            }}
                            onClick={onReset}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <Shuffle size={16} />
                            <span>Reset</span>
                        </button>
                            </div>
                        </>
                    )}
                    
                    {activeTab === 'results' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            {codeEditor.output || codeEditor.overallResult === 'COMPILATION_ERROR' || codeEditor.overallResult === 'PRE_COMPILATION_ERROR' ? (
                                <div style={{
                                    background: 'rgba(29, 29, 31, 0.9)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '0',
                                    flex: 1,
                                    overflow: 'hidden',
                                    fontFamily: 'SF Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                                    margin: '12px',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <div style={{
                                        padding: '12px 16px 10px 16px',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: 'rgba(255, 255, 255, 0.02)'
                                    }}>
                                        <h4 style={{
                                            fontSize: '1rem',
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
                                        padding: '12px'
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
                                    padding: '32px 16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    flex: 1
                                }}>
                                    <Terminal size={40} style={{
                                        color: 'rgba(245, 245, 247, 0.3)',
                                        marginBottom: '12px'
                                    }} />
                                    <h4 style={{
                                        fontSize: '1rem',
                                        fontWeight: 600,
                                        color: 'rgba(245, 245, 247, 0.6)',
                                        margin: 0,
                                        marginBottom: '6px',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                                    }}>
                                        No Test Results Yet
                                    </h4>
                                    <p style={{
                                        color: 'rgba(245, 245, 247, 0.4)',
                                        margin: 0,
                                        marginBottom: '16px',
                                        fontSize: '0.85rem'
                                    }}>
                                        Run your code to see the results here
                                    </p>
                                    <button
                                        style={{
                                            background: 'linear-gradient(135deg, #30d158 0%, #28a745 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '10px 20px',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 2px 8px rgba(48, 209, 88, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                            opacity: codeEditor.isRunning ? 0.6 : 1
                                        }}
                                        onClick={() => {
                                            onRun();
                                            // Results will automatically appear in this tab after execution
                                        }}
                                        disabled={codeEditor.isRunning}
                                    >
                                        {codeEditor.isRunning ? <Timer size={16} /> : <Play size={16} />}
                                        <span>{codeEditor.isRunning ? 'Testing...' : 'Run & Validate'}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </ResizableSplitter>
            </div>

            <FloatingHelp />
        </div>
    );
};

export default ChallengeView;
