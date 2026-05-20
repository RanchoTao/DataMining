/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#0b1020',
          panel: '#111a2e',
          panelAlt: '#15223b',
          border: '#23365b',
          text: '#d7e3ff',
          muted: '#8ca2c9',
          accent: '#4f8cff',
          negative: '#ff6b81',
          positive: '#39d98a'
        }
      }
    },
  },
  plugins: [],
};
