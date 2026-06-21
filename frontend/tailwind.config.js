/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a12',
        panel: '#12121f',
        edge: '#22223a',
        brand: { DEFAULT: '#7D00FF', soft: '#a855f7' },
        accent: '#06b6d4',
        gold: '#f5c542',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -10px rgba(125,0,255,0.45)',
      },
    },
  },
  plugins: [],
}
