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
        background: 'hsl(210, 20%, 6%)',      // Very dark blue-gray
        card: 'hsl(210, 20%, 8%)',             // Slightly lighter
        foreground: 'hsl(210, 10%, 95%)',      // Almost white text
        primary: 'hsl(217, 91%, 60%)',         // Blue accent
        accent: 'hsl(217, 91%, 50%)',          // Vibrant blue
        muted: 'hsl(210, 15%, 20%)',           // Muted gray
        border: 'hsl(210, 15%, 15%)',          // Subtle borders
        success: 'hsl(142, 76%, 36%)',         // Green
        warning: 'hsl(38, 92%, 50%)',          // Orange
        error: 'hsl(0, 72%, 51%)',             // Red
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
