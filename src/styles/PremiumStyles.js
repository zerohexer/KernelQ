// KernelQ Premium Design System - Apple-Inspired Dark Luxury
// A sophisticated, addictive interface with depth and polish

const PremiumStyles = {
  // Core Color Palette - Rich, Deep, Sophisticated
  colors: {
    // Base colors
    background: '#0a0a0c',
    backgroundSecondary: '#121214',
    backgroundTertiary: '#1a1a1e',
    backgroundElevated: '#222226',

    // Surface colors with depth
    surface: 'rgba(255, 255, 255, 0.03)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',
    surfaceActive: 'rgba(255, 255, 255, 0.09)',

    // Text hierarchy
    text: '#f5f5f7',
    textSecondary: 'rgba(245, 245, 247, 0.65)',
    textTertiary: 'rgba(245, 245, 247, 0.45)',
    textMuted: 'rgba(245, 245, 247, 0.3)',

    // Border system
    border: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.15)',
    borderActive: 'rgba(255, 255, 255, 0.25)',

    // Primary gradient stops
    primary: 'rgba(255, 255, 255, 0.12)',
    primaryDark: 'rgba(255, 255, 255, 0.06)',

    // Accent colors - Vibrant but refined
    accent: '#32d74b',           // Apple Green
    accentSecondary: '#30d158',
    accentOrange: '#ff9f0a',
    accentRed: '#ff453a',
    accentPurple: '#bf5af2',
    accentBlue: '#0a84ff',
    accentCyan: '#5ac8fa',
    accentPink: '#ff375f',
    accentYellow: '#ffd60a',

    // Semantic colors
    success: '#32d74b',
    warning: '#ff9f0a',
    error: '#ff453a',
    info: '#0a84ff',

    // Gradient mesh colors for backgrounds
    meshPurple: 'rgba(191, 90, 242, 0.15)',
    meshBlue: 'rgba(10, 132, 255, 0.12)',
    meshGreen: 'rgba(50, 215, 75, 0.1)',
    meshOrange: 'rgba(255, 159, 10, 0.08)'
  },

  // Typography System - Premium and Refined
  typography: {
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontFamilyMono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace',

    weights: {
      thin: 100,
      ultralight: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      heavy: 800,
      black: 900
    },

    sizes: {
      '2xs': '0.625rem',    // 10px
      xs: '0.75rem',        // 12px
      sm: '0.875rem',       // 14px
      base: '1rem',         // 16px
      lg: '1.125rem',       // 18px
      xl: '1.25rem',        // 20px
      '2xl': '1.5rem',      // 24px
      '3xl': '1.875rem',    // 30px
      '4xl': '2.25rem',     // 36px
      '5xl': '3rem',        // 48px
      '6xl': '3.75rem',     // 60px
      '7xl': '4.5rem',      // 72px
      display: 'clamp(2.5rem, 5vw, 5rem)'
    },

    lineHeights: {
      none: 1,
      tight: 1.15,
      snug: 1.25,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },

    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em'
    }
  },

  // Spacing System - Generous and Balanced
  spacing: {
    '0': '0',
    px: '1px',
    '0.5': '0.125rem',    // 2px
    '1': '0.25rem',       // 4px
    '1.5': '0.375rem',    // 6px
    '2': '0.5rem',        // 8px
    '2.5': '0.625rem',    // 10px
    '3': '0.75rem',       // 12px
    '3.5': '0.875rem',    // 14px
    '4': '1rem',          // 16px
    '5': '1.25rem',       // 20px
    '6': '1.5rem',        // 24px
    '7': '1.75rem',       // 28px
    '8': '2rem',          // 32px
    '9': '2.25rem',       // 36px
    '10': '2.5rem',       // 40px
    '12': '3rem',         // 48px
    '14': '3.5rem',       // 56px
    '16': '4rem',         // 64px
    '20': '5rem',         // 80px
    '24': '6rem',         // 96px
    '32': '8rem',         // 128px
  },

  // Border Radius - Smooth and Organic
  radius: {
    none: '0',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px'
  },

  // Solid backgrounds - no blur effects
  glass: {
    ultraLight: {
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.04)'
    },
    light: {
      background: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.06)'
    },
    medium: {
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    },
    heavy: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.12)'
    },
    solid: {
      background: '#121214',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }
  },

  // Shadow System - Depth and Elevation
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.4)',
    base: '0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 8px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.35), 0 4px 8px rgba(0, 0, 0, 0.2)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.4), 0 8px 16px rgba(0, 0, 0, 0.25)',
    '2xl': '0 24px 48px rgba(0, 0, 0, 0.45), 0 12px 24px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.25)',

    // Glow effects for interactive elements
    glow: {
      green: '0 0 20px rgba(50, 215, 75, 0.3), 0 0 40px rgba(50, 215, 75, 0.15)',
      blue: '0 0 20px rgba(10, 132, 255, 0.3), 0 0 40px rgba(10, 132, 255, 0.15)',
      purple: '0 0 20px rgba(191, 90, 242, 0.3), 0 0 40px rgba(191, 90, 242, 0.15)',
      orange: '0 0 20px rgba(255, 159, 10, 0.3), 0 0 40px rgba(255, 159, 10, 0.15)',
      white: '0 0 20px rgba(255, 255, 255, 0.2), 0 0 40px rgba(255, 255, 255, 0.1)'
    },

    // Card shadows with subtle glow
    card: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    cardHover: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 60px rgba(50, 215, 75, 0.05)'
  },

  // Animation System - Smooth and Delightful
  animations: {
    // Timing functions
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',

    // Duration presets
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
      slower: '600ms',
      slowest: '1000ms'
    },

    // Composite transitions
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    transitionFast: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
    transitionSlow: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    transitionColors: 'color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease',
    transitionTransform: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transitionOpacity: 'opacity 0.2s ease'
  },

  // Gradients
  gradients: {
    // Solid dark background
    meshDark: '#0a0a0c',

    // Card gradient overlays (subtle)
    cardShine: 'none',
    cardShineHover: 'none',

    // Accent gradients
    green: 'linear-gradient(135deg, #32d74b 0%, #30d158 100%)',
    blue: 'linear-gradient(135deg, #0a84ff 0%, #5ac8fa 100%)',
    purple: 'linear-gradient(135deg, #bf5af2 0%, #ff375f 100%)',
    orange: 'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)',
    rainbow: 'linear-gradient(135deg, #ff453a 0%, #ff9f0a 25%, #32d74b 50%, #0a84ff 75%, #bf5af2 100%)',

    // Level difficulty gradients
    easy: 'linear-gradient(135deg, #32d74b 0%, #5ac8fa 100%)',
    medium: 'linear-gradient(135deg, #ffd60a 0%, #ff9f0a 100%)',
    hard: 'linear-gradient(135deg, #ff9f0a 0%, #ff453a 100%)',
    expert: 'linear-gradient(135deg, #ff453a 0%, #bf5af2 100%)'
  }
};

