/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:     '#000000',
        surface: 'var(--surface)',
        raised:  'var(--raised)',
        overlay: 'var(--overlay)',
        edge:    'var(--line)',
        'edge-strong': 'var(--line-strong)',
        brand: {
          DEFAULT: 'var(--brand)',
          dim:     'var(--brand-dim)',
          line:    'var(--brand-line)',
        },
        gold:    'var(--warning)',
        danger:  'var(--danger)',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:    ['12px', '16px'],
        sm:    ['13px', '20px'],
        base:  ['14px', '22px'],
        lg:    ['16px', '24px'],
        xl:    ['18px', '28px'],
        '2xl': ['22px', '30px'],
        '3xl': ['28px', '34px'],
        '4xl': ['36px', '42px'],
      },
      borderRadius: {
        sm:  '5px',
        DEFAULT: '8px',
        md:  '8px',
        lg:  '10px',
        xl:  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        sm:    '0 1px 3px rgba(0,0,0,0.4)',
        DEFAULT: '0 4px 12px rgba(0,0,0,0.4)',
        lg:    '0 12px 32px rgba(0,0,0,0.5)',
        brand: '0 4px 16px rgba(34,197,94,0.25)',
      },
    },
  },
  plugins: [],
}
