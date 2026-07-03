import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#A855F7',
          dark: '#9333EA',
          darker: '#7C3AED',
        },
        accent: {
          fuchsia: '#D946EF',
          pink: '#EC4899',
        },
        // Theme-reactive: values come from CSS custom properties (RGB triplets)
        // defined in :root (dark, default) and overridden by .light in
        // src/app/index.css, so a single class toggle re-themes the whole app.
        surface: {
          void: 'rgb(var(--surface-void) / <alpha-value>)',
          base: 'rgb(var(--surface-base) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          overlay: 'rgb(var(--surface-overlay) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        // Replaces literal `white` for translucent glass panels/borders so
        // they invert correctly (light tint on dark bg, dark tint on light bg).
        glass: 'rgb(var(--glass-rgb) / <alpha-value>)',
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        accent: ['Poppins', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(135deg, #A855F7 0%, #9333EA 50%, #7C3AED 100%)',
        'neon-gradient-accent': 'linear-gradient(135deg, #D946EF 0%, #EC4899 100%)',
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(168,85,247,0.15), transparent 60%)',
        'grid-pattern': 'linear-gradient(rgba(168,85,247,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.06) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(168,85,247,0.35)',
        'glow-md': '0 0 24px rgba(168,85,247,0.4)',
        'glow-lg': '0 0 48px rgba(168,85,247,0.45)',
        'glow-fuchsia': '0 0 24px rgba(217,70,239,0.4)',
        'glow-danger': '0 0 24px rgba(239,68,68,0.5)',
        'glass': '0 8px 32px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-live': 'pulse-live 1.6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.85)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 16px rgba(168,85,247,0.3)' },
          '50%': { boxShadow: '0 0 32px rgba(168,85,247,0.55)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [animate],
}
