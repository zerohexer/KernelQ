import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import PremiumStyles from '../../styles/PremiumStyles';

const Sidebar = ({
    userProfile,
    premiumStyles,
    user,
    userProgress
}) => {
    return (
        <div style={premiumStyles.sidebar}>
            <div style={{ marginBottom: '2rem' }}>
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
    );
};

export default Sidebar;