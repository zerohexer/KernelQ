import React, { useState, useEffect, useRef } from 'react';
import { Target, Book, Star, Zap, Code, Terminal, Play, Timer, Shuffle, Maximize2, Minimize2, HelpCircle, CheckCircle2, Circle, X } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';
import ResizableSplitter from '../Layout/ResizableSplitter';
import MultiFileEditor from '../Editor/MultiFileEditor';
import SemanticCodeEditor from '../Editor/SemanticCodeEditor';
import TestResultsView from './TestResultsView';
import useIsMobile from '../../hooks/useIsMobile';

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
    const isMobile = useIsMobile(); // Detect mobile device
    const [activeTab, setActiveTab] = useState('code');
    const [leftPanelWidth, setLeftPanelWidth] = useState(40); // Initial width as percentage - splitter moved left for more code space
    const [expandedFunctionLinks, setExpandedFunctionLinks] = useState(new Set()); // Track which function links are expanded
    const [isFullScreen, setIsFullScreen] = useState(false); // True full-screen mode

    // Force fullscreen mode on mobile
    useEffect(() => {
        if (isMobile && !isFullScreen) {
            setIsFullScreen(true);
        }
    }, [isMobile]);
    const [showFloatingHelp, setShowFloatingHelp] = useState(false); // Floating help modal
    const [completedRequirements, setCompletedRequirements] = useState(new Set()); // Track completed requirements
    const [editorFullScreen, setEditorFullScreen] = useState(false); // Editor full-screen within main full-screen
    const [showMobileResults, setShowMobileResults] = useState(false); // Mobile results panel in editor fullscreen

    // Show mobile results when results arrive (for mobile editor fullscreen mode)
    useEffect(() => {
        if (isMobile && editorFullScreen && codeEditor.output && !codeEditor.isRunning) {
            setShowMobileResults(true);
        }
    }, [isMobile, editorFullScreen, codeEditor.output, codeEditor.isRunning]);

    const [activeFile, setActiveFile] = useState(challenge?.mainFile || null); // Track active file across fullscreen toggles
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
                background: 'rgba(0, 0, 0, 0.9)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0'
            }}>
                <div style={{
                    background: '#1a1a1e',
                    borderRadius: '0',
                    border: 'none',
                    boxShadow: 'none',
                    padding: '24px',
                    width: '100vw',
                    maxWidth: '100vw',
                    height: '100vh',
                    maxHeight: '100vh',
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
                            top: '20px',
                            right: '28px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '10px',
                            color: 'rgba(245, 245, 247, 0.6)',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            zIndex: 10
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.color = '#f5f5f7';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.color = 'rgba(245, 245, 247, 0.6)';
                        }}
                    >
                        <X size={16} />
                    </button>

                    {/* Scrollable Content Container */}
                    <div
                        ref={floatingHelpScrollRef}
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            paddingRight: '16px',
                            marginRight: '-16px',
                            scrollBehavior: 'auto',
                            paddingTop: '8px'
                        }}
                        className="floating-help-scroll"
                    >
                        {/* Challenge Header */}
                        <div style={{ marginBottom: '24px' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '14px',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.3,
                                paddingRight: '40px'
                            }}>
                                {challenge.id ? `#${challenge.id}: ${challenge.title}` : challenge.title}
                            </h2>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                                background: challenge.difficulty <= 3 ?
                                    'linear-gradient(135deg, #32d74b 0%, #30d158 100%)' :
                                    challenge.difficulty <= 6 ?
                                    'linear-gradient(135deg, #ffd60a 0%, #ff9f0a 100%)' :
                                    'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)',
                                color: '#000',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}>
                                <Star size={11} fill="currentColor" />
                                <span>Level {challenge.difficulty}</span>
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: '#f5f5f7',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                                <Zap size={11} fill="#ffd60a" color="#ffd60a" />
                                <span>{challenge.xp} XP</span>
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                color: 'rgba(245, 245, 247, 0.7)',
                                padding: '5px 12px',
                                borderRadius: '8px',
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                border: '1px solid rgba(255, 255, 255, 0.06)'
                            }}>
                                {challenge.phase}
                            </span>
                        </div>
                    </div>

                    {/* Problem Description */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: 0,
                            marginBottom: '12px',
                            letterSpacing: '-0.01em'
                        }}>
                            Problem Description
                        </h3>
                        <p style={{
                            fontSize: '0.875rem',
                            lineHeight: '1.6',
                            color: 'rgba(245, 245, 247, 0.65)',
                            margin: 0
                        }}>
                            {challenge.description}
                        </p>
                    </div>

                    {/* Requirements - EXACT copy from original left panel requirements */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '20px',
                        marginBottom: '20px'
                    }}>
                        <h4 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: 0,
                            marginBottom: '14px',
                            letterSpacing: '-0.01em'
                        }}>
                            Requirements
                        </h4>
                        <ul style={{
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: 'rgba(245, 245, 247, 0.65)',
                            paddingLeft: '16px',
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
                                        marginBottom: '12px',
                                        paddingLeft: '0',
                                        fontWeight: 600,
                                        color: '#ff9f0a',
                                        fontSize: '0.93rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Header File Requirements
                                    </li>
                                    {/* Display header variable declarations (no values) */}
                                    {challenge.validation?.exactRequirements?.variables_declarations?.map((variable, idx) => (
                                        <li key={`header-var-${idx}`} style={{
                                            marginBottom: '10px',
                                            position: 'relative',
                                            paddingLeft: '16px',
                                            fontSize: '1rem'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '7px',
                                                width: '5px',
                                                height: '5px',
                                                borderRadius: '50%',
                                                background: '#ff9f0a'
                                            }} />
                                            Declare variable: {' '}
                                            {variable.storageClass && variable.storageClass !== 'none' && (
                                                <code style={{
                                                    background: 'rgba(255, 159, 10, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#ff9f0a',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500,
                                                    marginRight: '4px'
                                                }}>{variable.storageClass}</code>
                                            )}
                                            <code style={{
                                                background: 'rgba(255, 159, 10, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#ff9f0a',
                                                fontSize: '0.93rem',
                                                fontWeight: 500
                                            }}>{variable.type}</code> <code style={{
                                                background: 'rgba(255, 159, 10, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#ff9f0a',
                                                fontSize: '0.93rem',
                                                fontWeight: 500
                                            }}>{variable.name}</code>
                                            {variable.value && (
                                                <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}> {variable.value}</span>
                                            )}
                                        </li>
                                    ))}
                                    {/* Display header macro declarations in floating help */}
                                    {challenge.validation?.exactRequirements?.macro_declarations?.map((macro, idx) => (
                                        <li key={`floating-header-macro-${idx}`} style={{
                                            marginBottom: '10px',
                                            position: 'relative',
                                            paddingLeft: '16px',
                                            fontSize: '1rem'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '7px',
                                                width: '5px',
                                                height: '5px',
                                                borderRadius: '50%',
                                                background: '#32d74b'
                                            }} />
                                            {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                                <>
                                                    Define macro: {' '}
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.12)',
                                                        padding: '3px 7px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.93rem',
                                                        fontWeight: 500,
                                                        marginRight: '4px'
                                                    }}>{macro.preprocessor}</code>
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.12)',
                                                        padding: '3px 7px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.93rem',
                                                        fontWeight: 500
                                                    }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                                </>
                                            ) : (
                                                <>
                                                    Define macro: {' '}
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.12)',
                                                        padding: '3px 7px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.93rem',
                                                        fontWeight: 500,
                                                        marginRight: '4px'
                                                    }}>#define</code>
                                                    <code style={{
                                                        background: 'rgba(50, 215, 75, 0.12)',
                                                        padding: '3px 7px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#32d74b',
                                                        fontSize: '0.93rem',
                                                        fontWeight: 500
                                                    }}>{macro.name}</code>
                                                    {macro.type === 'function-like' && macro.parameters && (
                                                        <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>
                                                            {' '}({macro.parameters.join(', ')})
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {macro.value && (
                                                macro.value.includes('\n') ? (
                                                    <span style={{
                                                        color: 'rgba(245, 245, 247, 0.5)',
                                                        fontSize: '0.93rem',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {' '}{macro.value}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}>
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
                                                marginBottom: '10px',
                                                position: 'relative',
                                                paddingLeft: '16px',
                                                fontSize: '1rem'
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '7px',
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    background: '#ffd60a'
                                                }} />
                                                Declare function: {' '}
                                                {parsed.returnType && <code style={{
                                                    background: 'rgba(255, 214, 10, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#ffd60a',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500,
                                                    marginRight: '4px'
                                                }}>{parsed.returnType}</code>}
                                                <code style={{
                                                    background: 'rgba(255, 214, 10, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#ffd60a',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500
                                                }}>{parsed.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>{parsed.params}</span>
                                            </li>
                                        );
                                    })}
                                    <li style={{
                                        marginBottom: '16px',
                                        paddingLeft: '0'
                                    }}></li>
                                </>
                            )}

                            {/* Source File Requirements Section */}
                            {(challenge.validation?.exactRequirements?.functionNames || challenge.validation?.exactRequirements?.outputMessages) && (
                                <li style={{
                                    marginBottom: '12px',
                                    marginTop: '16px',
                                    paddingLeft: '0',
                                    fontWeight: 600,
                                    color: '#32d74b',
                                    fontSize: '0.93rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    Source File Requirements
                                </li>
                            )}

                            {/* Show validation.exactRequirements if available */}
                            {challenge.validation?.exactRequirements?.variables?.map((variable, idx) => (
                                <li key={`source-var-${idx}`} style={{
                                    marginBottom: '10px',
                                    position: 'relative',
                                    paddingLeft: '16px',
                                    fontSize: '1rem'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '7px',
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        background: '#ff9f0a'
                                    }} />
                                    Define variable: {' '}
                                    {variable.storageClass && variable.storageClass !== 'none' && (
                                        <code style={{
                                            background: 'rgba(255, 159, 10, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#ff9f0a',
                                            fontSize: '0.93rem',
                                            fontWeight: 500,
                                            marginRight: '4px'
                                        }}>{variable.storageClass}</code>
                                    )}
                                    <code style={{
                                        background: 'rgba(255, 159, 10, 0.12)',
                                        padding: '3px 7px',
                                        borderRadius: '5px',
                                        fontFamily: 'SF Mono, Monaco, monospace',
                                        color: '#ff9f0a',
                                        fontSize: '0.93rem',
                                        fontWeight: 500
                                    }}>{variable.type}</code> <code style={{
                                        background: 'rgba(255, 159, 10, 0.12)',
                                        padding: '3px 7px',
                                        borderRadius: '5px',
                                        fontFamily: 'SF Mono, Monaco, monospace',
                                        color: '#ff9f0a',
                                        fontSize: '0.93rem',
                                        fontWeight: 500
                                    }}>{variable.name}</code>
                                    {variable.value && (
                                        <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}> = {variable.value}</span>
                                    )}
                                </li>
                            ))}
                            {/* Display source macro definitions in floating help */}
                            {challenge.validation?.exactRequirements?.macro_definitions?.map((macro, idx) => (
                                <li key={`floating-source-macro-${idx}`} style={{
                                    marginBottom: '10px',
                                    position: 'relative',
                                    paddingLeft: '16px',
                                    fontSize: '1rem'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '7px',
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        background: '#32d74b'
                                    }} />
                                    {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                        <>
                                            Define macro: {' '}
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.93rem',
                                                fontWeight: 500,
                                                marginRight: '4px'
                                            }}>{macro.preprocessor}</code>
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.93rem',
                                                fontWeight: 500
                                            }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                        </>
                                    ) : (
                                        <>
                                            Define macro: {' '}
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.93rem',
                                                fontWeight: 500,
                                                marginRight: '4px'
                                            }}>#define</code>
                                            <code style={{
                                                background: 'rgba(50, 215, 75, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.93rem',
                                                fontWeight: 500
                                            }}>{macro.name}</code>
                                            {macro.type === 'function-like' && macro.parameters && (
                                                <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>
                                                    {' '}({macro.parameters.join(', ')})
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {macro.value && (
                                        macro.value.includes('\n') ? (
                                            <span style={{
                                                color: 'rgba(245, 245, 247, 0.5)',
                                                fontSize: '0.93rem',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word'
                                            }}>
                                                {' '}{macro.value}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}>
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
                                        marginBottom: '10px',
                                        position: 'relative',
                                        paddingLeft: '16px',
                                        fontSize: '1rem'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '7px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: '#ffd60a'
                                        }} />
                                        Implement function: {' '}
                                        {parsed.storageClass && <code style={{
                                            background: 'rgba(255, 214, 10, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#ffd60a',
                                            fontSize: '0.93rem',
                                            fontWeight: 500,
                                            marginRight: '4px'
                                        }}>{parsed.storageClass}</code>}
                                        {parsed.returnType && <code style={{
                                            background: 'rgba(255, 214, 10, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#ffd60a',
                                            fontSize: '0.93rem',
                                            fontWeight: 500,
                                            marginRight: '4px'
                                        }}>{parsed.returnType}</code>}
                                        {parsed.attribute && <span style={{ color: 'rgba(255, 214, 10, 0.8)', marginRight: '4px', fontSize: '0.93rem' }}>{parsed.attribute}</span>}
                                        <code style={{
                                            background: 'rgba(255, 214, 10, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#ffd60a',
                                            fontSize: '0.93rem',
                                            fontWeight: 500
                                        }}>{parsed.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>{parsed.params}</span>
                                    </li>
                                );
                            })}
                            {/* Function-linked outputs with collapsible function details */}
                            {challenge.inputOutput?.functionLinkedOutputs?.map((output, idx) => (
                                <li key={`linked-${idx}`} style={{
                                    marginBottom: expandedFunctionLinks.has(idx) ? '8px' : '12px',
                                    position: 'relative',
                                    paddingLeft: '16px',
                                    fontSize: '1rem'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '7px',
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        background: '#32d74b'
                                    }} />
                                    <div>
                                        Output: <code style={{
                                            background: 'rgba(50, 215, 75, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#32d74b',
                                            fontSize: '0.93rem',
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
                                                color: 'rgba(176, 176, 255, 0.8)',
                                                fontSize: '0.93rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '0px',
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                                transition: 'color 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.color = '#ffd60a'}
                                            onMouseLeave={(e) => e.target.style.color = 'rgba(176, 176, 255, 0.8)'}
                                        >
                                            <span style={{
                                                fontSize: '0.65rem',
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
                                                borderRadius: '5px',
                                                contain: 'layout style',
                                                willChange: 'auto'
                                            }}>
                                                <code style={{
                                                    background: 'rgba(255, 214, 10, 0.12)',
                                                    padding: '6px 8px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#ffd60a',
                                                    fontSize: '0.93rem',
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
                                    marginBottom: '10px',
                                    position: 'relative',
                                    paddingLeft: '16px',
                                    fontSize: '1rem'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '7px',
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        background: '#bf5af2'
                                    }} />
                                    Include: <code style={{
                                        background: 'rgba(191, 90, 242, 0.12)',
                                        padding: '3px 7px',
                                        borderRadius: '5px',
                                        fontFamily: 'SF Mono, Monaco, monospace',
                                        color: '#bf5af2',
                                        fontSize: '0.93rem',
                                        fontWeight: 500
                                    }}>{include}</code>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Skills */}
                    {challenge.skills && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '12px',
                            padding: '20px'
                        }}>
                            <h4 style={{
                                fontSize: '0.93rem',
                                fontWeight: 600,
                                color: 'rgba(245, 245, 247, 0.5)',
                                margin: 0,
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Skills You'll Learn
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {challenge.skills.map((skill, idx) => (
                                    <span key={idx} style={{
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        color: 'rgba(245, 245, 247, 0.8)',
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.93rem',
                                        fontWeight: 500
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
                background: '#0a0a0c',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Full-screen Header Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '10px 12px' : '12px 20px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    flexShrink: 0,
                    gap: '8px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '12px',
                        flex: 1,
                        minWidth: 0
                    }}>
                        <span style={{
                            fontSize: isMobile ? '0.95rem' : '1.15rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            letterSpacing: '-0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {challenge.id ? `#${challenge.id}: ${title}` : title}
                        </span>
                        {!isMobile && (
                            <span style={{
                                background: difficulty <= 3 ?
                                    'linear-gradient(135deg, #32d74b 0%, #30d158 100%)' :
                                    difficulty <= 6 ?
                                    'linear-gradient(135deg, #ffd60a 0%, #ff9f0a 100%)' :
                                    'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)',
                                color: '#000',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                flexShrink: 0
                            }}>
                                Level {difficulty}
                            </span>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <button
                            onClick={() => setShowFloatingHelp(true)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                color: 'rgba(245, 245, 247, 0.7)',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.855rem',
                                fontWeight: 500,
                                transition: 'all 0.2s ease'
                            }}
                            title="Show problem details (Alt+Z)"
                        >
                            <HelpCircle size={14} />
                            <span>Show Problem Details</span>
                        </button>

                        {/* Hide exit button on mobile since fullscreen is forced */}
                        {!isMobile && (
                            <button
                                onClick={() => setIsFullScreen(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '8px',
                                    color: 'rgba(245, 245, 247, 0.7)',
                                    padding: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}
                                title="Exit fullscreen (Alt+F)"
                            >
                                <Minimize2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation Bar */}
                {isMobile && switchToTab && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        flexShrink: 0,
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {[
                            { id: 'learning', label: 'Challenge', icon: <Target size={14} /> },
                            { id: 'problemBank', label: 'Problems', icon: <Book size={14} /> },
                            { id: 'playground', label: 'Playground', icon: <Code size={14} /> },
                            { id: 'concepts', label: 'Concepts', icon: <Star size={14} /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => switchToTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: tab.id === 'learning'
                                        ? 'rgba(50, 215, 75, 0.15)'
                                        : 'rgba(255, 255, 255, 0.04)',
                                    color: tab.id === 'learning'
                                        ? '#32d74b'
                                        : 'rgba(245, 245, 247, 0.7)',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Full-screen Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: isMobile ? 'auto' : 'hidden' }}>
                    {/* Tab Navigation */}
                    <div style={{
                        padding: '12px 20px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                    }}>
                        {/* Tab Pills */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: '10px',
                            padding: '3px',
                            display: 'flex',
                            gap: '2px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <button
                                onClick={() => setActiveTab('code')}
                                style={{
                                    background: activeTab === 'code' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: activeTab === 'code' ? '#f5f5f7' : 'rgba(245, 245, 247, 0.5)',
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '6px 16px',
                                    fontSize: '0.855rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                <Code size={13} />
                                <span>Code</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                style={{
                                    background: activeTab === 'results' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: activeTab === 'results' ? '#f5f5f7' : 'rgba(245, 245, 247, 0.5)',
                                    border: 'none',
                                    borderRadius: '7px',
                                    padding: '6px 16px',
                                    fontSize: '0.855rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    position: 'relative'
                                }}
                            >
                                <Terminal size={13} />
                                <span>Results</span>
                                {codeEditor.output && (
                                    <div style={{
                                        width: '5px',
                                        height: '5px',
                                        borderRadius: '50%',
                                        background: '#32d74b',
                                        boxShadow: '0 0 6px rgba(50, 215, 75, 0.6)',
                                        marginLeft: '4px'
                                    }} />
                                )}
                            </button>
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Reset Button */}
                        <button
                            onClick={onReset}
                            title="Reset all files"
                            style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                color: 'rgba(245, 245, 247, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '0.855rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Shuffle size={13} />
                            <span>Reset</span>
                        </button>

                        {/* Run Button */}
                        <button
                            onClick={onRun}
                            disabled={codeEditor.isRunning}
                            style={{
                                background: codeEditor.isRunning
                                    ? 'rgba(50, 215, 75, 0.3)'
                                    : 'linear-gradient(135deg, #32d74b 0%, #30d158 100%)',
                                color: codeEditor.isRunning ? 'rgba(255, 255, 255, 0.7)' : '#000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 14px',
                                fontSize: '0.855rem',
                                fontWeight: 600,
                                cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s ease',
                                boxShadow: codeEditor.isRunning ? 'none' : '0 2px 10px rgba(50, 215, 75, 0.3)'
                            }}
                        >
                            {codeEditor.isRunning ? <Timer size={13} /> : <Play size={13} fill="currentColor" />}
                            <span>{codeEditor.isRunning ? 'Running...' : 'Run'}</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div style={{ flex: 1, padding: '0 20px 20px 20px', overflow: 'hidden', minHeight: 0 }}>
                        {activeTab === 'code' && (
                            <div style={{
                                height: '100%',
                                overflow: 'hidden',
                                borderRadius: '12px'
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
                                        originalFiles={challenge.files}
                                        isMobile={isMobile}
                                        onShowHelp={() => setShowFloatingHelp(true)}
                                        onRun={onRun}
                                        isRunning={codeEditor.isRunning}
                                        showMobileResults={showMobileResults}
                                        setShowMobileResults={setShowMobileResults}
                                        mobileResultsContent={
                                            <TestResultsView
                                                testResults={codeEditor.testResults}
                                                rawOutput={codeEditor.output}
                                                overallResult={codeEditor.overallResult}
                                                feedback={codeEditor.feedback}
                                            />
                                        }
                                        onResetFile={(fileName, originalContent) => {
                                            const updatedFiles = codeEditor.files.map(f =>
                                                f.name === fileName ? { ...f, content: originalContent } : f
                                            );
                                            onCodeChange(updatedFiles);
                                        }}
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
                        )}

                        {activeTab === 'results' && (
                            <div style={{
                                height: '100%',
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}>
                                {codeEditor.output || codeEditor.overallResult === 'COMPILATION_ERROR' || codeEditor.overallResult === 'PRE_COMPILATION_ERROR' ? (
                                    <div style={{
                                        flex: 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        minHeight: 0
                                    }}>
                                        <div style={{
                                            padding: '14px 20px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                            flexShrink: 0
                                        }}>
                                            <h4 style={{
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                color: '#f5f5f7',
                                                margin: 0,
                                                letterSpacing: '-0.01em'
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
                                                background: '#32d74b',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: '10px',
                                                padding: '12px 24px',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                opacity: codeEditor.isRunning ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                            onClick={onRun}
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
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '20px',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            height: 'calc(100% + 20px)',
            maxHeight: 'calc(100% + 20px)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            
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
                    paddingRight: '8px',
                    height: '100%',
                    overflow: 'auto'
                }}>
                    {/* Challenge Header */}
                    <div style={{
                        marginBottom: '16px',
                        flexShrink: 0
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                        }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#f5f5f7',
                                margin: 0,
                                letterSpacing: '-0.02em',
                                flex: 1
                            }}>
                                {challenge.id ? `#${challenge.id}: ${title}` : title}
                            </h2>
                            <button
                                onClick={() => setIsFullScreen(true)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '10px',
                                    color: 'rgba(245, 245, 247, 0.6)',
                                    padding: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginLeft: '12px',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                }}
                                title="Alt + F - Full-screen coding mode"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.color = '#f5f5f7';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                    e.currentTarget.style.color = 'rgba(245, 245, 247, 0.6)';
                                }}
                            >
                                <Maximize2 size={16} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{
                                background: difficulty <= 3 ?
                                    'linear-gradient(135deg, #32d74b 0%, #30d158 100%)' :
                                    difficulty <= 6 ?
                                    'linear-gradient(135deg, #ffd60a 0%, #ff9f0a 100%)' :
                                    'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)',
                                color: difficulty <= 3 ? '#000' : '#000',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <Star size={11} fill="currentColor" />
                                <span>Level {difficulty}</span>
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                color: '#f5f5f7',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                                <Zap size={11} fill="#ffd60a" color="#ffd60a" />
                                <span>{xp} XP</span>
                            </span>
                            <span style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                color: 'rgba(245, 245, 247, 0.7)',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '0.6875rem',
                                fontWeight: 500,
                                border: '1px solid rgba(255, 255, 255, 0.06)'
                            }}>
                                {phase}
                            </span>
                        </div>
                    </div>
                    
                    {/* Problem Description */}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '16px',
                        marginBottom: '12px'
                    }}>
                        <h3 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: 0,
                            marginBottom: '10px',
                            letterSpacing: '-0.01em'
                        }}>
                            Problem Description
                        </h3>
                        <p style={{
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: 'rgba(245, 245, 247, 0.65)',
                            margin: 0
                        }}>
                            {description}
                        </p>
                    </div>


                    {/* Requirements Section */}
                    {challenge.skills && challenge.skills.length > 0 && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: '16px',
                            marginBottom: '12px'
                        }}>
                            <h4 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '12px',
                                letterSpacing: '-0.01em'
                            }}>
                                Requirements
                            </h4>
                            <ul style={{
                                fontSize: '1rem',
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
                                            marginBottom: '12px',
                                            paddingLeft: '0',
                                            fontWeight: 600,
                                            color: '#ff9f0a',
                                            fontSize: '0.93rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            Header File Requirements
                                        </li>
                                        {/* Display header variable declarations (no values) */}
                                        {validation?.exactRequirements?.variables_declarations?.map((variable, idx) => (
                                            <li key={`header-var-${idx}`} style={{
                                                marginBottom: '10px',
                                                position: 'relative',
                                                paddingLeft: '16px',
                                                fontSize: '1rem'
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '7px',
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    background: '#ff9f0a'
                                                }} />
                                                Declare variable: {' '}
                                                {variable.storageClass && variable.storageClass !== 'none' && (
                                                    <code style={{
                                                        background: 'rgba(255, 159, 10, 0.12)',
                                                        padding: '3px 7px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#ff9f0a',
                                                        fontSize: '0.93rem',
                                                        fontWeight: 500,
                                                        marginRight: '4px'
                                                    }}>{variable.storageClass}</code>
                                                )}
                                                <code style={{
                                                    background: 'rgba(255, 159, 10, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#ff9f0a',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500
                                                }}>{variable.type}</code> <code style={{
                                                    background: 'rgba(255, 159, 10, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#ff9f0a',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500
                                                }}>{variable.name}</code>
                                                {variable.value && (
                                                    <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}> {variable.value}</span>
                                                )}
                                            </li>
                                        ))}
                                        {/* Display header macro declarations */}
                                        {validation?.exactRequirements?.macro_declarations?.map((macro, idx) => (
                                            <li key={`header-macro-${idx}`} style={{
                                                marginBottom: '10px',
                                                position: 'relative',
                                                paddingLeft: '16px',
                                                fontSize: '1rem'
                                            }}>
                                                <span style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: '7px',
                                                    width: '5px',
                                                    height: '5px',
                                                    borderRadius: '50%',
                                                    background: '#32d74b'
                                                }} />
                                                {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                                    <>
                                                        Define macro: {' '}
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.12)',
                                                            padding: '3px 7px',
                                                            borderRadius: '5px',
                                                            fontFamily: 'SF Mono, Monaco, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.93rem',
                                                            fontWeight: 500,
                                                            marginRight: '4px'
                                                        }}>{macro.preprocessor}</code>
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.12)',
                                                            padding: '3px 7px',
                                                            borderRadius: '5px',
                                                            fontFamily: 'SF Mono, Monaco, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.93rem',
                                                            fontWeight: 500
                                                        }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                                    </>
                                                ) : (
                                                    <>
                                                        Define macro: {' '}
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.12)',
                                                            padding: '3px 7px',
                                                            borderRadius: '5px',
                                                            fontFamily: 'SF Mono, Monaco, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.93rem',
                                                            fontWeight: 500,
                                                            marginRight: '4px'
                                                        }}>#define</code>
                                                        <code style={{
                                                            background: 'rgba(50, 215, 75, 0.12)',
                                                            padding: '3px 7px',
                                                            borderRadius: '5px',
                                                            fontFamily: 'SF Mono, Monaco, monospace',
                                                            color: '#32d74b',
                                                            fontSize: '0.93rem',
                                                            fontWeight: 500
                                                        }}>{macro.name}</code>
                                                        {macro.type === 'function-like' && macro.parameters && (
                                                            <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>
                                                                {' '}({macro.parameters.join(', ')})
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {macro.value && (
                                                    macro.value.includes('\n') ? (
                                                        <span style={{
                                                            color: 'rgba(245, 245, 247, 0.5)',
                                                            fontSize: '0.93rem',
                                                            fontFamily: 'SF Mono, Monaco, monospace',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word'
                                                        }}>
                                                            {' '}{macro.value}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}>
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
                                                    marginBottom: '10px',
                                                    position: 'relative',
                                                    paddingLeft: '16px',
                                                    fontSize: '1rem'
                                                }}>
                                                    <span style={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: '7px',
                                                        width: '5px',
                                                        height: '5px',
                                                        borderRadius: '50%',
                                                        background: '#ffd60a'
                                                    }} />
                                                    Declare function: {' '}
                                                    {parsed.returnType && <code style={{
                                                        background: 'rgba(255, 214, 10, 0.12)',
                                                        padding: '3px 7px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#ffd60a',
                                                        fontSize: '0.93rem',
                                                        fontWeight: 500,
                                                        marginRight: '4px'
                                                    }}>{parsed.returnType}</code>}
                                                    <code style={{
                                                        background: 'rgba(255, 214, 10, 0.12)',
                                                        padding: '3px 7px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#ffd60a',
                                                        fontSize: '0.93rem',
                                                        fontWeight: 500
                                                    }}>{parsed.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>{parsed.params}</span>
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
                                        marginBottom: '12px',
                                        marginTop: '16px',
                                        paddingLeft: '0',
                                        fontWeight: 600,
                                        color: '#32d74b',
                                        fontSize: '0.93rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Source File Requirements
                                    </li>
                                )}

                                {/* Show validation.exactRequirements if available */}
                                {validation?.exactRequirements?.variables?.map((variable, idx) => (
                                    <li key={`source-var-${idx}`} style={{
                                        marginBottom: '10px',
                                        position: 'relative',
                                        paddingLeft: '16px',
                                        fontSize: '1rem'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '7px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: '#ff9f0a'
                                        }} />
                                        Define variable: {' '}
                                        {variable.storageClass && variable.storageClass !== 'none' && (
                                            <code style={{
                                                background: 'rgba(255, 159, 10, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#ff9f0a',
                                                fontSize: '0.93rem',
                                                fontWeight: 500,
                                                marginRight: '4px'
                                            }}>{variable.storageClass}</code>
                                        )}
                                        <code style={{
                                            background: 'rgba(255, 159, 10, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#ff9f0a',
                                            fontSize: '0.93rem',
                                            fontWeight: 500
                                        }}>{variable.type}</code> <code style={{
                                            background: 'rgba(255, 159, 10, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#ff9f0a',
                                            fontSize: '0.93rem',
                                            fontWeight: 500
                                        }}>{variable.name}</code>
                                        {variable.value && (
                                            <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}> = {variable.value}</span>
                                        )}
                                    </li>
                                ))}
                                {/* Display source macro definitions */}
                                {validation?.exactRequirements?.macro_definitions?.map((macro, idx) => (
                                    <li key={`source-macro-${idx}`} style={{
                                        marginBottom: '10px',
                                        position: 'relative',
                                        paddingLeft: '16px',
                                        fontSize: '1rem'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '7px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: '#32d74b'
                                        }} />
                                        {macro.preprocessor && macro.preprocessor !== '#define' ? (
                                            <>
                                                Define macro: {' '}
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500,
                                                    marginRight: '4px'
                                                }}>{macro.preprocessor}</code>
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500
                                                }}>{macro.value?.split('\n')[0]?.replace(macro.preprocessor + ' ', '') || macro.name}</code>
                                            </>
                                        ) : (
                                            <>
                                                Define macro: {' '}
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500,
                                                    marginRight: '4px'
                                                }}>#define</code>
                                                <code style={{
                                                    background: 'rgba(50, 215, 75, 0.12)',
                                                    padding: '3px 7px',
                                                    borderRadius: '5px',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    color: '#32d74b',
                                                    fontSize: '0.93rem',
                                                    fontWeight: 500
                                                }}>{macro.name}</code>
                                                {macro.type === 'function-like' && macro.parameters && (
                                                    <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>
                                                        {' '}({macro.parameters.join(', ')})
                                                    </span>
                                                )}
                                            </>
                                        )}
                                        {macro.value && (
                                            macro.value.includes('\n') ? (
                                                <span style={{
                                                    color: 'rgba(245, 245, 247, 0.5)',
                                                    fontSize: '0.93rem',
                                                    fontFamily: 'SF Mono, Monaco, monospace',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {' '}{macro.value}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'rgba(245, 245, 247, 0.5)', fontSize: '0.93rem' }}>
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
                                            marginBottom: '10px',
                                            position: 'relative',
                                            paddingLeft: '16px',
                                            fontSize: '1rem'
                                        }}>
                                            <span style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: '7px',
                                                width: '5px',
                                                height: '5px',
                                                borderRadius: '50%',
                                                background: '#ffd60a'
                                            }} />
                                            Implement function: {' '}
                                            {parsed.storageClass && <code style={{
                                                background: 'rgba(255, 214, 10, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#ffd60a',
                                                fontSize: '0.93rem',
                                                fontWeight: 500,
                                                marginRight: '4px'
                                            }}>{parsed.storageClass}</code>}
                                            {parsed.returnType && <code style={{
                                                background: 'rgba(255, 214, 10, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#ffd60a',
                                                fontSize: '0.93rem',
                                                fontWeight: 500,
                                                marginRight: '4px'
                                            }}>{parsed.returnType}</code>}
                                            {parsed.attribute && <span style={{ color: 'rgba(255, 214, 10, 0.8)', marginRight: '4px', fontSize: '0.93rem' }}>{parsed.attribute}</span>}
                                            <code style={{
                                                background: 'rgba(255, 214, 10, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#ffd60a',
                                                fontSize: '0.93rem',
                                                fontWeight: 500
                                            }}>{parsed.name}</code> <span style={{ color: 'rgba(245, 245, 247, 0.6)', fontSize: '0.93rem' }}>{parsed.params}</span>
                                        </li>
                                    );
                                })}
                                {/* Function-linked outputs with collapsible function details */}
                                {inputOutput?.functionLinkedOutputs?.map((output, idx) => (
                                    <li key={`linked-${idx}`} style={{
                                        marginBottom: expandedFunctionLinks.has(idx) ? '8px' : '12px',
                                        position: 'relative',
                                        paddingLeft: '16px',
                                        fontSize: '1rem'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '7px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: '#32d74b'
                                        }} />
                                        <div>
                                            Output: <code style={{
                                                background: 'rgba(50, 215, 75, 0.12)',
                                                padding: '3px 7px',
                                                borderRadius: '5px',
                                                fontFamily: 'SF Mono, Monaco, monospace',
                                                color: '#32d74b',
                                                fontSize: '0.93rem',
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
                                                    color: 'rgba(176, 176, 255, 0.8)',
                                                    fontSize: '0.93rem',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    padding: '0px',
                                                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
                                                    transition: 'color 0.2s ease'
                                                }}
                                                onMouseEnter={(e) => e.target.style.color = '#ffd60a'}
                                                onMouseLeave={(e) => e.target.style.color = 'rgba(176, 176, 255, 0.8)'}
                                            >
                                                <span style={{
                                                    fontSize: '0.65rem',
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
                                                    borderRadius: '5px'
                                                }}>
                                                    <code style={{
                                                        background: 'rgba(255, 214, 10, 0.12)',
                                                        padding: '6px 8px',
                                                        borderRadius: '5px',
                                                        fontFamily: 'SF Mono, Monaco, monospace',
                                                        color: '#ffd60a',
                                                        fontSize: '0.93rem',
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
                                        marginBottom: '10px',
                                        position: 'relative',
                                        paddingLeft: '16px',
                                        fontSize: '1rem'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '7px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: '#32d74b'
                                        }} />
                                        Output: <code style={{
                                            background: 'rgba(50, 215, 75, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#32d74b',
                                            fontSize: '0.93rem',
                                            fontWeight: 500
                                        }}>"{msg}"</code>
                                    </li>
                                ))}
                                {validation?.exactRequirements?.requiredIncludes?.map((inc, idx) => (
                                    <li key={idx} style={{
                                        marginBottom: '10px',
                                        position: 'relative',
                                        paddingLeft: '16px',
                                        fontSize: '1rem'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: '7px',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: '#bf5af2'
                                        }} />
                                        Include: <code style={{
                                            background: 'rgba(191, 90, 242, 0.12)',
                                            padding: '3px 7px',
                                            borderRadius: '5px',
                                            fontFamily: 'SF Mono, Monaco, monospace',
                                            color: '#bf5af2',
                                            fontSize: '0.93rem',
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
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: '16px'
                        }}>
                            <h4 style={{
                                fontSize: '1rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: 0,
                                marginBottom: '12px',
                                letterSpacing: '-0.01em'
                            }}>
                                Skills You'll Learn
                            </h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {challenge.skills.map((skill, idx) => (
                                    <span key={idx} style={{
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        color: 'rgba(245, 245, 247, 0.7)',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.6875rem',
                                        fontWeight: 500,
                                        border: '1px solid rgba(255, 255, 255, 0.06)'
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
                    gap: '12px',
                    paddingLeft: '12px',
                    height: '100%',
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    {/* Tab Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexShrink: 0,
                        alignItems: 'center'
                    }}>
                        {/* Tab Pills */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderRadius: '12px',
                            padding: '4px',
                            display: 'flex',
                            gap: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <button
                                onClick={() => setActiveTab('code')}
                                style={{
                                    background: activeTab === 'code' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: activeTab === 'code' ? '#f5f5f7' : 'rgba(245, 245, 247, 0.5)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 20px',
                                    fontSize: '0.855rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Code size={14} />
                                <span>Code</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('results')}
                                style={{
                                    background: activeTab === 'results' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    color: activeTab === 'results' ? '#f5f5f7' : 'rgba(245, 245, 247, 0.5)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    padding: '8px 20px',
                                    fontSize: '0.855rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    position: 'relative'
                                }}
                            >
                                <Terminal size={14} />
                                <span>Results</span>
                                {codeEditor.output && (
                                    <div style={{
                                        width: '6px',
                                        height: '6px',
                                        borderRadius: '50%',
                                        background: '#32d74b',
                                        boxShadow: '0 0 8px rgba(50, 215, 75, 0.6)',
                                        marginLeft: '4px'
                                    }} />
                                )}
                            </button>
                        </div>

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Reset Button */}
                        <button
                            onClick={onReset}
                            title="Reset all files"
                            style={{
                                background: 'rgba(255, 255, 255, 0.04)',
                                color: 'rgba(245, 245, 247, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '10px',
                                padding: '8px 14px',
                                fontSize: '0.855rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                flexShrink: 0
                            }}
                        >
                            <Shuffle size={13} />
                            <span>Reset</span>
                        </button>

                        {/* Run Button */}
                        <button
                            onClick={onRun}
                            disabled={codeEditor.isRunning}
                            style={{
                                background: codeEditor.isRunning
                                    ? 'rgba(50, 215, 75, 0.3)'
                                    : 'linear-gradient(135deg, #32d74b 0%, #30d158 100%)',
                                color: codeEditor.isRunning ? 'rgba(255, 255, 255, 0.7)' : '#000',
                                border: 'none',
                                borderRadius: '10px',
                                padding: '8px 16px',
                                fontSize: '0.855rem',
                                fontWeight: 600,
                                cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease',
                                boxShadow: codeEditor.isRunning ? 'none' : '0 2px 12px rgba(50, 215, 75, 0.3)',
                                flexShrink: 0
                            }}
                        >
                            {codeEditor.isRunning ? <Timer size={13} /> : <Play size={13} fill="currentColor" />}
                            <span>{codeEditor.isRunning ? 'Running...' : 'Run'}</span>
                        </button>
                    </div>
                    
                    {/* Tab Content */}
                    {activeTab === 'code' && (
                        <>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                overflow: 'hidden',
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}>
                                <div style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    minHeight: 0
                                }}>
                                    <div style={{
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        background: 'rgba(0, 0, 0, 0.4)',
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
                                                originalFiles={challenge.files}
                                                onResetFile={(fileName, originalContent) => {
                                                    const updatedFiles = codeEditor.files.map(f =>
                                                        f.name === fileName ? { ...f, content: originalContent } : f
                                                    );
                                                    onCodeChange(updatedFiles);
                                                }}
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
                        </>
                    )}

                    {activeTab === 'results' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.05)',
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
                                    background: '#1d1d1f',
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
                                        fontSize: '1rem'
                                    }}>
                                        Run your code to see the results here
                                    </p>
                                    <button
                                        style={{
                                            background: '#32d74b',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '10px',
                                            padding: '12px 24px',
                                            fontSize: '0.875rem',
                                            fontWeight: 600,
                                            cursor: codeEditor.isRunning ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            opacity: codeEditor.isRunning ? 0.6 : 1
                                        }}
                                        onClick={() => {
                                            onRun();
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
