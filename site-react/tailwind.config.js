import { pangoColors } from './src/@pango.core/theme/theme'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: pangoColors.pangodark,
        accent: pangoColors.pangoAccent,
      },
    },
  },
  plugins: [],
}
