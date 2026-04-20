interface PageWrapperProps {
  children: React.ReactNode
  /** Custom max-width in px (number) or CSS value (string). Defaults to 1280px (matches max-w-7xl). */
  maxWidth?: number | string
  /** Top padding CSS value, e.g. "clamp(48px,8vw,96px)". */
  padTop?: number | string
  /** Optional extra class names for the inner container. */
  className?: string
}

/**
 * Standard container for authenticated-app pages (Faz 1 refresh).
 * Applies the hai-offwhite surface top-padding rhythm, centers content,
 * and lets pages override width/top-padding for login/profile/etc.
 */
export default function PageWrapper({
  children,
  maxWidth = 1280,
  padTop,
  className = '',
}: PageWrapperProps) {
  const mw = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth
  const pt = padTop === undefined
    ? 'clamp(32px, 5vw, 64px)'
    : typeof padTop === 'number' ? `${padTop}px` : padTop

  return (
    <main
      className="min-h-[calc(100vh-4rem)] pb-20"
      style={{ paddingTop: pt }}
    >
      <div
        className={`mx-auto px-6 md:px-8 ${className}`}
        style={{ maxWidth: mw }}
      >
        {children}
      </div>
    </main>
  )
}
