/**
 * Koch Logistics Mobile — Brand Design Tokens
 *
 * Derived from the Koch Logistics web app (artifacts/koch-logistics/src/index.css).
 * Dark enterprise theme is the default (matches the web app's root :root block).
 *
 * HSL conversions:
 *   --background: 222 47% 8%     → #0c1525
 *   --foreground: 210 40% 98%    → #f8fafc
 *   --card:       222 47% 11%    → #111d2e
 *   --primary:    217.2 91.2% 59.8% → #4f8ef0
 *   --secondary:  217.2 32.6% 17.5% → #1a2c40
 *   --muted-foreground: 215 20.2% 65.1% → #8fa3b8
 */

const colors = {
  light: {
    // Legacy aliases
    text: '#f8fafc',
    tint: '#4f8ef0',

    // Core surfaces
    background: '#0c1525',
    foreground: '#f8fafc',

    // Cards / elevated surfaces
    card: '#111d2e',
    cardForeground: '#f8fafc',
    cardElevated: '#162035',

    // Primary action color
    primary: '#4f8ef0',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#1a2c40',
    secondaryForeground: '#f8fafc',

    // Muted / subdued elements
    muted: '#1a2c40',
    mutedForeground: '#8fa3b8',

    // Accent highlights
    accent: '#1a2c40',
    accentForeground: '#f8fafc',

    // Destructive actions
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#1e3048',
    input: '#1a2c40',

    // Koch brand-specific
    amber: '#f59e0b',
    amberLight: '#fbbf24',
    amberMuted: 'rgba(245,158,11,0.15)',

    // Status colors
    statusSafe: '#22c55e',
    statusSafeLight: 'rgba(34,197,94,0.15)',
    statusWarning: '#f59e0b',
    statusWarningLight: 'rgba(245,158,11,0.15)',
    statusCritical: '#ef4444',
    statusCriticalLight: 'rgba(239,68,68,0.15)',

    // Chart colors (from web app)
    chartBlue: '#3b82f6',
    chartPurple: '#8b5cf6',
    chartGreen: '#10b981',
    chartOrange: '#f97316',
  },

  // Border radius (0.5rem = 8px from web app)
  radius: 8,
};

export default colors;
