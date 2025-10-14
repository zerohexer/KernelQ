// src/components/Challenge/TestResultsView.js

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

const TestResultsView = ({ testResults, rawOutput, overallResult, feedback }) => {
  // Check if this is a compilation error using overallResult first, then fallback to text analysis
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
    // Extract error details from feedback if available
    const errorFeedback = feedback?.find(f => f.type === 'error');
    const errorDetails = errorFeedback?.details || rawOutput || "Compilation failed with unknown error.";
    
    // Display compilation error with proper styling
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Compilation Error Header */}
        <div style={{
          ...PremiumStyles.glass.light,
          padding: '1rem 1.5rem',
          borderRadius: '12px',
          borderLeft: `4px solid ${PremiumStyles.colors.error}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} color={PremiumStyles.colors.error} />
            <h4 style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: 600,
              color: PremiumStyles.colors.error
            }}>
              Compilation Error
            </h4>
          </div>
          <p style={{ margin: 0, color: PremiumStyles.colors.textSecondary }}>
            Your code contains syntax errors that prevent compilation.
          </p>
        </div>

        {/* Error Details */}
        <div style={{
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid rgba(220, 38, 38, 0.2)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <XCircle size={16} color={PremiumStyles.colors.error} />
            <span style={{ fontWeight: 600, color: PremiumStyles.colors.error }}>
              {errorFeedback?.message || 'Compilation Failed'}
            </span>
          </div>
          <pre style={{
            fontSize: '0.875rem',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            margin: 0,
            color: 'rgba(245, 245, 247, 0.9)',
            fontFamily: 'SF Mono, Monaco, Menlo, "Ubuntu Mono", monospace',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '0.75rem',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {errorDetails}
          </pre>
        </div>
      </div>
    );
  }

  if (!testResults || testResults.length === 0) {
    // Fallback for other cases where there are no test results
    return (
      <pre style={{
        fontSize: '0.875rem',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        margin: 0,
        color: 'rgba(245, 245, 247, 0.9)',
        fontFamily: 'SF Mono, Monaco, Menlo, "Ubuntu Mono", monospace'
      }}>
        {rawOutput || "No test results to display."}
      </pre>
    );
  }

  const passedCount = testResults.filter(t => t.status === 'PASSED').length;
  const totalCount = testResults.length;
  const overallSuccess = passedCount === totalCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overall Summary */}
      <div style={{
        ...PremiumStyles.glass.light,
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        borderLeft: `4px solid ${overallSuccess ? PremiumStyles.colors.accent : PremiumStyles.colors.error}`
      }}>
        <h4 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.2rem',
          fontWeight: 600,
          color: overallSuccess ? PremiumStyles.colors.accent : PremiumStyles.colors.error
        }}>
          {overallSuccess ? 'Accepted' : 'Wrong Answer'}
        </h4>
        <p style={{ margin: 0, color: PremiumStyles.colors.textSecondary }}>
          {passedCount} / {totalCount} tests passed.
        </p>
      </div>

      {/* Individual Test Cases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {testResults.map((test, index) => {
          const isPassed = test.status === 'PASSED';
          const Icon = isPassed ? CheckCircle2 : XCircle;
          const iconColor = isPassed ? PremiumStyles.colors.accent : PremiumStyles.colors.error;

          return (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '1rem',
              border: `1px solid ${PremiumStyles.colors.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={20} color={iconColor} />
                <span style={{ fontWeight: 500, color: PremiumStyles.colors.text }}>
                  {test.testName}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: PremiumStyles.colors.textTertiary }}>
                  {test.executionTime} ms
                </span>
              </div>
              {!isPassed && test.message && (
                <div style={{
                  marginTop: '0.75rem',
                  paddingLeft: '2.25rem',
                  fontSize: '0.875rem',
                  color: PremiumStyles.colors.textSecondary,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'SF Mono, Monaco, monospace'
                }}>
                  {test.message}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Raw output for debugging */}
      <details style={{ marginTop: '1rem' }}>
        <summary style={{ cursor: 'pointer', color: PremiumStyles.colors.textSecondary }}>
          Show Full Log
        </summary>
        <pre style={{
          marginTop: '0.5rem',
          background: 'rgba(0,0,0,0.2)',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.8rem',
          whiteSpace: 'pre-wrap',
        }}>
          {rawOutput}
        </pre>
      </details>

    </div>
  );
};

export default TestResultsView;