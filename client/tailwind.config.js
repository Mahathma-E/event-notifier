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
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#1d9bf0', // Twitter Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          bg: '#000000',
          card: '#16181c',
          hover: '#202327',
          border: '#2f3336',
          text: {
            main: '#e7e9ea',
            muted: '#71767b',
          }
        },
        accent: {
          blue: '#1d9bf0',
          pink: '#f91880',
          green: '#00ba7c',
        }
      },
    },
  },
  plugins: [],
}
