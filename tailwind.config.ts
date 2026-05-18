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
          DEFAULT: '#6B1D2F',
          dark: '#4A1220',
          light: '#D4A5A5',
        },
        rosado: '#FFF0F0',
        negro: '#0A0A0A',
        plomo: {
          DEFAULT: '#9CA3AF',
          dark: '#4B5563',
        },
      },
    },
  },
  plugins: [],
};
