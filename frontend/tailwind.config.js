/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#09090b',
        surface: '#111113',
        panel: '#111113',
        raised: '#18181b',
        muted: '#27272a',
        edge: 'rgba(255,255,255,0.08)',
        'edge-strong': 'rgba(255,255,255,0.14)',
        brand: {
          DEFAULT: '#34d399',
          soft: '#6ee7b7',
          dim: '#059669',
          glow: 'rgba(52, 211, 153, 0.35)',
        },
        gold: '#fbbf24',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        soft: '0 24px 48px -12px rgba(0, 0, 0, 0.55)',
        brand: '0 8px 32px -8px rgba(52, 211, 153, 0.35)',
        panel: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
    },
  },
  plugins: [],
}