// Premium Component Styles - Refined and Polished
const premiumStyles = {
  // Main Container with mesh gradient background
  container: {
    minHeight: '100%',
    height: '100%',
    background: PremiumStyles.gradients.meshDark,
    color: PremiumStyles.colors.text,
    fontFamily: PremiumStyles.typography.fontFamily,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    position: 'relative'
  },

  // Navigation Bar - Floating with depth
  navbar: {
    position: 'fixed',
    top: '12px',
    left: '30px',
    right: '40px',
    zIndex: 1000,
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0 0 24px',
    ...PremiumStyles.glass.solid,
    borderRadius: PremiumStyles.radius['2xl'],
    boxShadow: `${PremiumStyles.shadows.xl}, inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
    transition: PremiumStyles.animations.transition
  },

  // Main Content Area
  mainContent: {
    paddingTop: '80px',
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minHeight: 0
  },

  // Sidebar - Premium glass effect
  sidebar: {
    width: '320px',
    height: '100%',
    ...PremiumStyles.glass.medium,
    borderRight: `1px solid ${PremiumStyles.colors.border}`,
    overflow: 'auto',
    padding: '24px',
    transition: PremiumStyles.animations.transition
  },

  // Content Area
  contentArea: {
    flex: 1,
    overflow: 'auto',
    scrollbarGutter: 'stable',
    padding: '24px 32px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0
  },

  // Glass Card - Elevated with depth
  glassCard: {
    ...PremiumStyles.glass.light,
    borderRadius: PremiumStyles.radius['2xl'],
    padding: '24px',
    transition: PremiumStyles.animations.transition,
    boxShadow: PremiumStyles.shadows.card,
    position: 'relative',
    overflow: 'hidden',
    // Subtle top highlight
    backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 40%)'
  },

  // Glass Card Hover - Enhanced interactivity
  glassCardHover: {
    ...PremiumStyles.glass.medium,
    transform: 'translateY(-4px) scale(1.005)',
    boxShadow: PremiumStyles.shadows.cardHover,
    borderColor: PremiumStyles.colors.borderActive,
    backgroundImage: PremiumStyles.gradients.cardShineHover
  },

  // Primary Button - Sleek and tactile
  buttonPrimary: {
    background: PremiumStyles.gradients.green,
    color: '#000000',
    border: 'none',
    borderRadius: PremiumStyles.radius.xl,
    padding: '12px 24px',
    fontSize: PremiumStyles.typography.sizes.sm,
    fontWeight: PremiumStyles.typography.weights.semibold,
    fontFamily: PremiumStyles.typography.fontFamily,
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    boxShadow: `${PremiumStyles.shadows.md}, ${PremiumStyles.shadows.glow.green}`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none',
    letterSpacing: PremiumStyles.typography.letterSpacing.wide,
    position: 'relative',
    overflow: 'hidden'
  },

  // Secondary Button - Subtle glass effect
  buttonSecondary: {
    ...PremiumStyles.glass.light,
    color: PremiumStyles.colors.text,
    border: `1px solid ${PremiumStyles.colors.border}`,
    borderRadius: PremiumStyles.radius.xl,
    padding: '12px 24px',
    fontSize: PremiumStyles.typography.sizes.sm,
    fontWeight: PremiumStyles.typography.weights.medium,
    fontFamily: PremiumStyles.typography.fontFamily,
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textDecoration: 'none'
  },

  // Dropdown Select - Premium styling
  dropdown: {
    background: PremiumStyles.colors.backgroundTertiary,
    border: `1px solid ${PremiumStyles.colors.border}`,
    borderRadius: PremiumStyles.radius.lg,
    color: PremiumStyles.colors.text,
    padding: '12px 16px',
    fontSize: PremiumStyles.typography.sizes.sm,
    fontFamily: PremiumStyles.typography.fontFamily,
    outline: 'none',
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
    paddingRight: '48px'
  },

  // Tab Navigation - Pill style
  tabNav: {
    display: 'flex',
    ...PremiumStyles.glass.light,
    borderRadius: PremiumStyles.radius['2xl'],
    padding: '6px',
    marginBottom: '24px',
    gap: '4px'
  },

  // Tab Item
  tabItem: {
    flex: 1,
    padding: '12px 20px',
    borderRadius: PremiumStyles.radius.xl,
    textAlign: 'center',
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    fontSize: PremiumStyles.typography.sizes.sm,
    fontWeight: PremiumStyles.typography.weights.medium,
    color: PremiumStyles.colors.textSecondary,
    border: 'none',
    background: 'transparent',
    fontFamily: PremiumStyles.typography.fontFamily
  },

  // Tab Item Active
  tabItemActive: {
    background: PremiumStyles.colors.backgroundElevated,
    color: PremiumStyles.colors.text,
    boxShadow: PremiumStyles.shadows.md
  },

  // Typography Headings
  headingXL: {
    fontSize: PremiumStyles.typography.sizes['4xl'],
    fontWeight: PremiumStyles.typography.weights.bold,
    color: PremiumStyles.colors.text,
    marginBottom: '8px',
    letterSpacing: PremiumStyles.typography.letterSpacing.tight,
    lineHeight: PremiumStyles.typography.lineHeights.tight
  },

  headingLG: {
    fontSize: PremiumStyles.typography.sizes['2xl'],
    fontWeight: PremiumStyles.typography.weights.semibold,
    color: PremiumStyles.colors.text,
    marginBottom: '16px',
    letterSpacing: PremiumStyles.typography.letterSpacing.tight,
    lineHeight: PremiumStyles.typography.lineHeights.snug
  },

  headingMD: {
    fontSize: PremiumStyles.typography.sizes.xl,
    fontWeight: PremiumStyles.typography.weights.semibold,
    color: PremiumStyles.colors.text,
    marginBottom: '12px',
    letterSpacing: PremiumStyles.typography.letterSpacing.tight,
    lineHeight: PremiumStyles.typography.lineHeights.snug
  },

  headingSM: {
    fontSize: PremiumStyles.typography.sizes.lg,
    fontWeight: PremiumStyles.typography.weights.semibold,
    color: PremiumStyles.colors.text,
    marginBottom: '8px',
    letterSpacing: PremiumStyles.typography.letterSpacing.normal,
    lineHeight: PremiumStyles.typography.lineHeights.snug
  },

  // Text styles
  textBase: {
    fontSize: PremiumStyles.typography.sizes.base,
    color: PremiumStyles.colors.text,
    lineHeight: PremiumStyles.typography.lineHeights.relaxed,
    fontFamily: PremiumStyles.typography.fontFamily
  },

  textSecondary: {
    fontSize: PremiumStyles.typography.sizes.sm,
    color: PremiumStyles.colors.textSecondary,
    lineHeight: PremiumStyles.typography.lineHeights.normal,
    fontFamily: PremiumStyles.typography.fontFamily
  },

  textMuted: {
    fontSize: PremiumStyles.typography.sizes.xs,
    color: PremiumStyles.colors.textTertiary,
    lineHeight: PremiumStyles.typography.lineHeights.normal,
    fontFamily: PremiumStyles.typography.fontFamily
  },

  // Status Badge - Refined pill
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: PremiumStyles.radius.full,
    fontSize: PremiumStyles.typography.sizes.xs,
    fontWeight: PremiumStyles.typography.weights.semibold,
    letterSpacing: PremiumStyles.typography.letterSpacing.wide,
    ...PremiumStyles.glass.ultraLight,
    border: `1px solid ${PremiumStyles.colors.border}`
  },

  // Problem Card - Elevated with hover effect
  problemCard: {
    ...PremiumStyles.glass.light,
    borderRadius: PremiumStyles.radius['2xl'],
    padding: '20px 24px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: PremiumStyles.animations.transition,
    border: `1px solid ${PremiumStyles.colors.border}`,
    position: 'relative',
    overflow: 'hidden',
    backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%)'
  },

  // Code Editor Container
  codeEditorContainer: {
    ...PremiumStyles.glass.medium,
    borderRadius: PremiumStyles.radius['2xl'],
    overflow: 'hidden',
    border: `1px solid ${PremiumStyles.colors.border}`,
    boxShadow: PremiumStyles.shadows.xl
  },

  // Stats Card - Elevated glass
  statsCard: {
    ...PremiumStyles.glass.light,
    borderRadius: PremiumStyles.radius['2xl'],
    padding: '24px',
    textAlign: 'center',
    border: `1px solid ${PremiumStyles.colors.border}`,
    transition: PremiumStyles.animations.transition,
    backgroundImage: 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%)'
  },

  // Progress Bar - Smooth gradient
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: PremiumStyles.colors.backgroundTertiary,
    borderRadius: PremiumStyles.radius.full,
    overflow: 'hidden',
    position: 'relative'
  },

  progressFill: {
    height: '100%',
    background: PremiumStyles.gradients.green,
    borderRadius: PremiumStyles.radius.full,
    transition: `width 0.6s ${PremiumStyles.animations.easeOut}`,
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
  },

  // Input Field - Clean and minimal
  input: {
    background: PremiumStyles.colors.backgroundTertiary,
    border: `1px solid ${PremiumStyles.colors.border}`,
    borderRadius: PremiumStyles.radius.lg,
    color: PremiumStyles.colors.text,
    padding: '14px 18px',
    fontSize: PremiumStyles.typography.sizes.base,
    fontFamily: PremiumStyles.typography.fontFamily,
    outline: 'none',
    transition: PremiumStyles.animations.transition,
    width: '100%'
  },

  // Divider
  divider: {
    width: '100%',
    height: '1px',
    background: PremiumStyles.colors.border,
    margin: '24px 0'
  },

  // Floating Action Button
  fab: {
    position: 'fixed',
    bottom: '32px',
    right: '32px',
    width: '56px',
    height: '56px',
    borderRadius: PremiumStyles.radius.full,
    background: PremiumStyles.gradients.green,
    border: 'none',
    color: '#000000',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `${PremiumStyles.shadows.xl}, ${PremiumStyles.shadows.glow.green}`,
    transition: PremiumStyles.animations.transition,
    zIndex: 100
  },

  // Tooltip
  tooltip: {
    ...PremiumStyles.glass.solid,
    borderRadius: PremiumStyles.radius.lg,
    padding: '8px 12px',
    fontSize: PremiumStyles.typography.sizes.xs,
    fontWeight: PremiumStyles.typography.weights.medium,
    color: PremiumStyles.colors.text,
    boxShadow: PremiumStyles.shadows.lg,
    pointerEvents: 'none',
    whiteSpace: 'nowrap'
  }
};

export { PremiumStyles, premiumStyles };
export default PremiumStyles;
