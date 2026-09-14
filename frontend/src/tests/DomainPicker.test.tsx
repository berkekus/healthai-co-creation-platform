import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '../i18n'
import DomainPicker from '../components/posts/DomainPicker'

describe('DomainPicker', () => {
  it('adds a domain when its box is ticked', () => {
    const onChange = vi.fn()
    render(<DomainPicker value={[]} onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Midwifery' }))

    expect(onChange).toHaveBeenCalledWith(['Midwifery'])
  })

  it('keeps earlier choices first when another domain is added', () => {
    const onChange = vi.fn()
    render(<DomainPicker value={['Nursing']} onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Maternal & Newborn Health' }))

    expect(onChange).toHaveBeenCalledWith(['Nursing', 'Maternal & Newborn Health'])
  })

  it('removes a domain from its chip', () => {
    const onChange = vi.fn()
    render(<DomainPicker value={['Nursing', 'Midwifery']} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove Nursing' }))

    expect(onChange).toHaveBeenCalledWith(['Midwifery'])
  })

  it('stops at three domains but still lets a chosen one be unticked', () => {
    render(<DomainPicker value={['Nursing', 'Midwifery', 'Pediatrics']} onChange={() => {}} />)

    expect(screen.getByRole('checkbox', { name: 'Oncology' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Midwifery' })).toBeEnabled()
  })

  it('narrows the list to the search text', () => {
    render(<DomainPicker value={[]} onChange={() => {}} />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'midw' } })

    expect(screen.getByRole('checkbox', { name: 'Midwifery' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Cardiology' })).not.toBeInTheDocument()
  })
})
