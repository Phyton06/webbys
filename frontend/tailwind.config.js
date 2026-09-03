/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta del logo Webby's
        black: '#000000',
        red: {
          DEFAULT: '#C41E3A',
          dark: '#9B1B30',
          light: '#E8364F',
        },
        cyan: {
          DEFAULT: '#00BCD4',
          dark: '#0097A7',
          light: '#4DD0E1',
        },
        white: '#FFFFFF',
        gray: {
          800: '#1A1A1A',
          700: '#2A2A2A',
          600: '#3A3A3A',
          500: '#666666',
          400: '#999999',
          300: '#CCCCCC',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
