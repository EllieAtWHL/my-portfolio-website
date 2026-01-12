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
        // Your existing color scheme from CSS custom properties
        'pale-green': 'hsl(113, 15%, 90%)',
        'dark-green': 'hsl(113, 90%, 15%)',
        'dark-green-transparency': 'hsl(113, 90%, 15%, 0.9)',
        'third-colour': 'hsl(113, 75%, 7.5%)',
        'success-color': 'hsl(113, 90%, 15%)',
        'error-color': 'rgb(194, 62, 62)',
        
        // Spurs Women theme colors
        'spurs-navy': '#081521',
        'spurs-navy-light': '#0d1b2a',
        'spurs-navy-lighter': '#1a2f42',
        'spurs-blue': '#78BEE8',
        'spurs-blue-light': '#a8d0e8',
        'spurs-white': '#f5f7fa',
        'spurs-gray': '#64748b',
      },
      fontFamily: {
        'nokora': ['Nokora', 'Arial', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        'heading': '400%',
        'sub-heading': '300%',
        'tertiary-heading': '200%',
        'lowest-heading': '150%',
        'text': '110%',
      },
      width: {
        'logo': '50px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
export default config
