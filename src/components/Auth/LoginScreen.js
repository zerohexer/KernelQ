import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import GoogleSSOButton from './GoogleSSOButton.js';
import { OAuthCallbackHandler } from '../../utils/oauth-callback.js';

const LoginScreen = ({ onLogin, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [oauthLoading, setOauthLoading] = useState(false);

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const oauthData = await OAuthCallbackHandler.checkForOAuthCallback();

            if (oauthData) {
                if (oauthData.success) {
                    if (OAuthCallbackHandler.validateOAuthData(oauthData)) {
                        setOauthLoading(true);
                        onLogin(
                            oauthData.userData,
                            oauthData.progressData,
                            oauthData.accessToken,
                            oauthData.refreshToken
                        );
                    } else {
                        setError('Authentication data incomplete. Please try again.');
                    }
                } else {
                    setError(oauthData.error || 'Google Sign-In failed. Please try again.');
                }
            }
        };

        handleOAuthCallback();
    }, [onLogin]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                onLogin(result.user, result.progress, result.accessToken, result.refreshToken);
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSSOSuccess = (oauthData) => {
        console.log('Google SSO success:', oauthData);
    };

    const handleGoogleSSOError = (error) => {
        console.error('Google SSO error:', error);
        setError(error);
        setOauthLoading(false);
    };

    const inputStyle = {
        width: '100%',
        padding: '14px 16px 14px 48px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        background: '#1e1e1e',
        color: '#f5f5f7',
        fontSize: '0.9375rem',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#0a0a0c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                margin: '20px',
                padding: '40px',
                background: '#141416',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#f5f5f7',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.02em'
                    }}>
                        KernelQ
                    </h1>
                    <p style={{
                        fontSize: '0.9375rem',
                        color: '#71717a',
                        margin: 0
                    }}>
                        Sign in to continue learning
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    {/* Google SSO Button */}
                    <GoogleSSOButton
                        onSuccess={handleGoogleSSOSuccess}
                        onError={handleGoogleSSOError}
                        disabled={isLoading || oauthLoading}
                        variant="signin"
                    />

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        margin: '24px 0',
                        color: '#52525b',
                        fontSize: '0.8125rem'
                    }}>
                        <div style={{
                            flex: 1,
                            height: '1px',
                            background: 'rgba(255, 255, 255, 0.08)'
                        }} />
                        <span style={{ padding: '0 16px' }}>or continue with email</span>
                        <div style={{
                            flex: 1,
                            height: '1px',
                            background: 'rgba(255, 255, 255, 0.08)'
                        }} />
                    </div>

                    {/* Email Input */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <Mail
                            size={18}
                            color="#71717a"
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Email address"
                            style={inputStyle}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#32d74b';
                                e.target.style.background = '#252528';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.background = '#1e1e1e';
                            }}
                        />
                    </div>

                    {/* Password Input */}
                    <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <Lock
                            size={18}
                            color="#71717a"
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none'
                            }}
                        />
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Password"
                            style={inputStyle}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#32d74b';
                                e.target.style.background = '#252528';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.target.style.background = '#1e1e1e';
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: 'rgba(255, 69, 58, 0.1)',
                            border: '1px solid rgba(255, 69, 58, 0.2)',
                            color: '#ff453a',
                            fontSize: '0.875rem',
                            marginBottom: '24px'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '14px 24px',
                            background: isLoading ? 'rgba(50, 215, 75, 0.5)' : '#32d74b',
                            color: '#000',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '0.9375rem',
                            fontWeight: 600,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {isLoading ? 'Signing In...' : (
                            <>
                                Sign In
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {/* Register Link */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#71717a',
                            margin: 0
                        }}>
                            Don't have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToRegister}
                                disabled={isLoading}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#32d74b',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    padding: 0,
                                    fontFamily: 'inherit'
                                }}
                            >
                                Create Account
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
