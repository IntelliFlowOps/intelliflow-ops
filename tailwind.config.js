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
          900: '#0a0a0b',
          800: '#111113',
          700: '#18181b',
          600: '#1e1e22',
          500: '#27272a',
          400: '#3f3f46',
          300: '#52525b',
        },
        accent: {
          DEFAULT: '#6366f1',
          dim: '#4f46e5',
          glow: '#818cf8',
        },
        success: '#22c55e',
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
