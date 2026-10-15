import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

/**
 * Opens each new page at its top. Without it the window kept the previous
 * page's scroll position, so following a link from the bottom of a long page
 * landed at the bottom of the next one. Back/forward (POP) is left to the
 * browser, and query-only changes such as list filters keep their position.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()
  const previousPathname = useRef(pathname)

  useEffect(() => {
    if (pathname === previousPathname.current) return
    previousPathname.current = pathname
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
