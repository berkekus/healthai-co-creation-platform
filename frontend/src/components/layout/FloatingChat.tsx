import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Send, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'
import { useConversationStore } from '../../store/conversationStore'
import type { Conversation, Message } from '../../types/conversation.types'

function initials(name?: string) {
  return name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || '??'
}

function compactTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function partnerFor(conv: Conversation, userId?: string) {
  return conv.participantDetails.find(participant => participant.userId !== userId)
}

export default function FloatingChat() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const {
    conversations,
    messages,
    unreadCount,
    isLoading,
    fetchConversations,
    fetchMessages,
    fetchUnreadCount,
    markRead,
    sendMessage,
  } = useConversationStore()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selected = conversations.find(conv => conv.id === selectedId)
  const selectedMessages = selectedId ? messages[selectedId] ?? [] : []
  const partner = selected ? partnerFor(selected, user?.id) : undefined

  useEffect(() => {
    if (!user) return
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount, user])

  useEffect(() => {
    if (!open || !user) return
    fetchConversations()
  }, [fetchConversations, open, user])

  useEffect(() => {
    if (!selectedId) return
    fetchMessages(selectedId)
    markRead(selectedId)
  }, [fetchMessages, markRead, selectedId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedMessages.length, selectedId])

  if (!user) return null

  const handleOpenConversation = (conv: Conversation) => {
    setSelectedId(conv.id)
    setText('')
  }

  const handleSend = async () => {
    if (!selectedId || !text.trim() || sending) return
    const content = text.trim()
    setSending(true)
    setText('')
    try {
      await sendMessage(selectedId, content)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[80] flex flex-col items-end gap-3">
      {open && (
        <section className="w-[calc(100vw-2rem)] max-w-[380px] overflow-hidden rounded-[24px] border border-[#E3E7EC] bg-white shadow-[0_28px_90px_-34px_rgba(45,24,56,0.48)]">
          <header className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#E3E7EC] px-4 py-3">
            {selected ? (
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E3E7EC] text-[#6F6878] transition hover:bg-[#F3F4F6]"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#36213E] text-xs font-black text-[#B8F3FF]">
                  {initials(partner?.name)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-[#36213E]">{partner?.name ?? t('messagesPage.title')}</div>
                  <div className="truncate text-xs font-semibold text-[#6F6878]">{selected.postTitle}</div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-sm font-black text-[#36213E]">
                  <MessageSquare size={16} />
                  {t('messagesPage.title')}
                </div>
                <div className="mt-0.5 text-xs font-semibold text-[#6F6878]">
                  {t('messagesPage.count', { count: conversations.length })}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6F6878] transition hover:bg-[#F3F4F6] hover:text-[#36213E]"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </header>

          {selected ? (
            <>
              <div className="h-[310px] overflow-y-auto bg-[#F8FAFC] px-4 py-4">
                {selectedMessages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageSquare size={34} className="text-[#C5C0CC]" />
                    <p className="mt-3 text-sm font-black text-[#36213E]">{t('messagesPage.noMessages')}</p>
                    <p className="mt-1 text-xs font-semibold text-[#6F6878]">{t('messagesPage.startConv')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {selectedMessages.map(message => (
                      <CompactMessage key={message.id} message={message} isMine={message.senderId === user.id} />
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-[#E3E7EC] bg-white p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={text}
                    onChange={event => setText(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={t('messagesPage.placeholder')}
                    className="max-h-[96px] min-h-[44px] flex-1 resize-none rounded-[14px] border border-[#E3E7EC] bg-[#F8FAFC] px-3 py-3 text-sm font-semibold text-[#36213E] outline-none transition focus:border-[#8AC6D0] focus:ring-2 focus:ring-[#8AC6D0]/20"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#36213E] text-white shadow-[0_12px_24px_-16px_rgba(45,24,56,0.7)] transition hover:bg-[#24162B] disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label="Send message"
                  >
                    {sending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="max-h-[390px] overflow-y-auto">
              {isLoading && conversations.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#36213E]/20 border-t-[#36213E]" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <MessageSquare size={36} className="mx-auto text-[#C5C0CC]" />
                  <p className="mt-3 text-sm font-black text-[#36213E]">{t('messagesPage.empty')}</p>
                  <p className="mt-2 text-xs font-semibold text-[#6F6878]">{t('messagesPage.emptyDesc')}</p>
                </div>
              ) : (
                conversations.map(conv => {
                  const itemPartner = partnerFor(conv, user.id)
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleOpenConversation(conv)}
                      className="flex w-full items-center gap-3 border-b border-[#E3E7EC] px-4 py-3 text-left transition last:border-0 hover:bg-[#F8FAFC]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#36213E] text-xs font-black text-[#B8F3FF]">
                        {initials(itemPartner?.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-black text-[#36213E]">{itemPartner?.name ?? 'Unknown'}</span>
                          <span className="shrink-0 text-xs font-semibold text-[#9F9AAA]">{compactTime(conv.lastMessageAt)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-semibold text-[#6F6878]">{conv.postTitle}</p>
                        {conv.lastMessagePreview && (
                          <p className="mt-0.5 truncate text-xs text-[#9F9AAA]">{conv.lastMessagePreview}</p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
              <div className="border-t border-[#E3E7EC] px-4 py-3">
                <Link to={ROUTES.MESSAGES} onClick={() => setOpen(false)} className="text-sm font-black text-[#1B7A88] transition hover:text-[#36213E]">
                  {t('common.viewAll')}
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#36213E] text-white shadow-[0_18px_40px_-18px_rgba(45,24,56,0.85)] transition hover:-translate-y-0.5 hover:bg-[#24162B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8AC6D0]/70 focus-visible:ring-offset-2"
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
      >
        {open ? <X size={20} /> : <MessageSquare size={21} />}
        {unreadCount > 0 && !open && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-[#8AC6D0] px-1.5 font-mono text-xs font-black text-[#36213E]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

function CompactMessage({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-[18px] px-3.5 py-2.5 text-sm font-semibold leading-relaxed shadow-sm ${
          isMine
            ? 'rounded-br-[5px] border border-[#8AC6D0] bg-[#DFF8FF] text-[#172033]'
            : 'rounded-bl-[5px] border border-[#E3E7EC] bg-white text-[#36213E]'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
