/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#0A0A0A',
        'surface-highlight': '#121212',
        primary: '#FF003C',
        'primary-glow': 'rgba(255, 0, 60, 0.5)',
        secondary: '#00F0FF',
        'text-primary': '#E0E0E0',
        'text-secondary': '#A0A0A0',
        border: '#333333',
        success: '#00FF9D',
        warning: '#FFD600',
        error: '#FF003C',
        gold: '#FFD700',
      },
      fontFamily: {
        'heading': ['Chakra Petch', 'sans-serif'],
        'body': ['JetBrains Mono', 'monospace'],
        'ui': ['Rajdhani', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(255, 0, 60, 0.3), 0 0 20px rgba(255, 0, 60, 0.1)',
        'neon-strong': '0 0 15px rgba(255, 0, 60, 0.5), 0 0 30px rgba(255, 0, 60, 0.2)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 0, 60, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 0, 60, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
