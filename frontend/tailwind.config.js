/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Space / Cyber Backgrounds
        cyber: {
          950: '#050B14', // Extreme dark
          900: '#0A1428', // Background
          800: '#112240', // Panels
          700: '#1D3B68', // Borders/Hover
        },
        navy: {
          900: '#0F172A', 
          950: '#020617', 
          800: '#1E293B', 
        },
        // Accents (Neon)
        electric: {
          400: '#60A5FA',
          500: '#3B82F6',
          glow: '#00F0FF', // Neon Cyan
        },
        purple: {
          glow: '#8B5CF6',
          deep: '#4C1D95',
        },
        signal: {
          high: '#10B981', // Emerald 500
          med: '#F59E0B',  // Amber 500
          low: '#EF4444',  // Red 500
          neon: '#34D399', // Bright Green
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 30px rgba(0, 0, 0, 0.5)',
        'glow-cyan': '0 0 15px rgba(0, 240, 255, 0.5)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        }
      }
    },
  },
  plugins: [],
}
