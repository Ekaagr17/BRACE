/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        orion: {
          bg: {
            deepest: '#0a0c0f',   // Deepest Graphite
            base: '#11141a',      // Base Graphite
            elevated: '#171c24',  // Elevated Graphite
            card: '#1e2430',      // Card Graphite
          },
          border: {
            subtle: '#283142',    // Dark Titanium border
            medium: '#39465e',    // Titanium border
            light: '#52627e',     // Light Titanium
          },
          text: {
            primary: '#f8fafc',   // Ice White
            secondary: '#94a3b8', // Muted Silver
            muted: '#64748b',     // Deep Silver / Titanium
          },
          cyan: '#00f0ff',        // Arc Reactor Cyan
          red: '#ff1e42',         // Stark Red
          gold: '#d4af37',        // Metallic Gold
          silver: '#94a3b8',      // Muted Silver
          titanium: '#8b9bb4',    // Titanium
          ice: '#f8fafc',         // Ice White
          green: '#00e676',       // High Voltage Terminal Green
          blue: '#00b0ff',        // Cyan-Blue
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.25)',
        'glow-red': '0 0 15px rgba(255, 30, 66, 0.25)',
        'glow-gold': '0 0 15px rgba(212, 175, 55, 0.25)',
        'glow-green': '0 0 15px rgba(0, 230, 118, 0.25)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0, 240, 255, 0.15)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.35)' },
        },
      },
    },
  },
  plugins: [],
};
