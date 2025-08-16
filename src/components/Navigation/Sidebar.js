import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, ChevronLeft } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

const Sidebar = ({
    userProfile,
    premiumStyles,
    user,
    userProgress
}) => {
    const [isVisible, setIsVisible] = useState(false);
    
    // Hide sidebar after 3 seconds of no interaction
    useEffect(() => {
        let hideTimer;
        if (isVisible) {
            hideTimer = setTimeout(() => {
                setIsVisible(false);
            }, 3000);
        }
        return () => clearTimeout(hideTimer);
    }, [isVisible]);

    // Trigger zone styles
    const triggerZone = {
        position: 'fixed',
        left: 0,
        top: '60px',
        width: '20px',
        height: 'calc(100vh - 60px)',
        zIndex: 1001,
        cursor: 'pointer',
        background: 'transparent',
        transition: 'background-color 0.2s ease'
    };

    // Overlay styles
    const overlay = {
        position: 'fixed',
        top: '60px',
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 60px)',
        background: 'rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        visibility: isVisible ? 'visible' : 'hidden',
        transition: 'opacity 0.3s ease, visibility 0.3s ease',
        backdropFilter: 'blur(2px)'
    };

    // Sidebar styles
    const sidebarStyle = {
        position: 'fixed',
        top: '60px',
        left: isVisible ? '0' : '-320px',
        width: '320px',
        height: 'calc(100vh - 60px)',
        ...PremiumStyles.glass.medium,
        borderRight: `1px solid ${PremiumStyles.colors.border}`,
        overflow: 'auto',
        padding: '1.5rem',
        zIndex: 1002,
        transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isVisible ? '0 10px 25px rgba(0, 0, 0, 0.3)' : 'none'
    };

    return (
        <>
            {/* Trigger Zone */}
            <div 
                style={triggerZone}
                onMouseEnter={() => setIsVisible(true)}
                onClick={() => setIsVisible(true)}
                title="Click to show Progress Overview"
            />
            
            {/* Overlay */}
            <div 
                style={overlay}
                onClick={() => setIsVisible(false)}
            />
            
            {/* Sidebar */}
            <div 
                style={sidebarStyle}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => {
                    // Start hide timer when mouse leaves
                    setTimeout(() => setIsVisible(false), 1000);
                }}
            >
                {/* Close button */}
                <div 
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        transition: 'background-color 0.2s ease'
                    }}
                    onClick={() => setIsVisible(false)}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                >
                    <ChevronLeft size={20} color={PremiumStyles.colors.textSecondary} />
                </div>

                <div style={{ marginBottom: '2rem', marginTop: '2rem' }}>
                    <h2 style={{ ...premiumStyles.headingMD, marginBottom: '1rem' }}>
                        Progress Overview
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {/* Total Experience Card */}
                        <div style={premiumStyles.statsCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                <Sparkles size={24} color={PremiumStyles.colors.accent} />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: PremiumStyles.colors.text, marginBottom: '0.25rem' }}>
                                {(userProgress?.total_xp || userProfile.xp || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: PremiumStyles.colors.textSecondary }}>
                                Total Experience
                            </div>
                        </div>

                        {/* Problems Solved Card */}
                        <div style={premiumStyles.statsCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                <Trophy size={24} color={PremiumStyles.colors.accentOrange} />
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: PremiumStyles.colors.text, marginBottom: '0.25rem' }}>
                                {userProgress?.problems_solved || userProfile.uniqueChallengesCompleted || 0}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: PremiumStyles.colors.textSecondary }}>
                                Problems Solved
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;