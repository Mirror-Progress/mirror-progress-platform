import type { Config } from 'tailwindcss';

export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
    './services/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // background: 'var(--background)',
        // foreground: 'var(--foreground)',
        primary: '#012727',
        secondaryGreen: '#012727',
        secondaryGrey: '#A2A2A2',
        white: '#FFFFFF',
      },
      fontFamily: {
        dmSans: ['DM Sans', 'sans-serif'],
        inter: ['Inter', 'serif'],
        diatype: ['Diatype', 'sans-serif'],
      },
      lineHeight: {
        '100': '100%',
        '120': '120%',
      },
      letterSpacing: {
        '3p': '3%',
        m2p: '-2.2%',
        m3p: '-3%',
      },
      backgroundImage: {
        'footer-gradient':
          'linear-gradient(to bottom, #012727 0%, #1B3636 12%, #4F7171 55%, #9EB5B5 80%, #FFFFFF 100%)',
        'heroL-gradient':
          'linear-gradient(to right, #000000 0%, #FFFFFF 77%)',
        'hero-right-gradient':
          'linear-gradient(to left, rgba(29, 34, 34, 0) 0%, rgba(29, 32, 34, 1) 77%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
