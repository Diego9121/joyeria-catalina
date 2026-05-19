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
        vino: {
          DEFAULT: '#C9A227',
          dark: '#A68520',
          light: '#E8D48A',
        },
        rosado: '#FAF9F6',
        negro: '#1A1A1A',
        plomo: {
          DEFAULT: '#9CA3AF',
          dark: '#4B5563',
        },
      },
    },
  },
  plugins: [],
};
