import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import ScrollToTop from '../router/ScrollToTop'

function Back() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>back</button>
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ScrollToTop />
      <Routes>
        <Route path="/posts" element={<><Link to="/posts/1">open post</Link><Link to="/posts?sort=new">sort</Link></>} />
        <Route path="/posts/1" element={<Back />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ScrollToTop', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  })

  it('opens a linked page at the top', () => {
    renderAt('/posts')
    vi.mocked(window.scrollTo).mockClear()

    fireEvent.click(screen.getByText('open post'))
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('keeps the position when only the query changes', () => {
    renderAt('/posts')
    vi.mocked(window.scrollTo).mockClear()

    fireEvent.click(screen.getByText('sort'))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('leaves back navigation to the browser', () => {
    renderAt('/posts')
    fireEvent.click(screen.getByText('open post'))
    vi.mocked(window.scrollTo).mockClear()

    fireEvent.click(screen.getByText('back'))
    expect(window.scrollTo).not.toHaveBeenCalled()
  })
})
