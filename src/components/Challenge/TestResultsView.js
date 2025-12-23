// src/components/Challenge/TestResultsView.js

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown } from 'lucide-react';

const TestResultsView = ({ testResults, rawOutput, overallResult, feedback }) => {
    // Check if this is a compilation error
    const isCompilationError = overallResult === 'COMPILATION_ERROR' ||
        overallResult === 'PRE_COMPILATION_ERROR' ||
        (!testResults || testResults.length === 0) && rawOutput && (
            rawOutput.includes('COMPILATION_ERROR') ||
            rawOutput.includes('Compilation failed') ||
            rawOutput.includes('error:') ||
            rawOutput.includes('fatal error:') ||
            rawOutput.includes('syntax error')
        );

    if (isCompilationError) {
        const errorFeedback = feedback?.find(f => f.type === 'error');
        const errorDetails = errorFeedback?.details || rawOutput || "Compilation failed with unknown error.";

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Compilation Error Header */}
                <div style={{
                    padding: '16px 20px',
                    background: 'rgba(255, 69, 58, 0.08)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 69, 58, 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <AlertTriangle size={20} color="#ff453a" />
                        <h4 style={{
                            margin: 0,
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: '#ff453a'
                        }}>
                            Compilation Error
                        </h4>
                    </div>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem' }}>
                        Your code contains syntax errors that prevent compilation.
                    </p>
                </div>

                {/* Error Details */}
                <div style={{
                    background: '#1e1e1e',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 69, 58, 0.1)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <XCircle size={14} color="#ff453a" />
                        <span style={{ fontWeight: 600, color: '#ff453a', fontSize: '0.8125rem' }}>
                            {errorFeedback?.message || 'Compilation Failed'}
                        </span>
                    </div>
                    <pre style={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        margin: 0,
                        color: '#d4d4d8',
                        fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                        padding: '16px',
                        overflow: 'auto'
                    }}>
                        {errorDetails}
                    </pre>
                </div>
            </div>
        );
    }

    if (!testResults || testResults.length === 0) {
        return (
            <div style={{
                background: '#1e1e1e',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '16px'
            }}>
                <pre style={{
                    fontSize: '0.8125rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    margin: 0,
                    color: '#d4d4d8',
                    fontFamily: 'SF Mono, Monaco, Consolas, monospace'
                }}>
                    {rawOutput || "No test results to display."}
                </pre>
            </div>
        );
    }

    const passedCount = testResults.filter(t => t.status === 'PASSED').length;
    const totalCount = testResults.length;
    const overallSuccess = passedCount === totalCount;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Overall Summary */}
            <div style={{
                padding: '16px 20px',
                background: overallSuccess ? 'rgba(50, 215, 75, 0.08)' : 'rgba(255, 69, 58, 0.08)',
                borderRadius: '12px',
                border: `1px solid ${overallSuccess ? 'rgba(50, 215, 75, 0.15)' : 'rgba(255, 69, 58, 0.15)'}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    {overallSuccess ? (
                        <CheckCircle2 size={20} color="#32d74b" />
                    ) : (
                        <XCircle size={20} color="#ff453a" />
                    )}
                    <h4 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: overallSuccess ? '#32d74b' : '#ff453a'
                    }}>
                        {overallSuccess ? 'Accepted' : 'Wrong Answer'}
                    </h4>
                </div>
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.875rem' }}>
                    {passedCount} / {totalCount} tests passed
                </p>
            </div>

            {/* Individual Test Cases */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {testResults.map((test, index) => {
                    const isPassed = test.status === 'PASSED';

                    return (
                        <div key={index} style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '10px',
                            padding: '14px 16px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {isPassed ? (
                                    <CheckCircle2 size={16} color="#32d74b" />
                                ) : (
                                    <XCircle size={16} color="#ff453a" />
                                )}
                                <span style={{
                                    fontWeight: 600,
                                    color: '#f5f5f7',
                                    fontSize: '0.875rem'
                                }}>
                                    {test.testName}
                                </span>
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '0.75rem',
                                    color: '#71717a',
                                    fontFamily: 'SF Mono, Monaco, monospace'
                                }}>
                                    {test.executionTime}ms
                                </span>
                            </div>
                            {!isPassed && test.message && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '12px',
                                    background: '#1e1e1e',
                                    borderRadius: '8px',
                                    fontSize: '0.8125rem',
                                    color: '#d4d4d8',
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
                                    lineHeight: 1.5
                                }}>
                                    {test.message}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Raw output for debugging */}
            <details style={{ marginTop: '4px' }}>
                <summary style={{
                    cursor: 'pointer',
                    color: '#d4d4d8',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    userSelect: 'none'
                }}>
                    <ChevronDown size={14} />
                    Show Full Log
                </summary>
                <div style={{
                    marginTop: '12px',
                    background: '#1e1e1e',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflow: 'hidden'
                }}>
                    <pre style={{
                        padding: '16px',
                        fontSize: '0.75rem',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        margin: 0,
                        color: '#e4e4e7',
                        fontFamily: 'SF Mono, Monaco, Consolas, monospace'
                    }}>
                        {rawOutput}
                    </pre>
                </div>
            </details>
        </div>
    );
};

export default TestResultsView;
