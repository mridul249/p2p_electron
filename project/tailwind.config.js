/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-bg': '#0b1220',
        'panel-bg': '#101827',
        'panel-2-bg': '#0f172a',
        'primary-blue': '#3b82f6',
        'accent-cyan': '#22d3ee',
        'primary-border': '#1f2a44',
        'primary-text': '#e2e8f0',
        'muted-text': '#94a3b8',
      }
    },
  },
  plugins: [],
}