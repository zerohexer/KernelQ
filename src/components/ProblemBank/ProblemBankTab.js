import React, { useState } from 'react';
import { CheckCircle, Circle, Zap, Filter, X } from 'lucide-react';
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
  const [hoveredRow, setHoveredRow] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = [
    filters.phase !== 'all',
    filters.difficulty !== 'all',
    filters.completed !== 'all'
  ].filter(Boolean).length;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      borderRadius: '24px',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      gap: '24px'
    }}>
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: 0,
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            color: '#f5f5f7'
          }}>
            Problem Bank
          </h1>
          <p style={{
            ...premiumStyles.textSecondary,
            margin: 0,
            fontSize: '0.9375rem'
          }}>
            Master kernel development through hands-on challenges
          </p>
        </div>

        {/* Stats Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Progress Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: PremiumStyles.colors.text
            }}>
              {stats.completed}/{stats.total}
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: PremiumStyles.colors.textSecondary
            }}>
              completed
            </span>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: showFilters ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: PremiumStyles.colors.text,
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            <Filter size={16} />
            Filters
            {activeFiltersCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: PremiumStyles.gradients.green,
                color: '#000',
                fontSize: '0.625rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          flexWrap: 'wrap',
          alignItems: 'center',
          animation: 'fadeInDown 0.2s ease'
        }}>
          {/* Phase Filter */}
          <select
            value={filters.phase}
            onChange={(e) => onFilterChange('phase', e.target.value)}
            style={{
              ...premiumStyles.dropdown,
              minWidth: '180px'
            }}
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
            style={{
              ...premiumStyles.dropdown,
              minWidth: '180px'
            }}
          >
            <option value="all">All Difficulties</option>
            <option value="1">Level 1-3 (Beginner)</option>
            <option value="4">Level 4-6 (Intermediate)</option>
            <option value="7">Level 7-8 (Advanced)</option>
            <option value="9">Level 9-10 (Expert)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.completed}
            onChange={(e) => onFilterChange('completed', e.target.value)}
            style={{
              ...premiumStyles.dropdown,
              minWidth: '160px'
            }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="incomplete">Not Completed</option>
          </select>

          {/* Reset Button */}
          {activeFiltersCount > 0 && (
            <button
              onClick={() => onFilterChange('reset', 'all')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                background: 'rgba(255, 69, 58, 0.1)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 69, 58, 0.2)',
                color: PremiumStyles.colors.error,
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Problems Table */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
        marginRight: '-8px'
      }}>
        {problems.length > 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {problems.map((problem, index) => {
              const isCompleted = completedChallenges.has(problem.id);
              const isHovered = hoveredRow === problem.id;

              // Get difficulty text and color like LeetCode
              const getDifficultyText = (diff) => {
                if (diff <= 3) return { text: 'Easy', color: PremiumStyles.colors.accent };
                if (diff <= 6) return { text: 'Med.', color: PremiumStyles.colors.accentYellow };
                if (diff <= 8) return { text: 'Hard', color: PremiumStyles.colors.accentOrange };
                return { text: 'Expert', color: PremiumStyles.colors.accentRed };
              };
              const diffInfo = getDifficultyText(problem.difficulty);

              return (
                <div
                  key={problem.id}
                  onClick={() => onSelectProblem(problem)}
                  onMouseEnter={() => setHoveredRow(problem.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 20px',
                    background: isHovered
                      ? 'rgba(255, 255, 255, 0.06)'
                      : index % 2 === 0
                        ? 'rgba(255, 255, 255, 0.02)'
                        : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    gap: '16px'
                  }}
                >
                  {/* Status Icon */}
                  <div style={{ flexShrink: 0, width: '24px' }}>
                    {isCompleted ? (
                      <CheckCircle size={18} color={PremiumStyles.colors.accent} />
                    ) : (
                      <Circle size={18} color={PremiumStyles.colors.textTertiary} style={{ opacity: 0.4 }} />
                    )}
                  </div>

                  {/* Problem Number & Title */}
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      fontSize: '0.875rem',
                      color: PremiumStyles.colors.textSecondary,
                      flexShrink: 0
                    }}>
                      {problem.id}.
                    </span>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: PremiumStyles.colors.text,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {problem.title}
                    </span>
                  </div>

                  {/* XP */}
                  <div style={{
                    flexShrink: 0,
                    fontSize: '0.75rem',
                    color: PremiumStyles.colors.textTertiary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Zap size={12} color={PremiumStyles.colors.accentYellow} />
                    {problem.xp}
                  </div>

                  {/* Difficulty */}
                  <div style={{
                    flexShrink: 0,
                    width: '50px',
                    textAlign: 'right'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: diffInfo.color
                    }}>
                      {diffInfo.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 32px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px'
            }}>
              <Filter size={32} color={PremiumStyles.colors.textTertiary} />
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: PremiumStyles.colors.text,
              margin: 0,
              marginBottom: '8px'
            }}>
              No problems found
            </h3>
            <p style={{
              fontSize: '0.9375rem',
              color: PremiumStyles.colors.textSecondary,
              margin: 0,
              marginBottom: '24px',
              maxWidth: '360px'
            }}>
              Try adjusting your filters to discover more challenges
            </p>
            <button
              onClick={() => onFilterChange('reset', 'all')}
              style={{
                ...premiumStyles.buttonSecondary,
                padding: '12px 24px'
              }}
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemBankTab;
