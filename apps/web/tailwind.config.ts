import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C63FF',
          50:  '#F0EFFF',
          100: '#E0DEFF',
          200: '#C1BCFF',
          300: '#A29BFF',
          400: '#8379FF',
          500: '#6C63FF',
          600: '#4D43E0',
          700: '#3830B8',
          800: '#251F90',
          900: '#151268',
          foreground: '#FFFFFF',
        },
        secondary: { DEFAULT: '#10B981', foreground: '#FFFFFF' },
        danger:    { DEFAULT: '#EF4444' },
        warning:   { DEFAULT: '#F59E0B' },
        info:      { DEFAULT: '#3B82F6' },
        border:    '#E5E7EB',
        input:     '#E5E7EB',
        ring:      '#6C63FF',
        background:'#F9FAFB',
        foreground:'#111827',
        muted: {
          DEFAULT:    '#F3F4F6',
          foreground: '#6B7280',
        },
        card: {
          DEFAULT:    '#FFFFFF',
          foreground: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 20px 60px rgba(0,0,0,0.15)',
        focus: '0 0 0 3px rgba(108,99,255,0.2)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'spin-slow':'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                              to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(6px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
