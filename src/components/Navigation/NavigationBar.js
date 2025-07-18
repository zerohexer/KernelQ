import React from 'react';
import { Shield } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

const NavigationBar = ({
    getCurrentPhase,
    phaseSystem,
    premiumStyles
}) => {
    return (
        <nav style={premiumStyles.navbar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '52px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${PremiumStyles.colors.primary} 0%, ${PremiumStyles.colors.primaryDark} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: PremiumStyles.shadows.md
                }}>
                    <svg width="32" height="28" viewBox="0 0 120 100" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
                        {/* Apple Premium Color Palette */}
                        <defs>
                            <linearGradient id="apple-silver" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 0.95 }} />
                                <stop offset="100%" style={{ stopColor: '#d1d1d6', stopOpacity: 0.9 }} />
                            </linearGradient>
                            <linearGradient id="apple-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#f5f5f7', stopOpacity: 0.9 }} />
                                <stop offset="100%" style={{ stopColor: '#e5e5ea', stopOpacity: 0.8 }} />
                            </linearGradient>
                        </defs>

                        {/* Original K Letter Design - Apple Silver */}
                        <path d="M15 15 L15 85 L28 85 L28 55 L50 85 L63 85 L40 55 L63 15 L50 15 L32 45 L28 35 L28 15 Z"
                              fill="url(#apple-silver)"
                              stroke="none"/>

                        {/* Original Cube Design - Apple Accent */}
                        <g transform="translate(50, 15) scale(0.65)">
                            {/* Top face */}
                            <path d="M20 20 L60 0 L100 20 L60 40 Z"
                                  fill="url(#apple-accent)"
                                  stroke="rgba(255,255,255,0.3)"
                                  strokeWidth="0.5"/>

                            {/* Left face */}
                            <path d="M20 20 L60 40 L60 100 L20 80 Z"
                                  fill="rgba(245,245,247,0.7)"
                                  stroke="rgba(255,255,255,0.2)"
                                  strokeWidth="0.5"/>

                            {/* Right face */}
                            <path d="M60 40 L100 20 L100 80 L60 100 Z"
                                  fill="rgba(229,229,234,0.8)"
                                  stroke="rgba(255,255,255,0.2)"
                                  strokeWidth="0.5"/>

                            {/* Original grid pattern */}
                            <g stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" opacity="0.7">
                                {/* Top face grid */}
                                <path d="M30 15 L70 35 M40 10 L80 30 M50 5 L90 25"/>
                                <path d="M35 25 L75 5 M45 30 L85 10 M55 35 L95 15"/>
                                {/* Left face grid */}
                                <path d="M20 35 L60 55 M20 50 L60 70 M20 65 L60 85"/>
                                <path d="M35 30 L35 90 M50 35 L50 95"/>
                                {/* Right face grid */}
                                <path d="M75 30 L75 90 M90 25 L90 85"/>
                                <path d="M60 55 L100 35 M60 70 L100 50 M60 85 L100 65"/>
                            </g>

                            {/* Central glow - Apple style */}
                            <circle cx="60" cy="60" r="4"
                                    fill="rgba(255,255,255,0.6)"
                                    style={{ filter: 'blur(2px)' }}/>
                            <circle cx="60" cy="60" r="2"
                                    fill="rgba(255,255,255,0.9)"/>
                        </g>
                    </svg>
                </div>
                <div>
                    <h1 style={{ ...premiumStyles.headingMD, fontSize: '1.2rem', margin: 0 }}>
                        kernelq
                    </h1>
                    <p style={{ ...premiumStyles.textSecondary, margin: 0, fontSize: '0.8rem' }}>
                        Professional Kernel Development Platform
                    </p>
                </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    ...premiumStyles.statusBadge,
                    background: `linear-gradient(135deg, ${PremiumStyles.colors.accent} 0%, ${PremiumStyles.colors.accentPurple} 100%)`,
                    color: 'white',
                    border: 'none'
                }}>
                    <Shield size={14} />
                    <span>{phaseSystem[getCurrentPhase()].name}</span>
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;