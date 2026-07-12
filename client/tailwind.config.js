/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FDFCF9',
        foreground: '#121212',
        accent: '#B24A2C',
        muted: 'rgba(18, 18, 18, 0.5)',
        'muted-light': 'rgba(18, 18, 18, 0.4)',
        'border-subtle': 'rgba(18, 18, 18, 0.1)',
        'border-light': 'rgba(18, 18, 18, 0.05)',
        'accent-muted': 'rgba(178, 74, 44, 0.1)',
        'accent-subtle': 'rgba(178, 74, 44, 0.2)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        custom: '4px 4px 0px 0px rgba(18, 18, 18, 0.05)',
        hard: '4px 4px 0px 0px #121212',
      },
      borderRadius: {
        none: '0',
      },
      fontSize: {
        '2xs': '10px',
      },
      letterSpacing: {
        widest: '0.15em',
      },
    },
  },
  plugins: [],
}
