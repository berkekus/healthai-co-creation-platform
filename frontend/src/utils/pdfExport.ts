// jsPDF is imported dynamically inside each export function to prevent
// jspdf.node.min.js from running Node.js-specific side-effects at module
// evaluation time, which crashes the browser bundle on import.
import i18n from '../i18n'

interface PostData {
  title: string
  domain: string
  description: string
  authorName: string
  authorRole: string
  projectStage: string
  collaborationType: string
  levelOfCommitment?: string
  city: string
  country: string
  expiryDate: string
  expertiseRequired: string
}

interface SummaryData {
  postTitle: string
  topics: string[]
  nextSteps: string[]
  openQuestions: string[]
  generatedAt: string
}

const COMMITMENT_KEYS: Record<string, string> = {
  flexible: 'posts.form.commitmentFlexible',
  low: 'posts.form.commitmentLow',
  medium: 'posts.form.commitmentMedium',
  high: 'posts.form.commitmentHigh',
}

// jsPDF's built-in Helvetica only covers Latin-1, so ğ, ş, ı, İ, Ğ and Ş came out
// as garbage (a Turkish author name was unreadable). Source Sans 3, the site's body
// font, covers them; it is fetched only when someone exports a PDF.
const PDF_FONT = 'SourceSans3'
const FONT_FILES = [
  { style: 'normal', url: '/fonts/SourceSans3-Regular.ttf' },
  { style: 'bold', url: '/fonts/SourceSans3-Bold.ttf' },
] as const

let fontData: Promise<string[] | null> | null = null

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function loadFontData(): Promise<string[] | null> {
  fontData ??= Promise.all(FONT_FILES.map(async ({ url }) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`font ${url}: ${res.status}`)
    return toBase64(await res.arrayBuffer())
  })).catch(() => {
    fontData = null // try again next time
    return null
  })
  return fontData
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createDoc(): Promise<{ doc: any; font: string }> {
  const { default: jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const data = await loadFontData()
  if (!data) return { doc, font: 'helvetica' } // offline: still export, without Turkish letters
  FONT_FILES.forEach(({ style }, index) => {
    const file = `${PDF_FONT}-${style}.ttf`
    doc.addFileToVFS(file, data[index])
    doc.addFont(file, PDF_FONT, style)
  })
  return { doc, font: PDF_FONT }
}

const formatDate = (value: string | Date) => new Date(value).toLocaleDateString(i18n.language)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addHeader(doc: any, font: string, title: string) {
  doc.setFillColor(54, 33, 62)
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont(font, 'bold')
  doc.text('HEALTH AI Co-Creation Platform', 10, 11)
  doc.setFontSize(8)
  doc.setFont(font, 'normal')
  doc.text(formatDate(new Date()), 200, 11, { align: 'right' })
  doc.setTextColor(54, 33, 62)
  doc.setFontSize(16)
  doc.setFont(font, 'bold')
  doc.text(title, 10, 32)
  doc.setDrawColor(111, 184, 196)
  doc.setLineWidth(0.5)
  doc.line(10, 35, 200, 35)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addField(doc: any, font: string, label: string, value: string, y: number): number {
  doc.setFontSize(8)
  doc.setFont(font, 'bold')
  doc.setTextColor(111, 131, 120)
  doc.text(label.toLocaleUpperCase(i18n.language), 10, y)
  doc.setFontSize(10)
  doc.setFont(font, 'normal')
  doc.setTextColor(54, 33, 62)
  const lines = doc.splitTextToSize(value, 185)
  doc.text(lines, 10, y + 5)
  return y + 5 + (lines.length * 5) + 4
}

const fileSlug = (title: string) => title.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)

export async function exportPostToPdf(post: PostData): Promise<void> {
  const t = i18n.t.bind(i18n)
  const { doc, font } = await createDoc()
  addHeader(doc, font, post.title)

  let y = 42
  y = addField(doc, font, t('pdf.author'), `${post.authorName} (${t(`common.role.${post.authorRole}`, { defaultValue: post.authorRole })})`, y)
  y = addField(doc, font, t('posts.form.domains'), post.domain, y)
  y = addField(doc, font, t('posts.form.expertise'), post.expertiseRequired, y)
  y = addField(doc, font, t('posts.form.stage'), t(`posts.stage.${post.projectStage}`, { defaultValue: post.projectStage }), y)
  y = addField(doc, font, t('posts.form.collab'), t(`posts.collab.${post.collaborationType}`, { defaultValue: post.collaborationType }), y)
  y = addField(doc, font, t('posts.form.commitment'), t(COMMITMENT_KEYS[post.levelOfCommitment ?? 'flexible'] ?? COMMITMENT_KEYS.flexible), y)
  y = addField(doc, font, t('pdf.location'), `${post.city}, ${post.country}`, y)
  y = addField(doc, font, t('posts.form.expiry'), formatDate(post.expiryDate), y)
  y += 3
  addField(doc, font, t('posts.form.description'), post.description, y)

  doc.setFontSize(7)
  doc.setFont(font, 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text(t('pdf.generatedBy'), 105, 290, { align: 'center' })

  doc.save(`healthai-post-${fileSlug(post.title)}.pdf`)
}

export async function exportSummaryToPdf(summary: SummaryData): Promise<void> {
  const t = i18n.t.bind(i18n)
  const { doc, font } = await createDoc()
  addHeader(doc, font, t('pdf.summaryTitle', { title: summary.postTitle }))

  let y = 42
  doc.setFontSize(8)
  doc.setFont(font, 'normal')
  doc.setTextColor(111, 131, 120)
  doc.text(`${t('meetings.summaryGenerated')} ${formatDate(summary.generatedAt)}`, 10, y)
  y += 8

  const addBulletSection = (title: string, items: string[], bulletColor: [number, number, number]) => {
    if (items.length === 0) return
    doc.setFontSize(10)
    doc.setFont(font, 'bold')
    doc.setTextColor(54, 33, 62)
    doc.text(title, 10, y)
    y += 6
    items.forEach(item => {
      doc.setFillColor(...bulletColor)
      doc.circle(13, y - 1, 1, 'F')
      doc.setFontSize(9)
      doc.setFont(font, 'normal')
      doc.setTextColor(55, 65, 81)
      const lines = doc.splitTextToSize(item, 178)
      doc.text(lines, 16, y)
      y += lines.length * 5 + 2
    })
    y += 4
  }

  addBulletSection(t('meetings.summaryTopics'), summary.topics, [111, 184, 196])
  addBulletSection(t('meetings.summaryNextSteps'), summary.nextSteps, [74, 222, 128])
  addBulletSection(t('meetings.summaryOpenQuestions'), summary.openQuestions, [251, 191, 36])

  doc.setFontSize(7)
  doc.setFont(font, 'normal')
  doc.setTextColor(180, 180, 180)
  doc.text(t('pdf.aiFooter'), 105, 290, { align: 'center' })

  doc.save(`healthai-meeting-summary-${fileSlug(summary.postTitle)}.pdf`)
}
