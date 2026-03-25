/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#020608',
          800: '#03080f',
          700: '#040c18',
          600: '#061220',
          500: '#0a1929',
          400: '#0e2235',
          300: '#1a3a52',
        },
        accent: {
          DEFAULT: '#06b6d4',
          dim: '#0891b2',
          bright: '#22d3ee',
          glow: '#67e8f9',
          deep: '#0e7490',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
