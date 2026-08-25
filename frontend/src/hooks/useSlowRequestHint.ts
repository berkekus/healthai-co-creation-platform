import { useEffect, useState } from 'react'

/**
 * Reports whether an in-flight request has been running long enough to be worth
 * explaining to the user. The API's free Render instance sleeps after ~15
 * minutes idle and takes ~20s to wake, so a submit can sit there far longer
 * than a spinner alone accounts for — this lets the form say why instead of
 * looking broken.
 *
 * Returns false as soon as the request settles.
 */
export function useSlowRequestHint(isPending: boolean, delayMs = 3000): boolean {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    if (!isPending) {
      setIsSlow(false)
      return
    }
    const id = setTimeout(() => setIsSlow(true), delayMs)
    return () => clearTimeout(id)
  }, [isPending, delayMs])

  return isSlow
}
