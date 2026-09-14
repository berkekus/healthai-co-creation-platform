import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import i18n from '../i18n'
import ExpressInterestModal from '../components/meetings/ExpressInterestModal'
import { useAuthStore } from '../store/authStore'
import { useMeetingStore } from '../store/meetingStore'
import type { Post } from '../types/post.types'

vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn() }))

const post: Post = {
  id: 'post-1',
  title: 'Midwife-led postpartum monitoring',
  authorId: 'owner-1',
  authorName: 'Ana Costa',
  authorRole: 'healthcare_professional',
  domain: 'Midwifery',
  domains: ['Midwifery'],
  expertiseRequired: 'Signal processing',
  description: 'We want to detect postpartum haemorrhage risk early from wearable data.',
  projectStage: 'concept_validation',
  collaborationType: 'research_partner',
  confidentiality: 'public_pitch',
  city: 'Lisbon',
  country: 'Portugal',
  expiryDate: '2027-01-01T00:00:00.000Z',
  status: 'active',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  interestCount: 0,
  meetingCount: 0,
}

const request = vi.fn()

function renderModal() {
  return render(<ExpressInterestModal post={post} onClose={() => {}} onSuccess={() => {}} />)
}

function goToTimesStep() {
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I build ML models for wearable obstetric data.' } })
  fireEvent.click(screen.getByRole('button', { name: /next/i }))
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: /accept & continue/i }))
}

describe('ExpressInterestModal', () => {
  beforeEach(() => {
    request.mockReset().mockResolvedValue({})
    useMeetingStore.setState({ request })
    useAuthStore.setState({
      user: {
        id: 'engineer-1', name: 'Mert Aydın', email: 'mert@metu.edu.tr', role: 'engineer', institution: 'METU',
        city: 'Ankara', country: 'Turkey', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
      },
    })
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('sends a request with a single proposed time, including its time zone', async () => {
    renderModal()
    goToTimesStep()

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2030-03-14' } })
    fireEvent.change(screen.getByLabelText('Hour'), { target: { value: '14' } })
    fireEvent.click(screen.getByRole('button', { name: /send request/i }))

    await waitFor(() => expect(request).toHaveBeenCalledOnce())
    const [payload] = request.mock.calls[0]
    expect(payload.proposedSlots).toHaveLength(1)
    expect(payload.proposedSlots[0]).toMatchObject({ date: '2030-03-14', time: '14:00' })
    expect(typeof payload.proposedSlots[0].timezone).toBe('string')
  })

  it('offers a 24-hour clock in quarter-hour steps', () => {
    renderModal()
    goToTimesStep()

    const hours = within(screen.getByLabelText('Hour')).getAllByRole('option').map(option => option.textContent)
    const minutes = within(screen.getByLabelText('Minute')).getAllByRole('option').map(option => option.textContent)
    expect(hours).toContain('00')
    expect(hours).toContain('23')
    expect(minutes.filter(minute => minute !== '--')).toEqual(['00', '15', '30', '45'])
  })

  it('labels the hour and minute pickers with their own words only', () => {
    // A label wrapping a <select> makes Chrome read the options too ("Hour --").
    renderModal()
    goToTimesStep()
    for (const name of ['Hour', 'Minute']) {
      const picker = screen.getByLabelText(name) as HTMLSelectElement
      expect(Array.from(picker.labels ?? []).map(label => label.textContent)).toEqual([name])
    }
  })

  it('lets up to five times be proposed', () => {
    renderModal()
    goToTimesStep()

    const add = screen.getByRole('button', { name: /add another time/i })
    for (let i = 0; i < 4; i++) fireEvent.click(add)

    expect(screen.getAllByLabelText('Date')).toHaveLength(5)
    expect(screen.queryByRole('button', { name: /add another time/i })).not.toBeInTheDocument()
  })

  it('speaks the interface language', async () => {
    await i18n.changeLanguage('tr')
    renderModal()
    expect(screen.getByText('Toplantı planla')).toBeInTheDocument()
  })
})
