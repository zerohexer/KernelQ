import React, { useState } from 'react';
import { CheckCircle, Circle, Star, Zap, Filter, X, ChevronRight } from 'lucide-react';
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
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get difficulty color gradient
  const getDifficultyGradient = (difficulty) => {
    if (difficulty <= 3) return PremiumStyles.gradients.easy;
    if (difficulty <= 6) return PremiumStyles.gradients.medium;
    if (difficulty <= 8) return PremiumStyles.gradients.hard;
    return PremiumStyles.gradients.expert;
  };

  // Get difficulty label
  const getDifficultyLabel = (difficulty) => {
    if (difficulty <= 3) return 'Beginner';
    if (difficulty <= 6) return 'Intermediate';
    if (difficulty <= 8) return 'Advanced';
    return 'Expert';
  };

  // Get accent color based on difficulty
  const getAccentColor = (difficulty) => {
    if (difficulty <= 3) return PremiumStyles.colors.accent;
    if (difficulty <= 6) return PremiumStyles.colors.accentYellow;
    if (difficulty <= 8) return PremiumStyles.colors.accentOrange;
    return PremiumStyles.colors.accentRed;
  };

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

      {/* Problems Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
        marginRight: '-8px'
      }}>
        {problems.length > 0 ? (
          <div style={{
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))'
          }}>
            {problems.map((problem, index) => {
              const isCompleted = completedChallenges.has(problem.id);
              const isHovered = hoveredCard === problem.id;
              const accentColor = getAccentColor(problem.difficulty);

              return (
                <div
                  key={problem.id}
                  onClick={() => onSelectProblem(problem)}
                  onMouseEnter={() => setHoveredCard(problem.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    position: 'relative',
                    padding: '24px',
                    background: isHovered
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '20px',
                    border: `1px solid ${isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
                    boxShadow: isHovered
                      ? `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 60px ${accentColor}15`
                      : '0 4px 20px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                    animation: `fadeInUp 0.4s ease ${index * 0.05}s both`
                  }}
                >
                  {/* Top accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: isCompleted
                      ? PremiumStyles.gradients.green
                      : getDifficultyGradient(problem.difficulty),
                    opacity: isHovered ? 1 : 0.7,
                    transition: 'opacity 0.3s ease'
                  }} />

                  {/* Card shine effect on hover */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%)',
                      pointerEvents: 'none'
                    }} />
                  )}

                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: PremiumStyles.colors.textTertiary,
                        marginBottom: '4px',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase'
                      }}>
                        Challenge #{problem.id}
                      </div>
                      <h3 style={{
                        fontSize: '1.0625rem',
                        fontWeight: 600,
                        color: PremiumStyles.colors.text,
                        margin: 0,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.3
                      }}>
                        {problem.title}
                      </h3>
                    </div>

                    {/* Completion Status */}
                    <div style={{
                      flexShrink: 0,
                      marginLeft: '12px'
                    }}>
                      {isCompleted ? (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(50, 215, 75, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 12px rgba(50, 215, 75, 0.3)'
                        }}>
                          <CheckCircle size={18} color={PremiumStyles.colors.accent} />
                        </div>
                      ) : (
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Circle size={18} color={PremiumStyles.colors.textTertiary} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: '0.8125rem',
                    color: PremiumStyles.colors.textSecondary,
                    lineHeight: 1.5,
                    margin: 0,
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {problem.description}
                  </p>

                  {/* Footer Badges */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Difficulty Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      background: getDifficultyGradient(problem.difficulty),
                      borderRadius: '8px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: '#000',
                      letterSpacing: '0.02em'
                    }}>
                      <Star size={11} fill="currentColor" />
                      Lv.{problem.difficulty}
                    </span>

                    {/* XP Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '5px 10px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: '8px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: PremiumStyles.colors.text,
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                      <Zap size={11} fill="currentColor" color={PremiumStyles.colors.accentYellow} />
                      {problem.xp} XP
                    </span>

                    {/* Phase Badge */}
                    <span style={{
                      padding: '5px 10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px',
                      fontSize: '0.6875rem',
                      fontWeight: 500,
                      color: PremiumStyles.colors.textSecondary,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      {problem.phase}
                    </span>

                    {/* Arrow indicator on hover */}
                    <div style={{
                      marginLeft: 'auto',
                      opacity: isHovered ? 1 : 0,
                      transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
                      transition: 'all 0.25s ease'
                    }}>
                      <ChevronRight size={18} color={PremiumStyles.colors.textSecondary} />
                    </div>
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
