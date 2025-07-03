/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F1C',
        cardBackground: '#151B2D',
        accent: '#1E90FF',
        highlight: '#FFD700',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0AEC0',
        success: '#00C896',
        warning: '#F6C343',
        error: '#E53E3E',
        chartLine: '#FEC006',
        chartBar: '#FFDD57',
        chartBackground: '#1C2335',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '14px',
        'lg': '18px',
        'xl': '20px',
        '2xl': '24px',
      },
      borderRadius: {
        'card': '16px',
        'button': '8px',
        'tag': '6px',
        'tooltip': '6px',
      },
      boxShadow: {
        'card': '0px 2px 12px rgba(0, 0, 0, 0.15)',
        'tooltip': '0 2px 10px rgba(0, 0, 0, 0.25)',
      },
      spacing: {
        'section': '32px',
        'card': '20px',
        'grid': '16px',
      },
      animation: {
        'hover': 'hover 0.2s ease-in-out',
        'active': 'active 0.2s ease-in-out',
        'spotlight': 'spotlight 2s ease .75s 1 forwards',
        'aurora': 'aurora 5s infinite reverse',
      },
      keyframes: {
        hover: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.02)' },
        },
        active: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' },
        },
        spotlight: {
          '0%': {
            opacity: '0',
            transform: 'translate(-72%, -62%) scale(0.5)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(-50%,-40%) scale(1)',
          },
        },
        aurora: {
          '0%': {
            backgroundPosition: '0 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0 50%',
          },
        },
      },
    },
  },
  plugins: [],
} 