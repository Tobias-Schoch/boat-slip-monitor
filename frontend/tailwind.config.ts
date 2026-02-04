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
        background: 'hsl(222, 47%, 4%)',       // Much darker blue-black
        card: 'hsl(222, 47%, 7%)',             // Very dark blue
        foreground: 'hsl(210, 10%, 98%)',      // Pure white text
        primary: 'hsl(217, 91%, 60%)',         // Blue accent
        accent: 'hsl(217, 91%, 65%)',          // Lighter vibrant blue
        muted: 'hsl(217, 20%, 40%)',           // Blue-gray
        border: 'hsl(217, 30%, 12%)',          // Subtle blue borders
        success: 'hsl(142, 76%, 42%)',         // Brighter green
        warning: 'hsl(38, 92%, 55%)',          // Brighter orange
        error: 'hsl(0, 84%, 60%)',             // Brighter red
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 10px currentColor' },
          '50%': { opacity: '0.5', boxShadow: '0 0 20px currentColor' },
        },
      },
    },
  },
  plugins: [],
}

export default config
