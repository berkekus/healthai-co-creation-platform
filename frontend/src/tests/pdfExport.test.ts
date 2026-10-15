import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import regularFont from '../../public/fonts/SourceSans3-Regular.ttf?inline'
import boldFont from '../../public/fonts/SourceSans3-Bold.ttf?inline'
import i18n from '../i18n'
import { exportPostToPdf } from '../utils/pdfExport'

// jsPDF sets its methods on each instance, so the test wraps the class to watch them.
const captured = vi.hoisted(() => ({ texts: [] as string[], output: '' }))
vi.mock('jspdf', async (importOriginal) => {
  const { default: RealPdf } = await importOriginal<typeof import('jspdf')>()
  type Pdf = InstanceType<typeof RealPdf>
  class WatchedPdf extends RealPdf {
    constructor(...args: ConstructorParameters<typeof RealPdf>) {
      super(...args)
      const text = this.text.bind(this)
      this.text = ((value: string | string[], ...rest: unknown[]) => {
        captured.texts.push(([] as string[]).concat(value).join(' '))
        return (text as (...a: unknown[]) => Pdf)(value, ...rest)
      }) as Pdf['text']
      this.save = (() => { captured.output = this.output(); return this }) as unknown as Pdf['save']
    }
  }
  return { default: WatchedPdf }
})

const post = {
  title: 'Triage assistant', domain: 'Cardiology', description: 'Description', authorName: 'Ayşe Doğan',
  authorRole: 'engineer', projectStage: 'prototype', collaborationType: 'research_partner', levelOfCommitment: 'low',
  city: 'İzmir', country: 'Türkiye', expiryDate: '2030-01-01T00:00:00.000Z', expertiseRequired: 'Signal processing',
}

const FONTS: Record<string, string> = {
  '/fonts/SourceSans3-Regular.ttf': regularFont,
  '/fonts/SourceSans3-Bold.ttf': boldFont,
}

function serveFonts() {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => fetchDataUrl(FONTS[url])))
}

async function fetchDataUrl(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return new Response(Uint8Array.from(atob(base64), c => c.charCodeAt(0)))
}

describe('exportPostToPdf', () => {
  beforeEach(() => {
    captured.texts = []
    captured.output = ''
  })

  afterEach(async () => {
    vi.unstubAllGlobals()
    await i18n.changeLanguage('en')
  })

  it('embeds a font that has the Turkish letters instead of using Helvetica', async () => {
    serveFonts()
    await exportPostToPdf(post)

    expect(captured.output).toMatch(/\/BaseFont \/SourceSans3/)
    expect(captured.output).toContain('/FontFile2')
  })

  it('labels the fields in the interface language', async () => {
    serveFonts()
    await i18n.changeLanguage('tr')
    await exportPostToPdf(post)

    expect(captured.texts).toContain('YAZAR')
    expect(captured.texts).toContain('Ayşe Doğan (Mühendis)')
  })

  it('still exports when the font cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })))
    await exportPostToPdf(post)

    expect(captured.output).toMatch(/\/BaseFont \/Helvetica/)
  })
})
