import { describe, it, expect } from 'vitest'
import html from '../../index.html?raw'

// Files served from the site root; the glob only lists names, nothing is loaded.
const publicFiles = Object.keys(import.meta.glob('../../public/*')).map(path => path.replace('../../public', ''))

function iconLinks() {
  return [...html.matchAll(/<link\b[^>]*\brel="(icon|apple-touch-icon)"[^>]*>/g)].map(match => {
    const href = /\bhref="([^"]+)"/.exec(match[0])?.[1] ?? ''
    return { rel: match[1], href }
  })
}

// Without an icon link the browser asks for /favicon.ico and gets a 404.
describe('favicon', () => {
  it('declares an SVG icon, a favicon.ico fallback and an Apple touch icon', () => {
    const hrefs = iconLinks().map(link => link.href)
    expect(hrefs).toEqual(expect.arrayContaining(['/favicon.svg', '/favicon.ico', '/apple-touch-icon.png']))
  })

  it('ships every icon the page links to', () => {
    const missing = iconLinks().filter(link => !publicFiles.includes(link.href))
    expect(missing).toEqual([])
  })
})
