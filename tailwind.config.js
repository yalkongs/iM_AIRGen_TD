/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#f0f4ff',
          100: '#e0e8ff',
          600: '#1e3a6e',
          700: '#162d5a',
          800: '#0d1f45',
          900: '#0d1b3e',
        },
        gold: {
          400: '#e8c547',
          500: '#c9a227',
          600: '#a88020',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
        mono: ['"Noto Sans KR"', 'monospace'],
      },
      screens: {
        'print': { 'raw': 'print' },
      }
    },
  },
  plugins: [],
}
