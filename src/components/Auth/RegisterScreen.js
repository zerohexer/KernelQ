import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import GoogleSSOButton from './GoogleSSOButton.js';
import { OAuthCallbackHandler } from '../../utils/oauth-callback.js';

const RegisterScreen = ({ onRegister, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [oauthLoading, setOauthLoading] = useState(false);

    useEffect(() => {
        const handleOAuthCallback = async () => {
            const oauthData = await OAuthCallbackHandler.checkForOAuthCallback();

            if (oauthData) {
                if (oauthData.success) {
                    if (OAuthCallbackHandler.validateOAuthData(oauthData)) {
                        setOauthLoading(true);
                        if (onRegister) {
                            onRegister(
                                oauthData.userData,
                                oauthData.progressData,
                                oauthData.accessToken,
                                oauthData.refreshToken
                            );
                        }
                    } else {
                        setError('Authentication data incomplete. Please try again.');
                    }
                } else {
                    setError(oauthData.error || 'Google Sign-In failed. Please try again.');
                }
            }
        };

        handleOAuthCallback();
    }, [onRegister]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError('');
        if (success) setSuccess('');
    };

    const validateForm = () => {
        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }

        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters long');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (!validateForm()) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    memberStatus: 'Standard Free User'
                })
            });

            const result = await response.json();

            if (result.success) {
                setSuccess('Account created successfully! Redirecting to sign in...');
                setTimeout(() => {
                    onSwitchToLogin();
                }, 2000);
            } else {
                setError(result.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
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

    const iconStyle = {
        position: 'absolute',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none'
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
            zIndex: 1000,
            overflowY: 'auto',
            padding: '20px 0'
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
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: '#f5f5f7',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.02em'
                    }}>
                        Join KernelQ
                    </h1>
                    <p style={{
                        fontSize: '0.9375rem',
                        color: '#71717a',
                        margin: 0
                    }}>
                        Start your kernel development journey
                    </p>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                    {/* Google SSO Button */}
                    <GoogleSSOButton
                        onSuccess={handleGoogleSSOSuccess}
                        onError={handleGoogleSSOError}
                        disabled={isLoading || oauthLoading}
                        variant="signup"
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

                    {/* Username Input */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <User size={18} color="#71717a" style={iconStyle} />
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Username"
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

                    {/* Email Input */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <Mail size={18} color="#71717a" style={iconStyle} />
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
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <Lock size={18} color="#71717a" style={iconStyle} />
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

                    {/* Confirm Password Input */}
                    <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <Lock size={18} color="#71717a" style={iconStyle} />
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Confirm password"
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

                    {/* Success Message */}
                    {success && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            background: 'rgba(50, 215, 75, 0.1)',
                            border: '1px solid rgba(50, 215, 75, 0.2)',
                            color: '#32d74b',
                            fontSize: '0.875rem',
                            marginBottom: '24px'
                        }}>
                            <CheckCircle size={16} />
                            {success}
                        </div>
                    )}

                    {/* Register Button */}
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
                        {isLoading ? 'Creating Account...' : (
                            <>
                                Create Account
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {/* Login Link */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{
                            fontSize: '0.875rem',
                            color: '#71717a',
                            margin: 0
                        }}>
                            Already have an account?{' '}
                            <button
                                type="button"
                                onClick={onSwitchToLogin}
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
                                Sign In
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterScreen;
