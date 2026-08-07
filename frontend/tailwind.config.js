/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Navy / Ink backgrounds
        navy: {
          900: '#0F172A', // Slate 900
          950: '#020617', // Slate 950
          800: '#1E293B', // Slate 800 (for subtle elevation)
        },
        // Accents
        electric: '#3B82F6', // Blue 500
        signal: {
          high: '#14B8A6', // Teal 500
          med: '#F59E0B',  // Amber 500
          low: '#F43F5E',  // Rose 500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
