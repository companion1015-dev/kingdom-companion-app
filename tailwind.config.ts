import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#1B3A5C', light: '#2A5080', dark: '#122840' },
        cream:   { DEFAULT: '#FAF7F2', dark: '#F0EBE0' },
        gold:    { DEFAULT: '#C9A84C', light: '#E8CC7A', dark: '#A07C2A' },
        sage:    { DEFAULT: '#7A9E87', light: '#A8C4B0', dark: '#5A7A65' },
        clay:    { DEFAULT: '#C27B5A', light: '#D9A080', dark: '#9A5A3A' },
        charcoal:{ DEFAULT: '#2C2C2C' },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.6s ease-out forwards',
        'slide-up':   'slideUp 0.5s ease-out forwards',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 20px rgba(201,168,76,0.15)' }, '50%': { boxShadow: '0 0 40px rgba(201,168,76,0.30)' } },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(160deg, #1B3A5C 0%, #2A5080 40%, #1a3850 70%, #0f2236 100%)',
        'cream-gradient': 'linear-gradient(180deg, #FAF7F2 0%, #F0EBE0 100%)',
        'gold-shimmer':  'linear-gradient(90deg, #C9A84C, #E8CC7A, #C9A84C)',
      },
    },
  },
  plugins: [],
}
export default config
