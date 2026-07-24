/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tokens uit _bmad-output/planning-artifacts/ux-designs/ux-CalCount-2026-07-23/DESIGN.md.
      // Alleen de light-mode tokens: dark mode staat nog niet in de PRD/huidige implementatie.
      fontFamily: {
        sans: [
          'Hanken Grotesk',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        'surface-page': '#f7f1e6',
        'surface-card': '#ffffff',
        'surface-muted': '#f0e7d6',
        'surface-track': '#ece0cd',
        ink: '#2a2621',
        'text-muted': '#8a857c',
        'text-subtle': '#6f6a63',
        'text-faint': '#a39d93',
        'budget-under': '#2f8f5e',
        'budget-under-start': '#3aa86c',
        'budget-under-end': '#268a56',
        'budget-near': '#d98a2b',
        'budget-over': '#d8543f',
        reward: '#8a86d6',
        'reward-surface': '#efedf9',
        'reward-text': '#5d59b3',
        'reward-text-strong': '#4b479c',
        'confidence-high': '#2f8f5e',
        'confidence-high-surface': '#eef4ef',
        'confidence-medium': '#b06d1a',
        'confidence-medium-surface': '#f7efe0',
        'confidence-low': '#c26a2c',
        'confidence-low-surface': '#f7ece2',
      },
      borderRadius: {
        sm: '11px',
        DEFAULT: '18px',
        md: '16px',
        lg: '18px',
        xl: '22px',
        '2xl': '30px',
      },
      boxShadow: {
        // Warm-toned (rgba(42,38,33,…), nooit puur zwart) i.p.v. Tailwind's grijze default.
        ambient: '0 8px 24px rgba(42, 38, 33, 0.10)',
        fab: '0 10px 22px rgba(42, 38, 33, 0.28)',
      },
      spacing: {
        'tap-min': '48px',
      },
    },
  },
  plugins: [],
};
