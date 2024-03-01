/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "!./node_modules/**/*",
    "!./dist/**/*",
    "!./docs/**/*",
  ],
  important: '#root',
  theme: {
    screens: {
      'xs': '320px',
      ...defaultTheme.screens,
    },
    extend: {},
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
