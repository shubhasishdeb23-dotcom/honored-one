const defaultTheme = require('tailwindcss').defaultConfig;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#14b8a6',
          cyan: '#06b6d4',
          indigo: '#6366f1',
        },
      },
      animation: {
        'scroll': 'scroll 30s linear infinite',
        'scroll-reverse': 'scroll 30s linear infinite reverse',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
