import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Trophy, TrendingUp, ChevronLeft, Clock } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

const Sidebar = ({
    userProfile,
    premiumStyles,
    user,
    userProgress
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const hideTimeoutRef = useRef(null);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const showSidebar = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
        setIsVisible(true);
    };

    const hideSidebar = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setIsVisible(false);
        }, 300);
    };

    const hideSidebarImmediate = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
        setIsVisible(false);
    };

    // Calculate progress
    const xp = userProgress?.total_xp || userProfile?.xp || 0;
    const problemsSolved = userProgress?.problems_solved || userProfile?.uniqueChallengesCompleted || 0;

    // Format time
    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <>
            {/* Trigger Zone - invisible strip on left edge */}
            <div
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '16px',
                    height: '100vh',
                    zIndex: 1001,
                    cursor: 'pointer'
                }}
                onMouseEnter={showSidebar}
            />

            {/* Sidebar Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: isVisible ? '16px' : '-320px',
                    width: '280px',
                    background: '#18181b',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '20px',
                    zIndex: 1002,
                    transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isVisible
                        ? '0 16px 32px rgba(0, 0, 0, 0.4)'
                        : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}
                onMouseEnter={showSidebar}
                onMouseLeave={hideSidebar}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <TrendingUp size={18} color={PremiumStyles.colors.accent} />
                        <span style={{
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: PremiumStyles.colors.text
                        }}>
                            Progress
                        </span>
                    </div>

                    <button
                        onClick={hideSidebarImmediate}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: 'none',
                            color: PremiumStyles.colors.textSecondary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>

                {/* Total XP */}
                <div style={{
                    padding: '20px',
                    background: 'rgba(50, 215, 75, 0.08)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(50, 215, 75, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Sparkles size={24} color={PremiumStyles.colors.accent} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: PremiumStyles.colors.text,
                            letterSpacing: '-0.02em'
                        }}>
                            {xp.toLocaleString()}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: PremiumStyles.colors.textTertiary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Total XP
                        </div>
                    </div>
                </div>

                {/* Problems Solved */}
                <div style={{
                    padding: '20px',
                    background: 'rgba(255, 159, 10, 0.08)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(255, 159, 10, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Trophy size={24} color={PremiumStyles.colors.accentOrange} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: PremiumStyles.colors.text,
                            letterSpacing: '-0.02em'
                        }}>
                            {problemsSolved}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: PremiumStyles.colors.textTertiary,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Solved
                        </div>
                    </div>
                </div>

                {/* Clock Widget */}
                <div style={{
                    padding: '20px',
                    background: 'rgba(10, 132, 255, 0.08)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(10, 132, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Clock size={24} color={PremiumStyles.colors.accentBlue} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: PremiumStyles.colors.text,
                            fontFamily: 'SF Mono, Monaco, monospace',
                            letterSpacing: '0.02em'
                        }}>
                            {formatTime(currentTime)}
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            color: PremiumStyles.colors.textSecondary
                        }}>
                            {formatDate(currentTime)}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
