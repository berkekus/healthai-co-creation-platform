import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { MessageSquare, Clock, Trash2 } from 'lucide-react'
import { useConversationStore } from '../../store/conversationStore'
import { useAuthStore } from '../../store/authStore'
import type { Conversation } from '../../types/conversation.types'

export default function ConversationsPage() {
  const { user } = useAuthStore()
  const { conversations, isLoading, fetchConversations, getByMeetingId, deleteConversation } = useConversationStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const meetingIdParam = searchParams.get('meetingId')

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Auto-navigate if meetingId query param is present
  useEffect(() => {
    if (!meetingIdParam || conversations.length === 0) return
    const conv = getByMeetingId(meetingIdParam)
    if (conv) navigate(`/messages/${conv.id}`, { replace: true })
  }, [meetingIdParam, conversations, getByMeetingId, navigate])

  if (isLoading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2d1838]/20 border-t-[#2d1838] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <section className="mx-auto w-full max-w-[860px] px-6 pb-20 pt-[72px] md:px-10">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e8e8ee] bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#2d1838] shadow-[0_10px_30px_-24px_rgba(45,24,56,0.5)]">
            <MessageSquare size={12} />
            {conversations.length} conversations
          </div>
          <h1 className="mt-5 font-headline text-[52px] font-black leading-[0.98] tracking-normal text-[#2d1838] md:text-[68px]">
            Messages<span className="text-[#55c7df]">.</span>
          </h1>
          <p className="mt-4 max-w-[520px] text-[16px] leading-7 text-[#6f6a76]">
            Collaborate privately with your partner after a meeting is confirmed.
          </p>
        </div>

        {/* List */}
        {conversations.length === 0 ? (
          <div className="rounded-[24px] border border-[#e8e8ee] bg-white p-16 text-center shadow-[0_24px_70px_-54px_rgba(45,24,56,0.4)]">
            <MessageSquare size={40} className="mx-auto text-[#c5c0cc] mb-4" />
            <p className="font-headline text-[20px] font-extrabold text-[#2d1838]">No conversations yet</p>
            <p className="mt-2 text-[14px] text-[#6f6a76]">
              Conversations open automatically when a meeting request is accepted.
            </p>
          </div>
        ) : (
          <div className="rounded-[24px] border border-[#e8e8ee] bg-white shadow-[0_24px_70px_-54px_rgba(45,24,56,0.4)] overflow-hidden">
            {conversations.map((conv, i) => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                userId={user?.id ?? ''}
                isLast={i === conversations.length - 1}
                onClick={() => navigate(`/messages/${conv.id}`)}
                onDelete={deleteConversation}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function ConversationRow({
  conv,
  userId,
  isLast,
  onClick,
  onDelete,
}: {
  conv: Conversation
  userId: string
  isLast: boolean
  onClick: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const partner = conv.participantDetails.find(p => p.userId !== userId)
  const initials = partner
    ? partner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'
  const timeAgo = formatTimeAgo(conv.lastMessageAt)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleting(true)
    await onDelete(conv.id).catch(() => setDeleting(false))
  }

  return (
    <div
      className={`flex items-center gap-4 px-6 py-5 hover:bg-[#f8f7fa] transition-colors group ${
        isLast ? '' : 'border-b border-[#e8e8ee]'
      }`}
    >
      {/* Clickable area */}
      <button onClick={onClick} className="flex items-center gap-4 flex-1 min-w-0 text-left">
        <div className="w-12 h-12 rounded-full bg-[#2d1838] text-[#8fdff0] font-black text-[13px] flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="font-headline font-extrabold text-[15px] text-[#2d1838] truncate">
              {partner?.name ?? 'Unknown'}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#9f9aaa] font-semibold shrink-0">
              <Clock size={11} />
              {timeAgo}
            </span>
          </div>
          <p className="text-[13px] text-[#6f6a76] font-semibold truncate">{conv.postTitle}</p>
          {conv.lastMessagePreview && (
            <p className="text-[12px] text-[#9f9aaa] truncate mt-0.5">{conv.lastMessagePreview}</p>
          )}
        </div>
      </button>

      {/* Delete controls */}
      <div className="shrink-0 flex items-center gap-2">
        {!confirm ? (
          <button
            onClick={e => { e.stopPropagation(); setConfirm(true) }}
            title="Delete conversation"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#d0ccd8] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={14} />
          </button>
        ) : (
          <>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-7 px-2.5 rounded-full bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? '…' : 'Delete'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirm(false) }}
              className="h-7 px-2.5 rounded-full border border-[#e8e8ee] text-[11px] font-bold text-[#6f6a76] hover:bg-[#f5f6f8] transition-colors"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
