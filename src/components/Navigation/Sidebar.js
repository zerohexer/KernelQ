import React from 'react';
import { Sparkles } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

const Sidebar = ({
    userProfile,
    premiumStyles
}) => {
    return (
        <div style={premiumStyles.sidebar}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ ...premiumStyles.headingMD, marginBottom: '1rem' }}>
                    Progress Overview
                </h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={premiumStyles.statsCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                            <Sparkles size={24} color={PremiumStyles.colors.accent} />
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: PremiumStyles.colors.text, marginBottom: '0.25rem' }}>
                            {userProfile.xp.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: PremiumStyles.colors.textSecondary }}>
                            Total Experience
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;