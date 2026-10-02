// A colour defined as a space-separated RGB variable in globals.css, usable with opacity modifiers.
const v = (name) => `rgb(var(--color-${name}) / <alpha-value>)`

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
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          gray:    'rgb(var(--color-ink-gray) / <alpha-value>)',
          muted:   'rgb(var(--color-ink-muted) / <alpha-value>)',
          faint:   'rgb(var(--color-ink-faint) / <alpha-value>)',
        },
        'surface-subtle': v('surface-subtle'),
        'surface-muted': v('surface-muted'),
        line: {
          DEFAULT: 'rgb(var(--color-line) / <alpha-value>)',
          strong:  'rgb(var(--color-line-strong) / <alpha-value>)',
        },
        'admin-accent': 'rgb(var(--color-admin-accent) / <alpha-value>)',
        // Badge tones, inline errors, admin states and role badges (see globals.css for values).
        'tone-amber': v('tone-amber'),
        'tone-amber-soft': v('tone-amber-soft'),
        'tone-blue': v('tone-blue'),
        'tone-blue-soft': v('tone-blue-soft'),
        'tone-green': v('tone-green'),
        'tone-green-soft': v('tone-green-soft'),
        'tone-red': v('tone-red'),
        'tone-red-soft': v('tone-red-soft'),
        'tone-gray': v('tone-gray'),
        'tone-gray-soft': v('tone-gray-soft'),
        'error': v('error'),
        'error-soft': v('error-soft'),
        'error-line': v('error-line'),
        'success': v('success'),
        'success-dot': v('success-dot'),
        'success-soft': v('success-soft'),
        'success-wash': v('success-wash'),
        'danger': v('danger'),
        'danger-strong': v('danger-strong'),
        'danger-dot': v('danger-dot'),
        'danger-soft': v('danger-soft'),
        'danger-line': v('danger-line'),
        'danger-wash': v('danger-wash'),
        'danger-tint': v('danger-tint'),
        'warning': v('warning'),
        'warning-soft': v('warning-soft'),
        'role-clinician': v('role-clinician'),
        'role-clinician-soft': v('role-clinician-soft'),
        'role-engineer': v('role-engineer'),
        'role-engineer-soft': v('role-engineer-soft'),
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
