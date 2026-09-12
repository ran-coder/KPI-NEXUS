/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#F8FAFC',      // Main app background (slate-50)
          surface: '#FFFFFF',   // Card & panel background (pure white)
          elevated: '#F1F5F9',  // Hover states & active nav items (slate-100)
          border: '#E2E8F0',    // Subtle borders (slate-200)
        },
        text: {
          primary: '#090D16',   // Deep black
          secondary: '#0F172A', // Dark slate/black (used for FINANCIAL heading)
          muted: '#334155',     // Dark gray (used for subtitles & anomaly counts)
        },
        accent: {
          blue: '#2563EB',      // Primary blue button/accent
          teal: '#0D9488',
          amber: '#D97706',
          red: '#DC2626',
          purple: '#7C3AED',
          green: '#059669',
        },
        domain: {
          financial: '#059669',
          workforce: '#E11D48',
          customer: '#4F46E5',
          project: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        card: '12px',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};