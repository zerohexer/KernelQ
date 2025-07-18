import React from 'react';
import ReactMarkdown from 'react-markdown';

const ConceptLearner = ({ concept, setSelectedConcept }) => {
    if (!concept) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(29, 29, 31, 0.95)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                padding: '2.5rem',
                width: '100%',
                maxWidth: '1000px',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '2rem',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: '1.5rem'
                }}>
                    <h2 style={{
                        fontSize: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
                        fontWeight: 700,
                        color: '#f5f5f7',
                        margin: 0,
                        letterSpacing: '-0.025em',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                    }}>
                        {concept.title}
                    </h2>
                    <button
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            padding: '0.75rem',
                            color: '#f5f5f7',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 500,
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '44px',
                            height: '44px'
                        }}
                        onClick={() => setSelectedConcept(null)}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        ✕
                    </button>
                </div>
                
                {/* Scrollable Content */}
                <div style={{ 
                    flex: 1, 
                    overflow: 'auto',
                    paddingRight: '1rem',
                    marginRight: '-1rem'
                }}>
                    {/* Description Section */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: '0 0 1rem 0',
                            letterSpacing: '-0.02em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                        }}>
                            Description
                        </h3>
                        <p style={{
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: 'rgba(245, 245, 247, 0.8)',
                            margin: 0,
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                            {concept.description}
                        </p>
                    </div>
                    
                    {/* Explanation Section */}
                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{
                            fontSize: '1.25rem',
                            fontWeight: 600,
                            color: '#f5f5f7',
                            margin: '0 0 1rem 0',
                            letterSpacing: '-0.02em',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                        }}>
                            Explanation
                        </h3>
                        <div style={{
                            fontSize: '1rem',
                            lineHeight: '1.7',
                            color: 'rgba(245, 245, 247, 0.8)',
                            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                        }}>
                            <ReactMarkdown
                                components={{
                                    p: ({node, ...props}) => <p style={{ 
                                        margin: '0 0 1.5rem 0',
                                        lineHeight: '1.7'
                                    }} {...props} />,
                                    ul: ({node, ...props}) => <ul style={{ 
                                        margin: '1rem 0 1.5rem 0', 
                                        paddingLeft: '1.5rem',
                                        listStyleType: 'disc'
                                    }} {...props} />,
                                    ol: ({node, ...props}) => <ol style={{ 
                                        margin: '1rem 0 1.5rem 0', 
                                        paddingLeft: '1.5rem'
                                    }} {...props} />,
                                    li: ({node, ...props}) => <li style={{ 
                                        margin: '0 0 0.75rem 0',
                                        lineHeight: '1.7',
                                        listStyleType: 'inherit'
                                    }} {...props} />,
                                    strong: ({node, ...props}) => <strong style={{ 
                                        color: '#f5f5f7', 
                                        fontWeight: 600,
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        marginTop: '1rem'
                                    }} {...props} />,
                                    em: ({node, ...props}) => <em style={{ 
                                        color: '#f5f5f7', 
                                        fontStyle: 'italic' 
                                    }} {...props} />,
                                    code: ({node, ...props}) => <code style={{ 
                                        background: 'rgba(255, 255, 255, 0.1)', 
                                        padding: '0.2rem 0.4rem', 
                                        borderRadius: '4px', 
                                        fontFamily: 'SF Mono, Monaco, monospace',
                                        fontSize: '0.9em',
                                        color: '#f5f5f7'
                                    }} {...props} />,
                                    h1: ({node, ...props}) => <h1 style={{ 
                                        color: '#f5f5f7', 
                                        fontWeight: 600,
                                        fontSize: '1.2rem',
                                        margin: '1.5rem 0 1rem 0'
                                    }} {...props} />,
                                    h2: ({node, ...props}) => <h2 style={{ 
                                        color: '#f5f5f7', 
                                        fontWeight: 600,
                                        fontSize: '1.1rem',
                                        margin: '1.5rem 0 1rem 0'
                                    }} {...props} />,
                                    h3: ({node, ...props}) => <h3 style={{ 
                                        color: '#f5f5f7', 
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        margin: '1.5rem 0 1rem 0'
                                    }} {...props} />,
                                    blockquote: ({node, ...props}) => <blockquote style={{
                                        borderLeft: '3px solid rgba(255, 255, 255, 0.3)',
                                        paddingLeft: '1rem',
                                        margin: '1rem 0',
                                        fontStyle: 'italic',
                                        color: 'rgba(245, 245, 247, 0.7)'
                                    }} {...props} />,
                                    br: ({node, ...props}) => <br style={{ marginBottom: '0.5rem' }} {...props} />
                                }}
                            >
                                {concept.explanation}
                            </ReactMarkdown>
                        </div>
                    </div>
                    
                    {/* Code Example Section */}
                    {concept.codeExample && (
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: '0 0 1rem 0',
                                letterSpacing: '-0.02em',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                            }}>
                                Code Example
                            </h3>
                            <div style={{
                                background: 'rgba(0, 0, 0, 0.4)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: '1.5rem',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                fontFamily: 'SF Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
                                overflow: 'auto'
                            }}>
                                <pre style={{
                                    fontSize: '0.875rem',
                                    lineHeight: '1.5',
                                    color: '#f5f5f7',
                                    margin: 0,
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontFamily: 'inherit'
                                }}>
                                    {concept.codeExample}
                                </pre>
                            </div>
                        </div>
                    )}
                    
                    {/* Practice Exercises Section */}
                    {concept.exercises && (
                        <div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: '#f5f5f7',
                                margin: '0 0 1rem 0',
                                letterSpacing: '-0.02em',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                            }}>
                                Practice Exercises
                            </h3>
                            <ul style={{ 
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                color: 'rgba(245, 245, 247, 0.8)',
                                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                                paddingLeft: '1.5rem',
                                margin: 0
                            }}>
                                {concept.exercises.map((exercise, index) => (
                                    <li key={index} style={{ 
                                        marginBottom: '0.75rem',
                                        listStyleType: 'disc'
                                    }}>
                                        {exercise}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConceptLearner;