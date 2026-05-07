# Dark Mode — Design Spec
Date: 2026-05-07

## Overview

Add a persistent light/dark theme toggle to the HealthAI Co-Creation Platform. Users switch via a Sun/Moon button in the Navbar; preference is saved to localStorage and restored on next visit.

---

## Section 1: Architecture & State

### Theme Store

New file: `src/store/themeStore.ts`

```ts
type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}
```

- Reads initial value from `localStorage.getItem('theme')`, falls back to `'light'`
- On init and on every toggle, syncs to `document.documentElement.classList` by toggling the `dark` class
- Persists new value to `localStorage`

### Tailwind

`tailwind.config.js`:
- Add `darkMode: 'class'` at the top level
- Convert all `hai-*` color values from hex strings to CSS variable references:
  ```js
  'hai-plum':     'rgb(var(--hai-plum))',
  'hai-mint':     'rgb(var(--hai-mint))',
  'hai-teal':     'rgb(var(--hai-teal))',
  'hai-offwhite': 'rgb(var(--hai-offwhite))',
  'hai-lime':     'rgb(var(--hai-lime))',
  'hai-cream':    'rgb(var(--hai-cream))',
  ```

---

## Section 2: Dark Color Palette

### hai-* CSS Variables

Added to `globals.css` `:root` block (space-separated RGB, required for `rgb(var(--x))` Tailwind pattern):

| Variable | Light (#hex) | Dark (#hex) |
|---|---|---|
| `--hai-plum` | 54 33 62 (#36213E) | 196 181 212 |
| `--hai-mint` | 184 243 255 (#B8F3FF) | 20 50 60 |
| `--hai-teal` | 138 198 208 (#8AC6D0) | 93 168 181 |
| `--hai-offwhite` | 243 244 246 (#F3F4F6) | 15 15 25 |
| `--hai-lime` | 210 255 116 (#D2FF74) | 184 224 0 |
| `--hai-cream` | 227 220 210 (#E3DCD2) | 40 37 32 |

### Semantic Tokens (for hardcoded hex pages)

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--surface-base` | 247 248 250 | 15 15 25 | Page `bg-[#f7f8fa]` |
| `--surface-card` | 255 255 255 | 22 22 35 | Cards, modals |
| `--surface-blob` | 231 248 252 | 18 35 50 | Dashboard blob bg |
| `--surface-subtle` | 223 248 255 | 15 45 60 | Inner accent rings |
| `--text-primary` | 45 24 56 | 230 220 240 | All `#2d1838` text |
| `--text-secondary` | 119 114 127 | 155 145 165 | Muted subtext |
| `--text-heading` | 64 54 69 | 210 200 220 | Section headings `#403645` |
| `--text-link` | 133 203 216 | 93 168 181 | Arrow/view-all links |
| `--border-default` | 207 211 217 | 45 40 55 | Card/button borders |
| `--border-divider` | 223 226 231 | 38 33 48 | Row dividers |

globals.css additions:
```css
:root {
  --hai-plum: 54 33 62;
  --hai-mint: 184 243 255;
  --hai-teal: 138 198 208;
  --hai-offwhite: 243 244 246;
  --hai-lime: 210 255 116;
  --hai-cream: 227 220 210;

  --surface-base: 247 248 250;
  --surface-card: 255 255 255;
  --surface-blob: 231 248 252;
  --surface-subtle: 223 248 255;
  --text-primary: 45 24 56;
  --text-secondary: 119 114 127;
  --text-heading: 64 54 69;
  --text-link: 133 203 216;
  --border-default: 207 211 217;
  --border-divider: 223 226 231;
}

.dark {
  --hai-plum: 196 181 212;
  --hai-mint: 20 50 60;
  --hai-teal: 93 168 181;
  --hai-offwhite: 15 15 25;
  --hai-lime: 184 224 0;
  --hai-cream: 40 37 32;

  --surface-base: 15 15 25;
  --surface-card: 22 22 35;
  --surface-blob: 18 35 50;
  --surface-subtle: 15 45 60;
  --text-primary: 230 220 240;
  --text-secondary: 155 145 165;
  --text-heading: 210 200 220;
  --text-link: 93 168 181;
  --border-default: 45 40 55;
  --border-divider: 38 33 48;
}
```

---

## Section 3: Affected Files

### New file (1)
- `src/store/themeStore.ts`

### Config / global (2)
- `frontend/tailwind.config.js` — `darkMode: 'class'` + CSS var color format
- `src/styles/globals.css` — `:root` and `.dark` token blocks

### Layout (2)
- `src/components/layout/Navbar.tsx` — Sun/Moon toggle button in right cluster
- `src/components/layout/AppLayout.tsx` — swap `bg-hai-offwhite` to dark-aware token

### Pages — heavy hardcoded hex (5)
- `src/pages/dashboard/DashboardPage.tsx`
- `src/pages/posts/PostListPage.tsx`
- `src/pages/posts/PostDetailPage.tsx`
- `src/pages/admin/AdminPage.tsx`
- `src/pages/meetings/MeetingsPage.tsx`

### Auth pages — lighter touch (5)
- `src/pages/auth/LoginPage.tsx`
- `src/pages/auth/RegisterPage.tsx`
- `src/pages/auth/ForgotPasswordPage.tsx`
- `src/pages/auth/ResetPasswordPage.tsx`
- `src/pages/auth/VerifyEmailPage.tsx`

### Shared components (4)
- `src/components/posts/PostCard.tsx`
- `src/components/posts/PostFormFields.tsx`
- `src/pages/profile/ProfilePage.tsx`
- `src/pages/profile/EditProfilePage.tsx`

**Total: ~18 files**

---

## Implementation Notes

- `themeStore` initializes before React mounts (called at module load) to prevent flash of wrong theme
- Hardcoded hex replacements follow the pattern: `bg-[#f7f8fa]` → `bg-[rgb(var(--surface-base))]`
- Pages/components that only use `hai-*` classes need no per-element `dark:` additions — CSS variables handle them automatically
- The Sun/Moon toggle in Navbar is a single `<button>` that calls `toggleTheme()`; icon swaps based on current theme
