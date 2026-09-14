import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import Footer from '../components/layout/Footer'
import LandingFooter from '../components/layout/LandingFooter'
import CookieConsentBanner from '../components/ui/CookieConsentBanner'
import LanguageToggle from '../components/ui/LanguageToggle'
import FloatingChat from '../components/layout/FloatingChat'
import { useAuthStore } from '../store/authStore'
import { useConversationStore } from '../store/conversationStore'

vi.mock('../lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
vi.mock('../lib/socket', () => ({ connectSocket: vi.fn(), disconnectSocket: vi.fn(), getSocket: vi.fn() }))

// Everything around the pages — footers, the cookie banner, the language menu
// and the chat bubble — used to stay English on Turkish screens.
describe('site chrome in Turkish', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('tr')
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
    localStorage.clear()
  })

  it('translates the app footer but keeps the Erasmus+ grant statement as issued', () => {
    render(<MemoryRouter><Footer /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Hakkında' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gizlilik Politikası' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'KVKK / GDPR Hakları' })).toBeInTheDocument()
    expect(screen.getByText(/hasta verisi yok/)).toBeInTheDocument()
    expect(screen.getByText(/This platform is funded by the Erasmus\+ KA220 HED Project/)).toBeInTheDocument()
  })

  it('translates the landing page footer', () => {
    render(<MemoryRouter><LandingFooter /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'İletişim' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Yasal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Klinisyenler için' })).toBeInTheDocument()
    expect(screen.getByText(/Dosya yükleme yok/)).toBeInTheDocument()
  })

  it('asks for cookie consent in Turkish', () => {
    render(<MemoryRouter><CookieConsentBanner /></MemoryRouter>)
    const banner = screen.getByRole('dialog', { name: 'Çerez onayı' })
    expect(within(banner).getByRole('button', { name: 'Yalnızca zorunlu' })).toBeInTheDocument()
    expect(within(banner).getByRole('button', { name: 'Tümünü kabul et' })).toBeInTheDocument()
    expect(within(banner).getByRole('link', { name: 'Gizlilik politikası' })).toBeInTheDocument()
  })

  it('names the language menu in the current language', () => {
    render(<LanguageToggle />)
    fireEvent.click(screen.getByRole('button', { name: 'Dili değiştir' }))
    expect(screen.getByRole('listbox', { name: 'Dil seçenekleri' })).toBeInTheDocument()
  })

  it('labels the chat bubble and its controls in Turkish', () => {
    useAuthStore.setState({
      user: {
        id: 'ana', name: 'Ana Costa', email: 'ana@ulisboa.pt', role: 'healthcare_professional', institution: 'ULisboa',
        city: 'Lisbon', country: 'Portugal', expertiseTags: [], createdAt: '', isVerified: true, isSuspended: false, lastActive: '',
      },
      isAuthenticated: true,
    })
    useConversationStore.setState({
      conversations: [{
        id: 'c1', meetingId: 'm1', postId: 'p1', postTitle: 'Postpartum early warning', participants: ['ana', 'gone'],
        participantDetails: [{ userId: 'ana', name: 'Ana Costa', role: 'healthcare_professional' }],
        lastMessageAt: new Date().toISOString(), lastMessagePreview: 'Merhaba', createdAt: '', updatedAt: '',
      }],
      messages: {},
      unreadCount: 0,
      isLoading: false,
      fetchConversations: vi.fn(),
      fetchMessages: vi.fn(),
      fetchUnreadCount: vi.fn(),
      markRead: vi.fn(),
      sendMessage: vi.fn(),
    } as never)

    render(<MemoryRouter><FloatingChat /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Sohbeti aç' }))

    expect(screen.getAllByRole('button', { name: 'Sohbeti kapat' }).length).toBeGreaterThan(0)
    expect(screen.getByText('Bilinmeyen üye')).toBeInTheDocument()
    expect(screen.getByText('Şimdi')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Postpartum early warning'))
    expect(screen.getByRole('button', { name: 'Sohbetlere dön' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mesajı gönder' })).toBeInTheDocument()
  })
})
