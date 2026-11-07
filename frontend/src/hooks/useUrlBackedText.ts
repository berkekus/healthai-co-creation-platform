import { useEffect, useRef, useState } from 'react'

/**
 * Text for an input whose value also lives in the URL (?q=…).
 *
 * React Router applies URL changes inside startTransition, so an input that reads its value straight from the
 * URL is a keystroke or more behind; React then resets the field to that stale value and fast typing loses
 * characters. The text is held here instead, so every keystroke shows at once, and is still written to the URL.
 * A URL value this hook did not write (Clear filters, a link, Back) replaces the text; one it did write that
 * arrives late is ignored.
 */
export function useUrlBackedText(urlValue: string, write: (value: string) => void) {
  const [text, setText] = useState(urlValue)
  // Values written to the URL that it has not shown yet, oldest first.
  const pending = useRef<string[]>([])

  useEffect(() => {
    const index = pending.current.indexOf(urlValue)
    if (index >= 0) {
      pending.current = pending.current.slice(index + 1)
      return
    }
    pending.current = []
    setText(urlValue)
  }, [urlValue])

  const change = (value: string) => {
    pending.current.push(value)
    setText(value)
    write(value)
  }

  return [text, change] as const
}
