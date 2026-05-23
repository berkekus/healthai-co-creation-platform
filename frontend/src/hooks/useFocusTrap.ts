import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  active: boolean,
  onEscape?: () => void,
) {
  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const getFocusable = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')

    const focusable = getFocusable()
    ;(focusable[0] ?? container).focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape?.()
        return
      }
      if (event.key !== 'Tab') return

      const currentFocusable = getFocusable()
      if (currentFocusable.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus()
    }
  }, [active, containerRef, onEscape])
}
