import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'

interface Comment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorRole: string
  content: string
  parentId: string | null
  createdAt: string
}

interface CommentsResponse {
  comments: Comment[]
  total: number
  page: number
  pages: number
}

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Professional',
  admin: 'Admin',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function CommentsSection({ postId }: { postId: string }) {
  const { t } = useTranslation()
  const user = useAuthStore(s => s.user)
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get<{ success: boolean; data: CommentsResponse }>(
        `/posts/${postId}/comments?page=${p}`
      )
      setComments(p === 1 ? data.data.comments : prev => [...prev, ...data.data.comments])
      setTotal(data.data.total)
      setPage(data.data.page)
      setPages(data.data.pages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const { data } = await api.post<{ success: boolean; data: Comment }>(
        `/posts/${postId}/comments`,
        { content: content.trim(), parentId: replyTo?.id ?? null }
      )
      setComments(prev => [...prev, data.data])
      setTotal(t => t + 1)
      setContent('')
      setReplyTo(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    await api.delete(`/comments/${commentId}`)
    setComments(prev => prev.filter(c => c.id !== commentId))
    setTotal(t => t - 1)
  }

  const topLevel = comments.filter(c => !c.parentId)
  const replies = (parentId: string) => comments.filter(c => c.parentId === parentId)

  return (
    <section className="mt-8">
      <h2 className="mb-5 text-lg font-black text-hai-plum">
        {t('comments.title', 'Discussion')}
        {total > 0 && <span className="ml-2 rounded-full bg-[#E8F4F7] px-2 py-0.5 text-sm font-black text-hai-teal">{total}</span>}
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-6">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#F5F5F7] px-3 py-1.5 text-xs font-semibold text-[#6F6878]">
            <span className="material-symbols-outlined text-sm">reply</span>
            {t('comments.replyingTo', 'Replying to')} <strong>{replyTo.name}</strong>
            <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-[#9CA3AF] hover:text-hai-plum">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-hai-plum text-xs font-black text-hai-mint">
            {user?.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder={t('comments.placeholder', 'Ask a question or leave a comment…')}
              maxLength={500}
              rows={2}
              className="w-full resize-none rounded-xl border border-[#D5DAE0] bg-white px-3 py-2 text-sm font-semibold text-hai-plum placeholder:text-[#9CA3AF] focus:border-hai-plum focus:outline-none focus:ring-2 focus:ring-hai-plum/20"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-[#9CA3AF]">{content.length}/500</span>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="rounded-lg bg-hai-plum px-3 py-1.5 text-xs font-black text-white disabled:opacity-50"
              >
                {submitting ? '…' : t('comments.post', 'Post')}
              </button>
            </div>
            {error && <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
          </div>
        </div>
      </form>

      {/* Comment list */}
      {loading && comments.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-hai-plum/20 border-t-hai-plum" />
        </div>
      ) : topLevel.length === 0 ? (
        <p className="py-6 text-center text-sm font-semibold text-[#9CA3AF]">
          {t('comments.empty', 'No comments yet. Be the first to ask!')}
        </p>
      ) : (
        <ul className="space-y-4">
          {topLevel.map(comment => (
            <li key={comment.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hai-plum text-[10px] font-black text-hai-mint">
                  {comment.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-hai-plum">{comment.authorName}</span>
                    <span className="rounded-full bg-[#E8F4F7] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-hai-teal">
                      {ROLE_LABEL[comment.authorRole] ?? comment.authorRole}
                    </span>
                    <span className="text-xs text-[#9CA3AF]">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#374151]">{comment.content}</p>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setReplyTo({ id: comment.id, name: comment.authorName })}
                      className="text-xs font-black text-[#9CA3AF] hover:text-hai-teal"
                    >
                      {t('comments.reply', 'Reply')}
                    </button>
                    {(user?.id === comment.authorId || user?.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs font-black text-[#9CA3AF] hover:text-red-500"
                      >
                        {t('common.delete', 'Delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {replies(comment.id).length > 0 && (
                <ul className="ml-10 mt-3 space-y-3 border-l-2 border-[#E5E7EB] pl-4">
                  {replies(comment.id).map(reply => (
                    <li key={reply.id} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8F4F7] text-[10px] font-black text-hai-teal">
                        {reply.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-hai-plum">{reply.authorName}</span>
                          <span className="text-[10px] text-[#9CA3AF]">{timeAgo(reply.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold text-[#374151]">{reply.content}</p>
                        {(user?.id === reply.authorId || user?.role === 'admin') && (
                          <button
                            type="button"
                            onClick={() => handleDelete(reply.id)}
                            className="mt-1 text-[10px] font-black text-[#9CA3AF] hover:text-red-500"
                          >
                            {t('common.delete', 'Delete')}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {page < pages && (
        <button
          type="button"
          onClick={() => load(page + 1)}
          disabled={loading}
          className="mt-4 w-full rounded-xl border border-[#D5DAE0] py-2 text-sm font-black text-hai-plum hover:bg-[#F5F5F7] disabled:opacity-50"
        >
          {loading ? '…' : t('comments.loadMore', 'Load more comments')}
        </button>
      )}
    </section>
  )
}
