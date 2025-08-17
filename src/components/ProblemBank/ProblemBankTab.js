import React from 'react';
import { CheckCircle, Clock, Star, Zap, Shuffle } from 'lucide-react';
import { PremiumStyles, premiumStyles } from '../../styles/PremiumStyles';

const ProblemBankTab = ({ 
  problems, 
  filters, 
  onFilterChange, 
  onSelectProblem, 
  completedChallenges, 
  phaseSystem, 
  getProblemStats 
}) => {
  const stats = getProblemStats ? getProblemStats() : { total: problems.length, completed: 0 };
  
  return (
    <div style={premiumStyles.glassCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={premiumStyles.headingLG}>Problem Bank</h2>
        <span style={premiumStyles.textSecondary}>
          {stats.completed}/{stats.total} completed ({problems.length} filtered)
        </span>
      </div>

      {/* Filter Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Phase Filter */}
        <select
          value={filters.phase}
          onChange={(e) => onFilterChange('phase', e.target.value)}
          style={{ ...premiumStyles.dropdown, width: '100%' }}
        >
          <option value="all">All Phases</option>
          {phaseSystem && Object.entries(phaseSystem).map(([key, phase]) => (
            <option key={key} value={key}>{phase.name}</option>
          ))}
        </select>
        
        {/* Difficulty Filter */}
        <select
          value={filters.difficulty}
          onChange={(e) => onFilterChange('difficulty', e.target.value)}
          style={{ ...premiumStyles.dropdown, width: '100%' }}
        >
          <option value="all">All Difficulties</option>
          {[...Array(10).keys()].map(i => (
            <option key={i+1} value={i+1}>Level {i+1}</option>
          ))}
        </select>
        
        {/* Status Filter */}
        <select
          value={filters.completed}
          onChange={(e) => onFilterChange('completed', e.target.value)}
          style={{ ...premiumStyles.dropdown, width: '100%' }}
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="incomplete">Incomplete</option>
        </select>
      </div>

      {/* Problems List */}
      <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {problems.map(problem => {
            const isCompleted = completedChallenges.has(problem.id);
            return (
              <div 
                key={problem.id}
                style={{
                  ...premiumStyles.problemCard,
                  borderLeft: `4px solid ${isCompleted ? PremiumStyles.colors.accent : PremiumStyles.colors.primary}`,
                  cursor: 'pointer',
                  transition: PremiumStyles.animations.transition
                }}
                onClick={() => onSelectProblem(problem)}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, premiumStyles.glassCardHover);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, premiumStyles.glassCard);
                  e.currentTarget.style.borderLeft = `4px solid ${isCompleted ? PremiumStyles.colors.accent : PremiumStyles.colors.primary}`;
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      ...premiumStyles.headingMD, 
                      fontSize: '1.1rem', 
                      margin: '0 0 0.5rem 0' 
                    }}>
                      #{problem.id}: {problem.title}
                    </h4>
                    <p style={{ 
                      ...premiumStyles.textSecondary, 
                      marginBottom: '1rem',
                      lineHeight: '1.5'
                    }}>
                      {problem.description}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{
                        ...premiumStyles.statusBadge,
                        background: problem.difficulty <= 3 ? 
                          `linear-gradient(135deg, ${PremiumStyles.colors.accent} 0%, ${PremiumStyles.colors.accentPurple} 100%)` :
                          problem.difficulty <= 6 ?
                          `linear-gradient(135deg, ${PremiumStyles.colors.accentOrange} 0%, ${PremiumStyles.colors.accentRed} 100%)` :
                          `linear-gradient(135deg, ${PremiumStyles.colors.accentRed} 0%, ${PremiumStyles.colors.accentPurple} 100%)`,
                        color: 'white',
                        border: 'none'
                      }}>
                        <Star size={12} />
                        <span>Level {problem.difficulty}</span>
                      </span>
                      <span style={{
                        ...premiumStyles.statusBadge,
                        background: `linear-gradient(135deg, ${PremiumStyles.colors.primary} 0%, ${PremiumStyles.colors.primaryDark} 100%)`,
                        color: 'white',
                        border: 'none'
                      }}>
                        <Zap size={12} />
                        <span>{problem.xp} XP</span>
                      </span>
                      <span style={{
                        ...premiumStyles.statusBadge,
                        background: PremiumStyles.colors.surface,
                        color: PremiumStyles.colors.text
                      }}>
                        {problem.phase}
                      </span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: '1rem' }}>
                    {isCompleted ? (
                      <CheckCircle size={24} color={PremiumStyles.colors.accent} />
                    ) : (
                      <Clock size={24} color={PremiumStyles.colors.textSecondary} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {problems.length === 0 && (
            <div style={{ 
              ...premiumStyles.glassCard,
              textAlign: 'center', 
              padding: '3rem 2rem',
              background: PremiumStyles.colors.backgroundSecondary
            }}>
              <div style={{ ...premiumStyles.textSecondary, marginBottom: '1rem' }}>
                No problems match your filters
              </div>
              <button
                style={premiumStyles.buttonSecondary}
                onClick={() => onFilterChange('reset', 'all')}
              >
                <Shuffle size={16} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemBankTab;