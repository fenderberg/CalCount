/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Canonieke tokens staan in docs/design.md; CSS-variabelen leveren light/dark.
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
        'surface-page': 'rgb(var(--surface-page) / <alpha-value>)',
        'surface-card': 'rgb(var(--surface-card) / <alpha-value>)',
        'surface-muted': 'rgb(var(--surface-muted) / <alpha-value>)',
        'surface-track': 'rgb(var(--surface-track) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'text-subtle': 'rgb(var(--text-subtle) / <alpha-value>)',
        'text-faint': 'rgb(var(--text-faint) / <alpha-value>)',
        'budget-under': 'rgb(var(--budget-under) / <alpha-value>)',
        'budget-under-start': 'rgb(var(--budget-under-start) / <alpha-value>)',
        'budget-under-end': 'rgb(var(--budget-under-end) / <alpha-value>)',
        'budget-near': 'rgb(var(--budget-near) / <alpha-value>)',
        'budget-over': 'rgb(var(--budget-over) / <alpha-value>)',
        reward: 'rgb(var(--reward) / <alpha-value>)',
        'reward-surface': 'rgb(var(--reward-surface) / <alpha-value>)',
        'reward-text': 'rgb(var(--reward-text) / <alpha-value>)',
        'reward-text-strong': 'rgb(var(--reward-text-strong) / <alpha-value>)',
        nutrition: 'rgb(var(--nutrition) / <alpha-value>)',
        'nutrition-surface': 'rgb(var(--nutrition-surface) / <alpha-value>)',
        'confidence-high': 'rgb(var(--confidence-high) / <alpha-value>)',
        'confidence-high-surface': 'rgb(var(--confidence-high-surface) / <alpha-value>)',
        'confidence-medium': 'rgb(var(--confidence-medium) / <alpha-value>)',
        'confidence-medium-surface': 'rgb(var(--confidence-medium-surface) / <alpha-value>)',
        'confidence-low': 'rgb(var(--confidence-low) / <alpha-value>)',
        'confidence-low-surface': 'rgb(var(--confidence-low-surface) / <alpha-value>)',
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
        logo: '0 12px 24px -8px rgba(47, 143, 94, 0.55), inset 0 1px 0 rgba(255,255,255,0.3)',
      },
      spacing: {
        'tap-min': '48px',
      },
    },
  },
  plugins: [],
};
