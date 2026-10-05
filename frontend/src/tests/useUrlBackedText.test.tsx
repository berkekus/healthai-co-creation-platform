import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useUrlBackedText } from '../hooks/useUrlBackedText'

function Field({ urlValue, write }: { urlValue: string; write: (value: string) => void }) {
  const [text, setText] = useUrlBackedText(urlValue, write)
  return <input aria-label="search" value={text} onChange={e => setText(e.target.value)} />
}

const box = () => screen.getByRole('textbox', { name: 'search' }) as HTMLInputElement

describe('useUrlBackedText', () => {
  it('keeps every keystroke while the URL has not caught up yet', () => {
    // React Router applies URL changes in a transition, so the URL can lag behind the keyboard.
    const write = vi.fn()
    render(<Field urlValue="" write={write} />)
    for (const value of ['c', 'ca', 'car']) fireEvent.change(box(), { target: { value } })
    expect(box().value).toBe('car')
    expect(write.mock.calls.map(c => c[0])).toEqual(['c', 'ca', 'car'])
  })

  it('does not rewind when its own earlier write reaches the URL late', () => {
    const write = vi.fn()
    const { rerender } = render(<Field urlValue="" write={write} />)
    fireEvent.change(box(), { target: { value: 'ca' } })
    fireEvent.change(box(), { target: { value: 'car' } })
    rerender(<Field urlValue="ca" write={write} />)
    expect(box().value).toBe('car')
  })

  it('follows the URL when something else changes it, such as Clear filters', () => {
    const write = vi.fn()
    const { rerender } = render(<Field urlValue="" write={write} />)
    fireEvent.change(box(), { target: { value: 'car' } })
    rerender(<Field urlValue="car" write={write} />)
    rerender(<Field urlValue="" write={write} />)
    expect(box().value).toBe('')
  })

  it('starts from the URL, e.g. a shared link', () => {
    render(<Field urlValue="sepsis" write={vi.fn()} />)
    expect(box().value).toBe('sepsis')
  })
})
