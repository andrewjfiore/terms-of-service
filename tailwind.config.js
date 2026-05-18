/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0b0e14',
        panel: '#141925',
        panel2: '#1c2333',
        edge: '#2a3346',
        accent: '#5b9dff',
        accent2: '#7c5cff',
        good: '#3ecf8e',
        warn: '#f5a623',
        bad: '#ff5c5c',
      },
    },
  },
  plugins: [],
};
