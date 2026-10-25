/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B1120',
          800: '#111827',
          700: '#1E293B',
          600: '#334155'
        },
        aqi: {
          good: '#10B981',
          satisfactory: '#84CC16',
          moderate: '#EAB308',
          poor: '#F97316',
          veryPoor: '#EF4444',
          severe: '#881337'
        }
      }
    },
  },
  plugins: [],
}
