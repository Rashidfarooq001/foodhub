import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}', '../../packages/ui/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF1EC',
          500: '#FF5200',
          600: '#E04800',
        },
        emerald: {
          500: '#00C853',
        },
      },
    },
  },
  plugins: [],
};

export default config;
