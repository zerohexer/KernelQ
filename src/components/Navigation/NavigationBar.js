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
                    <Shield size={24} style={{ color: '#f5f5f7' }} />
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