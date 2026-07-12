/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0d0d0d',
        'dark-parchment': '#1a1410',
        'aged-leather': '#2d2418',
        scroll: '#f4e4c1',
        'arcane-gold': '#c9a84c',
        ember: '#d4652a',
        parchment: '#e8dcc8',
        'faded-ink': '#8b7355',
        'hp-crimson': '#8b0000',
        'mp-azure': '#1e5fa8',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'rune-glow': '0 0 15px rgba(201, 168, 76, 0.4)',
        'rune-strong': '0 0 25px rgba(201, 168, 76, 0.6)',
        'ember-glow': '0 0 12px rgba(212, 101, 42, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 8px rgba(201, 168, 76, 0.3)' }, '50%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.6)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
      },
    },
  },
  plugins: [],
};
