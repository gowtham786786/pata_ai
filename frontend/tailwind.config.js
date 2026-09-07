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
        canvas: {
          DEFAULT: '#06080F', // Deep Void pitch obsidian
          subtle: '#0A0E17',
          card: '#0E1424',
          surface: 'rgba(14, 20, 36, 0.8)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(0, 240, 255, 0.3)',
        },
        cyber: {
          950: '#04060B',
          900: '#06080F',
          800: '#0C1222',
          700: '#141D36',
        },
        navy: {
          950: '#04060C',
          900: '#080D1A',
          800: '#0F182E',
        },
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0284c7',
          cyan: '#00F0FF',
          blue: '#2563EB',
          glow: '#00F0FF',
        },
        electric: {
          400: '#38BDF8',
          500: '#0284C7',
          glow: '#00F0FF',
        },
        signal: {
          high: '#10B981',   // Emerald
          med: '#F59E0B',    // Amber
          low: '#EF4444',    // Red
          neon: '#00F0FF',   // Neon Cyan
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'neon-cyan': '0 0 25px -4px rgba(0, 240, 255, 0.4)',
        'neon-blue': '0 0 25px -4px rgba(37, 99, 235, 0.4)',
        'neon-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.4)',
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'radar': 'radar 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        radar: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
