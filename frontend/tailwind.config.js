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
        // Semantic tokens for dark theme
        surface: '#1a1a1a',
        'surface-elevated': '#262626',
        border: '#333333',
        'text-primary': '#ffffff',
        'text-muted': '#a3a3a3',
        primary: '#C41E3A',
        'primary-hover': '#A11830',
        'badge-success': '#22c55e',
        'badge-success-fg': '#ffffff',
        'badge-warning': '#f59e0b',
        'badge-warning-fg': '#ffffff',
        'badge-error': '#ef4444',
        'badge-error-fg': '#ffffff',
        'badge-info': '#3b82f6',
        'badge-info-fg': '#ffffff',
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
