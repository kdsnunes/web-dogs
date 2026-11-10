/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1A1A1A',
          soft: '#4A4A4A',
          muted: '#7A7A7A',
        },
        paper: {
          DEFAULT: '#F7F5F1',
          card: '#FFFFFF',
          alt: '#EFECE6',
        },
        brand: {
          DEFAULT: '#006039',
          deep: '#004428',
          light: '#007A4A',
        },
        gold: '#B8860B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
