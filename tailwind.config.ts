/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C49102',
          dark: '#8B6914',
          light: '#D4A574',
        },
        charcoal: '#4A3728',
        cream: '#F5F0E8',
        rose: '#B76E79',
      },
    },
  },
  plugins: [],
};