/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#030403',
        panel: '#0b0b0b',
        raised: '#121212',
        edge: 'rgba(255,255,255,0.14)',
        brand: { DEFAULT: '#35e66b', soft: '#72f18f' },
        accent: '#f4f6f4',
        gold: '#f5c542',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(53,230,107,0.34)',
      },
    },
  },
  plugins: [],
}
