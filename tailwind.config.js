/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gold: {
          500: 'var(--accent-gold)',
        },
        primary: 'var(--bg-main)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        content: 'var(--text-main)',
        muted: 'var(--text-muted)',
        border: 'var(--border-color)',
      }
    },
  },
  plugins: [],
}
