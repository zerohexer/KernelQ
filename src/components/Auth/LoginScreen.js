import React, { useState } from 'react';
import { premiumStyles } from '../../styles/PremiumStyles.js';
import PremiumStyles from '../../styles/PremiumStyles.js';

const LoginScreen = ({ onLogin, onSwitchToRegister, premiumStyles: styles }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
                onLogin(result.user, result.progress);
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

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: PremiumStyles.colors.background,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                ...PremiumStyles.glass.medium,
                width: '100%',
                maxWidth: '400px',
                margin: '20px',
                padding: '2rem',
                borderRadius: '20px',
                border: `1px solid ${PremiumStyles.colors.border}`,
                boxShadow: PremiumStyles.shadows.xl
            }}>
                {/* KernelQ Logo/Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '60px',
                        height: '52px',
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${PremiumStyles.colors.primary} 0%, ${PremiumStyles.colors.primaryDark} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem auto',
                        boxShadow: PremiumStyles.shadows.md
                    }}>
                        <svg width="36" height="32" viewBox="0 0 120 100" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
                            <defs>
                                <linearGradient id="login-apple-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.95 }} />
                                    <stop offset="100%" style={{ stopColor: '#d1d1d6', stopOpacity: 0.9 }} />
                                </linearGradient>
                                <linearGradient id="login-apple-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style={{ stopColor: '#f5f5f7', stopOpacity: 0.9 }} />
                                    <stop offset="100%" style={{ stopColor: '#e5e5ea', stopOpacity: 0.8 }} />
                                </linearGradient>
                            </defs>

                            <path d="M15 15 L15 85 L28 85 L28 55 L50 85 L63 85 L40 55 L63 15 L50 15 L32 45 L28 35 L28 15 Z"
                                  fill="url(#login-apple-silver)"
                                  stroke="none"/>

                            <g transform="translate(50, 15) scale(0.65)">
                                <path d="M20 20 L60 0 L100 20 L60 40 Z"
                                      fill="url(#login-apple-accent)"
                                      stroke="rgba(255,255,255,0.3)"
                                      strokeWidth="0.5"/>
                                <path d="M20 20 L60 40 L60 100 L20 80 Z"
                                      fill="rgba(245,245,247,0.7)"
                                      stroke="rgba(255,255,255,0.2)"
                                      strokeWidth="0.5"/>
                                <path d="M60 40 L100 20 L100 80 L60 100 Z"
                                      fill="rgba(229,229,234,0.8)"
                                      stroke="rgba(255,255,255,0.2)"
                                      strokeWidth="0.5"/>
                            </g>
                        </svg>
                    </div>
                    
                    <h1 style={{
                        ...premiumStyles.headingXL,
                        background: `linear-gradient(135deg, ${PremiumStyles.colors.accentOrange}, ${PremiumStyles.colors.warning})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem',
                        fontSize: PremiumStyles.typography.sizes['2xl']
                    }}>
                        KernelQ
                    </h1>
                    <p style={{
                        ...premiumStyles.textSecondary,
                        fontSize: PremiumStyles.typography.sizes.base,
                        margin: 0
                    }}>
                        Professional Kernel Development Platform
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: PremiumStyles.colors.text,
                            fontSize: PremiumStyles.typography.sizes.sm,
                            fontWeight: PremiumStyles.typography.weights.medium
                        }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter your email"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: `1px solid ${PremiumStyles.colors.border}`,
                                borderRadius: '12px',
                                background: PremiumStyles.colors.surface,
                                color: PremiumStyles.colors.text,
                                fontSize: PremiumStyles.typography.sizes.base,
                                outline: 'none',
                                transition: PremiumStyles.animations.transition,
                                boxSizing: 'border-box',
                                fontFamily: PremiumStyles.typography.fontFamily
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = PremiumStyles.colors.accentOrange;
                                e.target.style.boxShadow = `0 0 0 3px rgba(255, 159, 10, 0.1)`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = PremiumStyles.colors.border;
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            color: PremiumStyles.colors.text,
                            fontSize: PremiumStyles.typography.sizes.sm,
                            fontWeight: PremiumStyles.typography.weights.medium
                        }}>
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            placeholder="Enter your password"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: `1px solid ${PremiumStyles.colors.border}`,
                                borderRadius: '12px',
                                background: PremiumStyles.colors.surface,
                                color: PremiumStyles.colors.text,
                                fontSize: PremiumStyles.typography.sizes.base,
                                outline: 'none',
                                transition: PremiumStyles.animations.transition,
                                boxSizing: 'border-box',
                                fontFamily: PremiumStyles.typography.fontFamily
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = PremiumStyles.colors.accentOrange;
                                e.target.style.boxShadow = `0 0 0 3px rgba(255, 159, 10, 0.1)`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = PremiumStyles.colors.border;
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 69, 58, 0.1)',
                            border: `1px solid rgba(255, 69, 58, 0.2)`,
                            color: PremiumStyles.colors.error,
                            fontSize: PremiumStyles.typography.sizes.sm,
                            marginBottom: '1.5rem'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: isLoading 
                                ? `rgba(255, 159, 10, 0.5)` 
                                : `linear-gradient(135deg, ${PremiumStyles.colors.accentOrange}, ${PremiumStyles.colors.warning})`,
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: PremiumStyles.typography.sizes.base,
                            fontWeight: PremiumStyles.typography.weights.semibold,
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: PremiumStyles.animations.transition,
                            marginBottom: '1.5rem',
                            fontFamily: PremiumStyles.typography.fontFamily
                        }}
                        onMouseOver={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = `0 4px 12px rgba(255, 159, 10, 0.3)`;
                            }
                        }}
                        onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>

                    {/* Register Link */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{
                            ...premiumStyles.textSecondary,
                            fontSize: PremiumStyles.typography.sizes.sm,
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
                                    color: PremiumStyles.colors.accentOrange,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontSize: PremiumStyles.typography.sizes.sm,
                                    fontWeight: PremiumStyles.typography.weights.medium,
                                    textDecoration: 'underline',
                                    padding: 0,
                                    fontFamily: PremiumStyles.typography.fontFamily
                                }}
                            >
                                Create Account
                            </button>
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: `1px solid ${PremiumStyles.colors.border}`
                }}>
                    <p style={{
                        ...premiumStyles.textSecondary,
                        fontSize: PremiumStyles.typography.sizes.xs,
                        margin: 0
                    }}>
                        Secure authentication • SQLite + WAL mode
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;