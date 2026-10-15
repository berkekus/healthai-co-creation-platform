import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '../i18n'
import SlotListEditor, { hasTooEarlySlot, type SlotDraft } from '../components/meetings/SlotListEditor'

const slot = (date: string): SlotDraft => ({ key: 1, date, hour: '10', minute: '00' })

describe('SlotListEditor — typed-in past dates', () => {
  it('flags a date before the earliest allowed one', () => {
    render(<SlotListEditor drafts={[slot('2023-05-01')]} onChange={() => {}} minDate="2026-10-16" />)

    expect(screen.getByRole('alert')).toHaveTextContent('This date has passed')
    expect(screen.getByLabelText('Date')).toHaveAttribute('aria-invalid', 'true')
  })

  it('accepts the earliest allowed date', () => {
    render(<SlotListEditor drafts={[slot('2026-10-16')]} onChange={() => {}} minDate="2026-10-16" />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('lets the forms block sending while any slot is too early', () => {
    expect(hasTooEarlySlot([slot('2026-10-20'), { ...slot('2023-05-01'), key: 2 }], '2026-10-16')).toBe(true)
    expect(hasTooEarlySlot([slot('2026-10-20'), { ...slot(''), key: 2 }], '2026-10-16')).toBe(false)
  })
})
