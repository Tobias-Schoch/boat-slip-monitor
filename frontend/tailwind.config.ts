import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(222, 47%, 3%)',       // Ultra dark blue-black
        card: 'hsl(222, 47%, 6%)',             // Very dark blue with transparency
        foreground: 'hsl(210, 40%, 98%)',      // Pure white text
        primary: {
          DEFAULT: 'hsl(217, 91%, 60%)',       // Blue accent
          light: 'hsl(217, 91%, 70%)',
          dark: 'hsl(217, 91%, 50%)',
        },
        accent: {
          DEFAULT: 'hsl(217, 91%, 65%)',       // Lighter vibrant blue
          light: 'hsl(217, 91%, 75%)',
          dark: 'hsl(217, 91%, 55%)',
        },
        muted: 'hsl(217, 20%, 50%)',           // Blue-gray
        border: 'hsl(217, 30%, 12%)',          // Subtle blue borders
        success: {
          DEFAULT: 'hsl(142, 76%, 45%)',       // Bright green
          light: 'hsl(142, 76%, 55%)',
          dark: 'hsl(142, 76%, 35%)',
        },
        warning: {
          DEFAULT: 'hsl(38, 92%, 55%)',        // Bright orange
          light: 'hsl(38, 92%, 65%)',
          dark: 'hsl(38, 92%, 45%)',
        },
        error: {
          DEFAULT: 'hsl(0, 84%, 60%)',         // Bright red
          light: 'hsl(0, 84%, 70%)',
          dark: 'hsl(0, 84%, 50%)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px currentColor' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px currentColor' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 40px rgba(59, 130, 246, 0.6)',
        'inner-glow': 'inset 0 0 20px rgba(59, 130, 246, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

export default config
