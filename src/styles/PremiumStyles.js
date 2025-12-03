// Premium Apple-inspired Design System
const PremiumStyles = {
  // Core Design System
  colors: {
    primary: 'rgba(255, 255, 255, 0.15)',
    primaryDark: 'rgba(255, 255, 255, 0.1)',
    background: '#000000',
    backgroundSecondary: '#1d1d1f',
    backgroundTertiary: '#2d2d2f',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.08)',
    text: '#f5f5f7',
    textSecondary: 'rgba(245, 245, 247, 0.7)',
    textTertiary: 'rgba(245, 245, 247, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(255, 255, 255, 0.2)',
    accent: '#30d158',
    accentOrange: '#ff9f0a',
    accentRed: '#ff453a',
    accentPurple: '#bf5af2',
    success: '#30d158',
    warning: '#ff9f0a',
    error: '#ff453a'
  },

  // Typography System
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSmoothing: '-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;',
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    sizes: {
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
      sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
      base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
      lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
      xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
      '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
      '3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
      '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
      '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)'
    }
  },

  // Spacing System
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    base: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
    '5xl': '8rem'
  },

  // Glassmorphism Effects
  glass: {
    light: {
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.15)'
    },
    heavy: {
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }
  },

  // Shadow System
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(0, 122, 255, 0.3)',
    glowHover: '0 0 30px rgba(0, 122, 255, 0.5)'
  },

  // Scrollbar System
  scrollbar: {
    // WebKit scrollbar styles
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px'
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '4px',
      border: 'none'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: 'rgba(255, 255, 255, 0.3)'
    },
    '&::-webkit-scrollbar-corner': {
      background: 'transparent'
    },
    // Firefox scrollbar
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
  },

  // Animation System
  animations: {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transitionFast: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSlow: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    hover: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
};

