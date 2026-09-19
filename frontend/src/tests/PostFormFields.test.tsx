import { beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import '../i18n'
import api from '../lib/api'
import PostFormFields from '../components/posts/PostFormFields'
import { createPostCreateSchema, type PostCreateFormData } from '../utils/validators'

vi.mock('../lib/api', () => ({ default: { post: vi.fn() } }))

function Harness() {
  const { t } = useTranslation()
  const form = useForm<PostCreateFormData>({
    resolver: zodResolver(createPostCreateSchema(t)),
    defaultValues: { domains: [], projectStage: 'idea', levelOfCommitment: 'flexible', confidentiality: 'public_pitch' },
  })
  return (
    <PostFormFields
      register={form.register}
      control={form.control}
      setValue={form.setValue}
      errors={form.formState.errors}
      minDateStr="2030-01-01"
    />
  )
}

describe('PostFormFields', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset()
  })

  it('ties every field label to its control', () => {
    render(<Harness />)
    expect(screen.getByLabelText(/^Post title/)).toHaveAttribute('name', 'title')
    expect(screen.getByLabelText(/^Expertise required/)).toHaveAttribute('name', 'expertiseRequired')
    expect(screen.getByLabelText(/^Project summary/)).toHaveAttribute('name', 'description')
    expect(screen.getByRole('combobox', { name: /^Project stage/ })).toHaveAttribute('name', 'projectStage')
    expect(screen.getByRole('combobox', { name: /^Collaboration type/ })).toHaveAttribute('name', 'collaborationType')
    expect(screen.getByRole('combobox', { name: /^Level of commitment/ })).toHaveAttribute('name', 'levelOfCommitment')
    expect(screen.getByRole('group', { name: /^Healthcare domains/ })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: /^Confidentiality level/ })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Listing expiry date/)).toHaveAttribute('name', 'expiryDate')
  })

  it('explains why AI Assist cannot run before anything is written', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: /ai assist/i })).toBeDisabled()
    expect(screen.getByText(/write a title or a description first/i)).toBeInTheDocument()
  })

  it('says AI is not set up, rather than "try again", when the server has no AI configured', async () => {
    vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('Gemini API key is not configured'), { status: 503 }))
    render(<Harness />)

    fireEvent.change(screen.getByPlaceholderText(/glucose monitoring/i), { target: { value: 'Postpartum bleeding alerts' } })
    fireEvent.click(screen.getByRole('button', { name: /ai assist/i }))

    expect(await screen.findByText('AI Assist is not available on this server right now.')).toBeInTheDocument()
  })

  it('describes the project stage that is selected', () => {
    render(<Harness />)
    expect(screen.getByText('An early idea — no data or prototype yet.')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('Idea'), { target: { value: 'pilot' } })

    expect(screen.getByText('It is being tried on a small scale in a real clinical or care setting.')).toBeInTheDocument()
  })

  it('keeps the domains ticked in the picker as the post domains', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Midwifery' }))
    expect(screen.getByRole('button', { name: 'Remove Midwifery' })).toBeInTheDocument()
  })
})
