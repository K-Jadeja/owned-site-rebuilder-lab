/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rve: {
          bg: '#0a0a0a',
          panel: '#161616',
          border: '#262626',
          text: '#e5e5e5',
          muted: '#9ca3af',
          accent: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};
