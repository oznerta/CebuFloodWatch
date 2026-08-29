/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#1166ea',
          600: '#0d51be',
          900: '#193e6b',
        },
        flood: {
          low: '#1f9d55',
          advisory: '#facc15',
          warning: '#f5820d',
          severe: '#ea3838',
        },
        surface: {
          app: 'var(--surface-app)',
          card: 'var(--surface-card)',
          subtle: 'var(--surface-subtle)',
          border: 'var(--border-default)',
        },
      },
    },
  },
  plugins: [],
};
