import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: 'var(--brand-primary-dark)',
          light: 'var(--brand-primary-light)',
          darker: 'var(--brand-primary-darker)',
          darkest: 'var(--brand-primary-darkest)',
        },
        spurs: {
          dark: 'var(--spurs-primary-dark)',
          light: 'var(--spurs-primary-light)',
          darker: 'var(--spurs-primary-darker)',
          darkest: 'var(--spurs-primary-darkest)',
          accent: 'var(--spurs-dark-accent)',
          'accent-bright': 'var(--spurs-dark-accent-bright)',
          'bg-med': 'var(--spurs-bg-med)',
          'bg-light-1': 'var(--spurs-bg-light-1)',
          'bg-light-2': 'var(--spurs-bg-light-2)',
        },
        dark: {
          bg: {
            1: 'var(--dark-bg-1)',
            2: 'var(--dark-bg-2)',
          },
          text: 'var(--dark-text)',
          accent: 'var(--dark-accent)',
          'accent-bright': 'var(--dark-accent-bright)',
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary-light) 100%)',
        'spurs-gradient': 'linear-gradient(135deg, var(--spurs-primary-dark) 0%, var(--spurs-primary-darker) 100%)',
        'spurs-wrapper-gradient': 'linear-gradient(90deg, var(--spurs-dark-bg-2) 0%, var(--spurs-dark-bg-1) 25%, var(--spurs-bg-med) 50%, var(--spurs-dark-bg-1) 75%, var(--spurs-dark-bg-2) 100%)',
      },
    },
  },
  darkMode: 'class',
};
export default config;
