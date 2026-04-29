/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bank: {
          50:  '#eef6ff',
          100: '#d9eaff',
          200: '#bcd8ff',
          300: '#8dbeff',
          400: '#5a9bff',
          500: '#3478f6',
          600: '#1f5ce8',
          700: '#1848cc',
          800: '#1a3da0',
          900: '#1b377e',
          950: '#141f4a',
        },
        brand: {
          50:  '#eef6ff',
          100: '#d9eaff',
          200: '#bcd8ff',
          300: '#8dbeff',
          400: '#5a9bff',
          500: '#3478f6',
          600: '#1f5ce8',
          700: '#1848cc',
          800: '#1a3da0',
          900: '#1b377e',
          950: '#141f4a',
        },
        gold: '#e8b84b',
      },
      fontFamily: {
        display: ['"Montserrat"', '"Inter"', 'system-ui', 'sans-serif'],
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        glass: '0 24px 80px rgba(0,0,0,0.55)',
        'glass-sm': '0 18px 48px rgba(0,0,0,0.45)',
        glow: '0 0 36px rgba(123,144,255,0.3)',
      },
      animation: {
        'float':    'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':  'fadeIn 0.3s ease',
        'shimmer':  'shimmer 1.8s infinite',
        'spin-slow':'spin 8s linear infinite',
      },
      keyframes: {
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
