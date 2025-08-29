import React, { useState } from 'react';
import PremiumStyles from '../../styles/PremiumStyles.js';

const GoogleSSOButton = ({ onSuccess, onError, disabled = false, variant = 'signin' }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSSO = async () => {
        setIsLoading(true);
        
        try {
            // Get the current origin for the backend URL
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 
                             (window.location.origin.includes('kernelq.com') ? 
                              'https://kernelq.com/api' : 
                              'http://localhost:3001');
            
            console.log('🔐 Starting Google SSO flow with backend:', backendUrl);
            
            // Redirect to backend Google OAuth endpoint
            window.location.href = `${backendUrl}/auth/google`;
            
        } catch (error) {
            console.error('Google SSO error:', error);
            setIsLoading(false);
            if (onError) {
                onError(error.message || 'Failed to initiate Google Sign-In');
            }
        }
    };

    const buttonText = variant === 'signup' ? 'Sign up with Google' : 'Sign in with Google';
    const loadingText = variant === 'signup' ? 'Creating account...' : 'Signing in...';

    return (
        <button
            type="button"
            onClick={handleGoogleSSO}
            disabled={disabled || isLoading}
            style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: `1px solid ${PremiumStyles.colors.border}`,
                borderRadius: '12px',
                background: isLoading || disabled ? 
                    PremiumStyles.colors.surface : 
                    'white',
                color: isLoading || disabled ? 
                    PremiumStyles.colors.textSecondary : 
                    '#1f1f1f',
                fontSize: PremiumStyles.typography.sizes.base,
                fontWeight: PremiumStyles.typography.weights.medium,
                cursor: (disabled || isLoading) ? 'not-allowed' : 'pointer',
                transition: PremiumStyles.animations.transition,
                marginBottom: '1rem',
                fontFamily: PremiumStyles.typography.fontFamily,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
            }}
            onMouseOver={(e) => {
                if (!disabled && !isLoading) {
                    e.target.style.boxShadow = `0 2px 8px rgba(0, 0, 0, 0.1)`;
                    e.target.style.transform = 'translateY(-1px)';
                }
            }}
            onMouseOut={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.transform = 'translateY(0)';
            }}
        >
            {/* Google Logo SVG */}
            {!isLoading && (
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
            )}
            
            {/* Loading Spinner */}
            {isLoading && (
                <div
                    style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #4285F4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}
                />
            )}
            
            {isLoading ? loadingText : buttonText}
        </button>
    );
};

// Add CSS animation for spinner
const styleSheet = document.styleSheets[0];
try {
    styleSheet.insertRule(`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `, styleSheet.cssRules.length);
} catch (e) {
    // Ignore if animation already exists
}

export default GoogleSSOButton;