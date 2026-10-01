/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Landing / app palette — values driven by CSS variables so dark mode
        // overrides in globals.css (.dark { --hai-* }) take effect automatically.
        'hai-teal':     'rgb(var(--hai-teal))',
        'hai-teal-dark': '#1B7A88',
        'hai-mint':     'rgb(var(--hai-mint))',
        'hai-plum':     'rgb(var(--hai-plum))',
        'hai-offwhite': 'rgb(var(--hai-offwhite))',
        'hai-lime':     'rgb(var(--hai-lime))',
        'hai-cream':    'rgb(var(--hai-cream))',
        // Keyboard focus indicator — ≥3:1 against light surfaces (WCAG 1.4.11).
        'hai-focus':    'rgb(var(--focus-ring) / <alpha-value>)',
        'hai-teal-soft': 'rgb(var(--color-teal-soft) / <alpha-value>)',
        // Named app colours; values and roles are documented next to the variables in globals.css.
        ink: {
          DEFAULT:      'rgb(var(--color-ink) / <alpha-value>)',
          alt:          'rgb(var(--color-ink-alt) / <alpha-value>)',
          gray:         'rgb(var(--color-ink-gray) / <alpha-value>)',
          muted:        'rgb(var(--color-ink-muted) / <alpha-value>)',
          'muted-alt':  'rgb(var(--color-ink-muted-alt) / <alpha-value>)',
          'muted-gray': 'rgb(var(--color-ink-muted-gray) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--color-line) / <alpha-value>)',
          strong:  'rgb(var(--color-line-strong) / <alpha-value>)',
          gray:    'rgb(var(--color-line-gray) / <alpha-value>)',
        },
        'admin-accent': 'rgb(var(--color-admin-accent) / <alpha-value>)',
      },
      /**
       * Typography system — only two live families:
       *   - Plus Jakarta Sans → headlines, logo, buttons, pill badges, uppercase
       *     caps labels (what was historically classed `font-mono`).
       *   - Source Sans 3     → body copy, paragraphs, long-form reading text.
       *
       * Tailwind tokens:
       *   - `font-headline`, `font-feixen`  → Plus Jakarta Sans
       *       (`feixen` kept as an alias so legacy `font-feixen` usages keep working).
       *   - `font-body`                      → Source Sans 3.
       *   - `font-mono`                      → Plus Jakarta Sans (tabular-ish caps
       *       labels). We override Tailwind's default mono stack here so all the
       *       existing `font-mono` pill/badge classes render in our real brand
       *       family instead of the system ui-monospace font.
       *
       * Both families are loaded as Google Fonts from index.html.
       */
      fontFamily: {
        feixen:   ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        headline: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body:     ['"Source Sans 3"',     'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:     ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
    },
  },
  plugins: [],
}