// Premium Component Styles
const premiumStyles = {
  // Main Container
  container: {
    minHeight: '100%',
    height: '100%',
    background: `linear-gradient(135deg, ${PremiumStyles.colors.background} 0%, ${PremiumStyles.colors.backgroundSecondary} 100%)`,
    color: PremiumStyles.colors.text,
    fontFamily: PremiumStyles.typography.fontFamily,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flex: 1
  },

  // Navigation Bar
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    ...PremiumStyles.glass.medium,
    borderBottom: `1px solid ${PremiumStyles.colors.border}`,
    transition: PremiumStyles.animations.transition
  },

  // Main Content Area
  mainContent: {
    paddingTop: '60px',
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0
  },

  // Sidebar
  sidebar: {
    width: '320px',
    height: '100%',
    ...PremiumStyles.glass.light,
    borderRight: `1px solid ${PremiumStyles.colors.border}`,
    overflow: 'auto',
    padding: '1.5rem',
    transition: PremiumStyles.animations.transition
  },

  // Content Area
  contentArea: {
    flex: 1,
    overflow: 'auto',
    padding: '2rem',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
  },

  // Glass Card
  glassCard: {
    ...PremiumStyles.glass.light,
    borderRadius: '16px',
    padding: '1.5rem',
    transition: PremiumStyles.animations.transition,
    boxShadow: PremiumStyles.shadows.md,
    position: 'relative',
    overflow: 'hidden'
  },

  // Glass Card Hover
  glassCardHover: {
    ...PremiumStyles.glass.medium,
    transform: 'translateY(-2px)',
    boxShadow: `${PremiumStyles.shadows.lg}, ${PremiumStyles.shadows.glow}`,
    borderColor: PremiumStyles.colors.borderHover
  },

  // Button Primary
  buttonPrimary: {
    background: `linear-gradient(135deg, ${PremiumStyles.colors.primary} 0%, ${PremiumStyles.colors.primaryDark} 100%)`,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    fontSize: PremiumStyles.typography.sizes.base,
    fontWeight: PremiumStyles.typography.weights.semibold,
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    boxShadow: PremiumStyles.shadows.md,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none'
  },

  // Button Secondary
  buttonSecondary: {
    ...PremiumStyles.glass.light,
    color: PremiumStyles.colors.text,
    border: `1px solid ${PremiumStyles.colors.border}`,
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    fontSize: PremiumStyles.typography.sizes.base,
    fontWeight: PremiumStyles.typography.weights.medium,
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none'
  },

  // Dropdown Select
  dropdown: {
    background: PremiumStyles.colors.backgroundSecondary,
    border: `1px solid ${PremiumStyles.colors.border}`,
    borderRadius: '12px',
    color: PremiumStyles.colors.text,
    padding: '0.75rem 1rem',
    fontSize: PremiumStyles.typography.sizes.sm,
    fontFamily: PremiumStyles.typography.fontFamily,
    outline: 'none',
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,<svg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M1 1L6 6L11 1' stroke='%23f5f5f7' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 1rem center',
    paddingRight: '3rem'
  },

  // Tab Navigation
  tabNav: {
    display: 'flex',
    ...PremiumStyles.glass.light,
    borderRadius: '16px',
    padding: '0.5rem',
    marginBottom: '1.5rem',
    gap: '0.25rem'
  },

  // Tab Item
  tabItem: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    fontSize: PremiumStyles.typography.sizes.sm,
    fontWeight: PremiumStyles.typography.weights.medium,
    color: PremiumStyles.colors.textSecondary
  },

  // Tab Item Active
  tabItemActive: {
    background: `linear-gradient(135deg, ${PremiumStyles.colors.primary} 0%, ${PremiumStyles.colors.primaryDark} 100%)`,
    color: 'white',
    boxShadow: PremiumStyles.shadows.md
  },

  // Typography
  headingXL: {
    fontSize: PremiumStyles.typography.sizes['3xl'],
    fontWeight: PremiumStyles.typography.weights.bold,
    color: PremiumStyles.colors.text,
    marginBottom: '0.5rem',
    letterSpacing: '-0.025em'
  },

  headingLG: {
    fontSize: PremiumStyles.typography.sizes['2xl'],
    fontWeight: PremiumStyles.typography.weights.semibold,
    color: PremiumStyles.colors.text,
    marginBottom: '1rem',
    letterSpacing: '-0.02em'
  },

  headingMD: {
    fontSize: PremiumStyles.typography.sizes.xl,
    fontWeight: PremiumStyles.typography.weights.semibold,
    color: PremiumStyles.colors.text,
    marginBottom: '0.75rem',
    letterSpacing: '-0.015em'
  },

  textBase: {
    fontSize: PremiumStyles.typography.sizes.base,
    color: PremiumStyles.colors.text,
    lineHeight: '1.6'
  },

  textSecondary: {
    fontSize: PremiumStyles.typography.sizes.sm,
    color: PremiumStyles.colors.textSecondary,
    lineHeight: '1.5'
  },

  // Status indicators
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: PremiumStyles.typography.sizes.xs,
    fontWeight: PremiumStyles.typography.weights.medium,
    ...PremiumStyles.glass.light,
    border: `1px solid ${PremiumStyles.colors.border}`
  },

  // Problem card
  problemCard: {
    ...PremiumStyles.glass.light,
    borderRadius: '16px',
    padding: '1.5rem',
    marginBottom: '1rem',
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    border: `1px solid ${PremiumStyles.colors.border}`,
    position: 'relative',
    overflow: 'hidden'
  },

  // Code editor container
  codeEditorContainer: {
    ...PremiumStyles.glass.medium,
    borderRadius: '16px',
    overflow: 'hidden',
    border: `1px solid ${PremiumStyles.colors.border}`,
    boxShadow: PremiumStyles.shadows.lg
  },

  // Stats card
  statsCard: {
    ...PremiumStyles.glass.light,
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center',
    border: `1px solid ${PremiumStyles.colors.border}`,
    transition: PremiumStyles.animations.transition
  },

  // Progress bar
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: PremiumStyles.colors.backgroundTertiary,
    borderRadius: '4px',
    overflow: 'hidden',
    position: 'relative'
  },

  progressFill: {
    height: '100%',
    background: `linear-gradient(90deg, ${PremiumStyles.colors.primary} 0%, ${PremiumStyles.colors.accent} 100%)`,
    borderRadius: '4px',
    transition: PremiumStyles.animations.transition
  }
};

export { PremiumStyles, premiumStyles };
export default PremiumStyles;
