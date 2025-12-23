import React, { useState, useEffect } from 'react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

const NavigationBar = ({
    getCurrentPhase,
    phaseSystem,
    premiumStyles,
    user,
    onLogout
}) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav style={{
            ...premiumStyles.navbar,
            background: isScrolled
                ? 'rgba(18, 18, 20, 0.92)'
                : 'rgba(18, 18, 20, 0.85)',
            boxShadow: isScrolled
                ? `0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)`
                : `${PremiumStyles.shadows.xl}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
        }}>
            {/* Logo Section */}
            <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.02em',
                color: PremiumStyles.colors.text
            }}>
                KernelQ
            </h1>

            {/* User Section */}
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                {user && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '0 16px 0 16px',
                            height: '100%',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '24px',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '16px',
                            background: '#f5f5f7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            <User size={16} color="#18181b" strokeWidth={2.5} />
                            {/* Online indicator */}
                            <div style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: PremiumStyles.colors.accent,
                                border: '2px solid rgba(18, 18, 20, 0.95)',
                                boxShadow: '0 0 8px rgba(50, 215, 75, 0.5)'
                            }} />
                        </div>

                        {/* User Info */}
                        <div style={{ minWidth: 0, maxWidth: '120px' }}>
                            <div style={{
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: PremiumStyles.colors.text,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                letterSpacing: '-0.01em'
                            }}>
                                {user.username}
                            </div>
                            <div style={{
                                fontSize: '0.625rem',
                                color: user.memberStatus === 'Creator'
                                    ? PremiumStyles.colors.accent
                                    : PremiumStyles.colors.textTertiary,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                            }}>
                                {user.memberStatus === 'Creator' ? 'ADMIN' :
                                 user.memberStatus === 'Standard Free User' ? 'FREE' :
                                 user.memberStatus === 'Monthly Subscription User' ? 'PRO' :
                                 user.memberStatus === 'Permanent User' ? 'LIFETIME' : 'FREE'}
                            </div>
                        </div>

                        <ChevronDown
                            size={14}
                            color={PremiumStyles.colors.textTertiary}
                            style={{
                                transition: 'transform 0.2s ease',
                                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}
                        />

                        {/* Dropdown Menu */}
                        {showUserMenu && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    minWidth: '200px',
                                    background: 'rgba(18, 18, 20, 0.98)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 16px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                                    overflow: 'hidden',
                                    zIndex: 1001,
                                    animation: 'fadeInDown 0.2s ease'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* User Stats */}
                                <div style={{
                                    padding: '16px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                                }}>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        color: PremiumStyles.colors.textTertiary,
                                        marginBottom: '4px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Signed in as
                                    </div>
                                    <div style={{
                                        fontSize: '0.9375rem',
                                        fontWeight: 600,
                                        color: PremiumStyles.colors.text
                                    }}>
                                        {user.email || user.username}
                                    </div>
                                </div>

                                {/* Sign Out Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowUserMenu(false);
                                        onLogout();
                                    }}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        background: 'transparent',
                                        border: 'none',
                                        color: PremiumStyles.colors.error,
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'background 0.15s ease',
                                        textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(255, 69, 58, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'transparent';
                                    }}
                                >
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Click outside to close menu */}
            {showUserMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1000
                    }}
                    onClick={() => setShowUserMenu(false)}
                />
            )}
        </nav>
    );
};

export default NavigationBar;
