import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FilterCombobox from '../components/ui/FilterCombobox'

const groups = [
  { label: 'Clinical', options: [{ value: 'Cardiology', label: 'Cardiology' }, { value: 'Neurology', label: 'Neurology' }] },
  { label: 'Care', options: [{ value: 'Midwifery', label: 'Midwifery' }, { value: 'Ergoterapi', label: 'Ergoterapi İş Uğraşı' }] },
]

function renderCombo(value = '', onChange = vi.fn()) {
  render(
    <>
      <span id="domain-label">Domain</span>
      <FilterCombobox
        labelledBy="domain-label"
        value={value}
        onChange={onChange}
        allLabel="All domains"
        groups={groups}
        searchPlaceholder="Search domains…"
        noResults={query => `No results for "${query}"`}
      />
    </>,
  )
  return onChange
}

describe('FilterCombobox', () => {
  it('shows the current choice and opens a grouped list', () => {
    renderCombo('Neurology')
    const trigger = screen.getByRole('button', { name: 'Domain Neurology' })
    fireEvent.click(trigger)

    expect(screen.getByRole('group', { name: 'Clinical' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Neurology' })).toHaveAttribute('aria-selected', 'true')
  })

  it('narrows the list as you type, ignoring accents', () => {
    renderCombo()
    fireEvent.click(screen.getByRole('button', { name: /Domain/ }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'is ugrasi' } })

    expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual(['Ergoterapi İş Uğraşı'])
  })

  it('says so when nothing matches', () => {
    renderCombo()
    fireEvent.click(screen.getByRole('button', { name: /Domain/ }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } })

    expect(screen.getByText('No results for "zzz"')).toBeInTheDocument()
  })

  it('can be used from the keyboard', () => {
    const onChange = renderCombo()
    fireEvent.click(screen.getByRole('button', { name: /Domain/ }))
    const search = screen.getByRole('combobox')

    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    expect(search).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Neurology' }).id)

    fireEvent.keyDown(search, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('Neurology')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('offers "all" to clear the choice and closes on Escape', () => {
    const onChange = renderCombo('Midwifery')
    fireEvent.click(screen.getByRole('button', { name: /Domain/ }))
    fireEvent.click(screen.getByRole('option', { name: 'All domains' }))
    expect(onChange).toHaveBeenCalledWith('')

    fireEvent.click(screen.getByRole('button', { name: /Domain/ }))
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
