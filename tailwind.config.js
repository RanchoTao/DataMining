/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#f5f7fb',
          panel: '#ffffff',
          panelAlt: '#f8faff',
          border: '#dbe4f2',
          text: '#1f2937',
          muted: '#64748b',
          accent: '#4f7cff',
          negative: '#e06a7a',
          positive: '#4c8fd9'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(31, 41, 55, 0.06)'
      }
    },
  },
  plugins: [],
};
