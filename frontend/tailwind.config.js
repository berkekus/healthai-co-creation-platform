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
