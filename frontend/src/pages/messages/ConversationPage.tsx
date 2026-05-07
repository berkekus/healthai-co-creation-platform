import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'
import { useConversationStore } from '../../store/conversationStore'
import { useAuthStore } from '../../store/authStore'
import type { Message } from '../../types/conversation.types'

const POLL_INTERVAL = 8000

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    conversations,
    messages,
    fetchConversations,
    fetchMessages,
    sendMessage,
    markRead,
    deleteConversation,
  } = useConversationStore()

  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const conv = conversations.find(c => c.id === id)
  const msgs: Message[] = messages[id ?? ''] ?? []
  const partner = conv?.participantDetails.find(p => p.userId !== user?.id)

  useEffect(() => {
    if (conversations.length === 0) fetchConversations()
  }, [fetchConversations, conversations.length])

  useEffect(() => {
    if (!id) return
    fetchMessages(id)
    markRead(id)
    pollRef.current = setInterval(() => fetchMessages(id), POLL_INTERVAL)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id, fetchMessages, markRead])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs.length])

  const handleSend = async () => {
    if (!id || !text.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      await sendMessage(id, text.trim())
      setText('')
      textareaRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await deleteConversation(id)
      navigate('/messages', { replace: true })
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] flex flex-col">

      {/* Top bar */}
      <div className="sticky top-[76px] z-10 bg-white border-b border-[#e8e8ee] px-6 md:px-10 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/messages')}
          className="w-9 h-9 rounded-full border border-[#e8e8ee] flex items-center justify-center text-[#6f6a76] hover:bg-[#f5f6f8] transition-colors shrink-0"
        >
          <ArrowLeft size={16} />
        </button>

        {partner ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#2d1838] text-[#8fdff0] font-black text-[12px] flex items-center justify-center shrink-0">
              {partner.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-headline font-extrabold text-[15px] text-[#2d1838] truncate">{partner.name}</p>
              <p className="text-[11px] text-[#9f9aaa] font-semibold capitalize">{partner.role.replace('_', ' ')}</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 h-10 w-40 bg-[#f0f1f4] rounded-lg animate-pulse" />
        )}

        {conv && (
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9f9aaa] hidden sm:block truncate max-w-[200px]">
            {conv.postTitle}
          </p>
        )}

        {/* Delete button */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete conversation"
            className="w-9 h-9 rounded-full border border-[#e8e8ee] flex items-center justify-center text-[#c5c0cc] hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 size={15} />
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#6f6a76] hidden sm:inline">Delete conversation?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="h-8 px-3 rounded-full bg-red-500 text-white text-[12px] font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="h-8 px-3 rounded-full border border-[#e8e8ee] text-[12px] font-bold text-[#6f6a76] hover:bg-[#f5f6f8] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-6 md:px-10 py-8 mx-auto w-full max-w-[860px]">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-headline text-[18px] font-extrabold text-[#2d1838]">No messages yet</p>
            <p className="mt-2 text-[14px] text-[#6f6a76]">Start the conversation. Say hello!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {msgs.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.senderId === user?.id}
                showName={i === 0 || msgs[i - 1].senderId !== msg.senderId}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="sticky bottom-0 bg-white border-t border-[#e8e8ee] px-6 md:px-10 py-4">
        <div className="mx-auto w-full max-w-[860px]">
          {error && (
            <p className="mb-2 text-[12px] text-red-600 font-semibold">{error}</p>
          )}
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
              className="flex-1 resize-none rounded-[16px] border border-[#e8e8ee] bg-[#f8f7fa] px-4 py-3 text-[14px] font-body text-[#2d1838] placeholder:text-[#b5b0be] outline-none focus:border-[#55c7df] focus:ring-2 focus:ring-[#55c7df]/20 transition-all max-h-[160px] overflow-y-auto"
              onInput={e => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 160) + 'px'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="w-12 h-12 rounded-full bg-[#2d1838] text-white flex items-center justify-center hover:bg-[#1b1022] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_8px_20px_-10px_rgba(45,24,56,0.7)] shrink-0"
              aria-label="Send message"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send size={16} />
              }
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

function MessageBubble({
  msg,
  isMine,
  showName,
}: {
  msg: Message
  isMine: boolean
  showName: boolean
}) {
  const time = new Date(msg.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      {showName && !isMine && (
        <span className="text-[11px] font-bold text-[#9f9aaa] mb-1 px-1">{msg.senderName}</span>
      )}
      <div
        className={`max-w-[70%] px-4 py-3 rounded-[18px] text-[14px] leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
          isMine
            ? 'bg-[#dff8ff] text-[#1a2535] border border-[#8fdff0] rounded-br-[4px]'
            : 'bg-white text-[#2d1838] border border-[#e8e8ee] rounded-bl-[4px]'
        }`}
      >
        {msg.content}
      </div>
      <span className="text-[10px] text-[#b5b0be] mt-1 px-1">{time}</span>
    </div>
  )
}
