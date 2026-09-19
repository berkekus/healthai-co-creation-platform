import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TranslateButton from '../../components/ui/TranslateButton'
import CommentsSection from '../../components/posts/CommentsSection'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { exportPostToPdf } from '../../utils/pdfExport'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Clock,
  FileText,
  Flag,
  Link as LinkIcon,
  Lock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from 'lucide-react'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import ExpressInterestModal from '../../components/meetings/ExpressInterestModal'
import { postEdit, ROUTES } from '../../constants/routes'
import { postDomains } from '../../constants/domains'
import api from '../../lib/api'
import { localDateInputValue } from '../../utils/timeSlots'
import type { Post, PostStatus } from '../../types/post.types'

const COMMITMENT_KEYS = {
  flexible: 'posts.form.commitmentFlexible',
  low: 'posts.form.commitmentLow',
  medium: 'posts.form.commitmentMedium',
  high: 'posts.form.commitmentHigh',
} as const

/** Statuses in which a post still takes meeting requests. */
const OPEN_FOR_REQUESTS: PostStatus[] = ['active', 'meeting_scheduled']
/** Statuses from which the author can close a post with "Partner Found". */
const CLOSABLE: PostStatus[] = ['active', 'meeting_scheduled', 'expired']

export default function PostDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const { posts, getById, fetchPosts, publish, markPartnerFound, reopen } = usePostStore()
  const { getByPost, fetchByUser } = useMeetingStore()
  const [showInterest, setShowInterest] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(() =>
    id ? localStorage.getItem(`saved_post_${id}`) === 'true' : false
  )
  const [fetchedPost, setFetchedPost] = useState<Post | undefined>(undefined)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [dialog, setDialog] = useState<'partnerFound' | 'reopen' | null>(null)
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [newExpiry, setNewExpiry] = useState('')

  const storePost = getById(id ?? '')
  const post = storePost ?? fetchedPost

  useEffect(() => {
    if (!posts.length) fetchPosts({ limit: 100, filters: {} })
  }, [fetchPosts, posts.length])

  useEffect(() => {
    if (user) fetchByUser()
  }, [fetchByUser, user])

  useEffect(() => {
    if (storePost || !id) return
    setIsFetching(true)
    setFetchError(false)
    api.get<{ success: boolean; data: Post & { _id?: string } }>(`/posts/${id}`)
      .then(({ data }) => {
        const raw = data.data
        setFetchedPost({ ...raw, id: raw._id ?? raw.id })
      })
      .catch(() => setFetchError(true))
      .finally(() => setIsFetching(false))
  }, [id, storePost])

  // Comment notifications link to /posts/:id#comments; the router does not scroll to hashes itself.
  const postLoaded = Boolean(post)
  useEffect(() => {
    if (location.hash === '#comments' && postLoaded) {
      document.getElementById('comments')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash, postLoaded])

  const formatDate = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Date(value).toLocaleDateString(i18n.language, options)

  const userMeetings = post ? getByPost(post.id) : []
  const isOwner = !!post && user?.id === post.authorId
  const alreadyRequested = !!user && userMeetings.some(m =>
    m.requesterId === user.id && m.status !== 'cancelled' && m.status !== 'declined',
  )
  const canExpressInterest = !!post && !isOwner && OPEN_FOR_REQUESTS.includes(post.status) && !alreadyRequested
  const canPublish = !!post && isOwner && post.status === 'draft'
  const canMarkFound = !!post && isOwner && CLOSABLE.includes(post.status)
  const canReopen = !!post && isOwner && post.status === 'partner_found'
  const canEdit = !!post && isOwner && (post.status === 'draft' || post.status === 'active')
  const expiredWhileClosed = !!post && new Date(post.expiryDate).getTime() <= Date.now()

  if (isFetching && !post) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-4 sm:px-8 py-20 text-[#36213E]">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#36213E]/20 border-t-[#36213E]" />
        </div>
      </main>
    )
  }

  if (!post || fetchError) {
    return (
      <main className="min-h-screen bg-[#f6f7f9] px-4 sm:px-8 py-20 text-[#36213E]">
        <div className="mx-auto max-w-[760px] rounded-[18px] bg-white p-12 text-center shadow-[0_24px_80px_-68px_rgba(45,24,56,0.75)]">
          <h1 className="text-3xl font-black">
            {fetchError ? t('postDetail.loadFailedTitle') : t('postDetail.notFoundTitle')}
          </h1>
          <p className="mt-3 text-[#6F6878]">
            {fetchError ? t('postDetail.loadFailedDesc') : t('postDetail.notFoundDesc')}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            {fetchError && (
              <button
                onClick={() => window.location.reload()}
                className="rounded-full border border-[#36213E] bg-white px-6 py-3 text-sm font-black text-[#36213E] hover:bg-[#36213E] hover:text-white transition-colors"
              >
                {t('postDetail.tryAgain')}
              </button>
            )}
            <button
              onClick={() => navigate(ROUTES.POSTS)}
              className="rounded-full bg-[#36213E] px-6 py-3 text-sm font-black text-white hover:bg-[#24162B] transition-colors"
            >
              {t('postDetail.backToDirectory')}
            </button>
          </div>
        </div>
      </main>
    )
  }

  const domains = postDomains(post)
  const meta: { label: string; value: string; help?: string; icon: React.ReactNode }[] = [
    { label: t('postDetail.location'), value: `${post.city}, ${post.country}`, icon: <MapPin size={21} /> },
    { label: t('postDetail.stage'), value: t(`posts.stage.${post.projectStage}`), help: t(`posts.form.stageHelp.${post.projectStage}`), icon: <Flag size={21} /> },
    { label: t('postDetail.collab'), value: t(`posts.collab.${post.collaborationType}`), help: t(`posts.form.collabHelp.${post.collaborationType}`), icon: <Users size={21} /> },
    { label: t('postDetail.commitment'), value: t(COMMITMENT_KEYS[post.levelOfCommitment ?? 'flexible']), icon: <Clock size={21} /> },
    { label: t('postDetail.confidentiality'), value: t(post.confidentiality === 'public_pitch' ? 'posts.form.publicPitch' : 'posts.form.meetingOnly'), icon: <Lock size={21} /> },
    { label: t('postDetail.expiresOn'), value: formatDate(post.expiryDate, { day: 'numeric', month: 'short', year: 'numeric' }), icon: <CalendarDays size={21} /> },
    { label: t('postDetail.interest'), value: t('postDetail.interestCount', { count: post.interestCount }), icon: <Star size={21} /> },
  ]
  const initials = post.authorName.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
  const daysLeft = Math.max(0, Math.ceil((new Date(post.expiryDate).getTime() - Date.now()) / 86400000))
  const openForRequests = OPEN_FOR_REQUESTS.includes(post.status)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const runDialog = async (action: () => Promise<void>) => {
    setDialogBusy(true)
    setDialogError(null)
    try {
      await action()
      setDialog(null)
      setNewExpiry('')
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setDialogBusy(false)
    }
  }

  const sidebarMessage = alreadyRequested && !isOwner
    ? t('postDetail.sidebar.alreadyRequested')
    : canExpressInterest
      ? t('postDetail.sidebar.canRequest')
      : isOwner
        ? t('postDetail.sidebar.owner')
        : null

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-[#36213E]">
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-14 pt-[42px] sm:px-8 xl:px-0">
        <div className="mb-[22px] flex items-center justify-between gap-2 sm:gap-4">
          <button
            onClick={() => navigate(ROUTES.POSTS)}
            className="inline-flex shrink-0 items-center gap-2 sm:gap-3 text-sm font-black text-[#26162f] transition hover:text-[#55bde0]"
            aria-label={t('postDetail.backToDirectory')}
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">{t('postDetail.backToDirectory')}</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {})
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="inline-flex h-[40px] sm:h-[44px] items-center gap-2 sm:gap-3 rounded-[12px] border border-[#D5DAE0] bg-white px-3 sm:px-6 text-sm font-black shadow-[0_16px_45px_-40px_rgba(45,24,56,0.7)] transition hover:border-[#8bddea]"
              title={copied ? t('postDetail.copied') : t('postDetail.share')}
              aria-label={copied ? t('postDetail.copied') : t('postDetail.share')}
            >
              <LinkIcon size={17} />
              <span className="hidden sm:inline">{copied ? t('postDetail.copied') : t('postDetail.share')}</span>
            </button>
            <button
              onClick={() => void exportPostToPdf({
                title: post.title,
                domain: domains.join(', '),
                description: post.description,
                authorName: post.authorName,
                authorRole: post.authorRole,
                projectStage: post.projectStage,
                collaborationType: post.collaborationType,
                levelOfCommitment: post.levelOfCommitment,
                city: post.city,
                country: post.country,
                expiryDate: post.expiryDate,
                expertiseRequired: post.expertiseRequired,
              })}
              className="inline-flex h-[40px] sm:h-[44px] items-center gap-2 sm:gap-3 rounded-[12px] border border-[#D5DAE0] bg-white px-3 sm:px-6 text-sm font-black shadow-[0_16px_45px_-40px_rgba(45,24,56,0.7)] transition hover:border-[#8bddea]"
              title={t('postDetail.exportPdf')}
              aria-label={t('postDetail.exportPdf')}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">picture_as_pdf</span>
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={() => {
                const next = !saved
                setSaved(next)
                if (id) localStorage.setItem(`saved_post_${id}`, String(next))
              }}
              aria-pressed={saved}
              className={`inline-flex h-[40px] sm:h-[44px] items-center gap-2 sm:gap-3 rounded-[12px] border px-3 sm:px-6 text-sm font-black shadow-[0_16px_45px_-40px_rgba(45,24,56,0.7)] transition ${
                saved
                  ? 'border-[#2d1838] bg-[#2d1838] text-white'
                  : 'border-[#D5DAE0] bg-white hover:border-[#8bddea]'
              }`}
              title={saved ? t('postDetail.saved') : t('postDetail.save')}
              aria-label={saved ? t('postDetail.saved') : t('postDetail.save')}
            >
              <Bookmark size={17} fill={saved ? 'white' : 'none'} />
              <span className="hidden sm:inline">{saved ? t('postDetail.saved') : t('postDetail.save')}</span>
            </button>
          </div>
        </div>

        <section className="rounded-[28px] bg-white px-6 py-8 shadow-[0_34px_100px_-86px_rgba(45,24,56,0.72)] sm:px-9 sm:py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
            <div>
              <div className="flex flex-wrap gap-3">
                {domains.map(domain => <Pill key={domain} tone="blue" lang="en">{domain}</Pill>)}
                <Pill tone={openForRequests ? 'green' : 'gray'}>{t(`posts.status.${post.status}`, { defaultValue: post.status })}</Pill>
              </div>

              <h1 className="mt-7 max-w-[780px] break-words font-headline text-4xl font-black leading-tight text-[#36213E] sm:text-5xl">
                {post.title}
              </h1>

              <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-5">
                  <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#dceeff] text-base font-black text-[#36213E]">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-black">{post.authorName}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6F6878]">
                      {t(`common.role.${post.authorRole}`, { defaultValue: post.authorRole })}
                      <ShieldCheck size={14} className="text-[#50627a]" aria-hidden="true" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {alreadyRequested && !isOwner ? (
                    <button onClick={() => navigate(ROUTES.MEETINGS)} className="h-[46px] rounded-full bg-[#36213E] px-7 text-sm font-black text-white transition hover:bg-[#4b3055]">
                      {t('postDetail.manageRequest')}
                    </button>
                  ) : canExpressInterest ? (
                    <button onClick={() => setShowInterest(true)} className="h-[46px] rounded-full bg-[#36213E] px-7 text-sm font-black text-white transition hover:bg-[#4b3055]">
                      {t('postDetail.scheduleMeeting')}
                    </button>
                  ) : isOwner ? (
                    <>
                      {canPublish && <button onClick={() => publish(post.id)} className="h-[46px] rounded-full bg-[#36213E] px-7 text-sm font-black text-white">{t('postDetail.publish')}</button>}
                      {canMarkFound && (
                        <button onClick={() => { setDialogError(null); setDialog('partnerFound') }} className="h-[46px] rounded-full bg-[#D8EFF2] px-7 text-sm font-black text-[#36213E]">
                          {t('partnerFound.button')}
                        </button>
                      )}
                      {canReopen && (
                        <button onClick={() => { setDialogError(null); setDialog('reopen') }} className="h-[46px] rounded-full bg-[#36213E] px-7 text-sm font-black text-white">
                          {t('postDetail.reopen')}
                        </button>
                      )}
                      {canEdit && <button onClick={() => navigate(postEdit(post.id))} className="h-[46px] rounded-full border border-[#D5DAE0] bg-white px-7 text-sm font-black">{t('postDetail.edit')}</button>}
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#E8F4F7] px-6 py-6">
              <div className="flex items-center gap-4">
                <CalendarDays className="text-[#36213E]" size={25} aria-hidden="true" />
                <div>
                  <div className="text-3xl font-black leading-none">{daysLeft}</div>
                  <div className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#6F6878]">{t('postDetail.daysLeft')}</div>
                </div>
              </div>
              <div className="mt-5 h-[6px] overflow-hidden rounded-full bg-white/70">
                <div className="h-full rounded-full bg-[#8AC6D0]" style={{ width: `${Math.min(100, Math.max(8, 100 - daysLeft / 4))}%` }} />
              </div>
              {sidebarMessage ? (
                <p className="mt-5 text-sm font-semibold leading-6 text-[#6F6878]">{sidebarMessage}</p>
              ) : (
                <div className="mt-5 space-y-3 text-sm font-semibold leading-6 text-[#6F6878]">
                  <p>{post.status === 'partner_found' ? t('postDetail.sidebar.partnerFound') : t('postDetail.sidebar.notAccepting')}</p>
                  <p>{t('postDetail.sidebar.commentsNotify')}</p>
                  <a href="#comments" className="inline-flex items-center gap-2 font-black text-[#36213E] underline">
                    <MessageSquare size={15} aria-hidden="true" />
                    {t('postDetail.sidebar.leaveNote')}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-[#E3E7EC] pt-7">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {meta.map(item => (
                <div key={item.label} className="flex items-start gap-4" title={item.help}>
                  <span className="mt-1 shrink-0 text-[#6FB8C4]" aria-hidden="true">{item.icon}</span>
                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.12em] text-[#6F6878]">{item.label}</span>
                    <span className="mt-2 block break-words text-sm font-black leading-5 text-[#36213E]">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,690px)_1fr]">
          <div className="rounded-[28px] bg-white px-6 py-8 shadow-[0_30px_90px_-84px_rgba(45,24,56,0.7)] sm:px-9">
            <DetailSection title={t('postDetail.descriptionTitle')}>
              {post.confidentiality === 'public_pitch' ? (
                <>
                  <p className="whitespace-pre-wrap break-words text-base font-semibold leading-8 text-[#4f4a58]">{post.description}</p>
                  <TranslateButton text={post.description} className="mt-3" />
                </>
              ) : (
                <p className="text-base font-semibold leading-8 text-[#4f4a58]">{t('posts.detail.ndaNotice')}</p>
              )}
            </DetailSection>

            <DetailSection title={t('postDetail.expertiseTitle')}>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex max-w-full break-words rounded-full bg-[#E8F4F7] px-5 py-3 text-sm font-black text-[#36213E]">{post.expertiseRequired}</span>
              </div>
            </DetailSection>

            <DetailSection title={t('postDetail.aboutAuthor')} isLast>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-[#dfefff] text-base font-black">{initials}</div>
                  <div>
                    <div className="text-lg font-black">{post.authorName}</div>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6F6878]">
                      {t(`common.role.${post.authorRole}`, { defaultValue: post.authorRole })}
                      <ShieldCheck size={14} className="text-[#50627a]" aria-hidden="true" />
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[#6F6878]">
                      {t('postDetail.memberSince', { date: formatDate(post.createdAt, { month: 'long', year: 'numeric' }) })}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/profile/${post.authorId}`)}
                  className="h-[48px] rounded-full border border-[#D5DAE0] bg-white px-8 text-sm font-black transition hover:border-[#8AC6D0]"
                >
                  {t('postDetail.viewProfile')}
                </button>
              </div>
            </DetailSection>
          </div>

          <aside className="lg:pt-2">
            <div className="relative lg:sticky lg:top-6 rounded-[28px] bg-white px-6 py-7 shadow-[0_30px_90px_-84px_rgba(45,24,56,0.7)]">
              <h2 className="text-xl font-black leading-tight text-[#36213E]">{t('postDetail.opportunityDetails')}</h2>
              <div className="mt-6 space-y-[18px]">
                {([
                  [t('postDetail.domains'), domains.join(', '), <Wrench size={18} />],
                  [t('postDetail.posted'), formatDate(post.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }), <FileText size={18} />],
                  [t('postDetail.stage'), t(`posts.stage.${post.projectStage}`), <Flag size={18} />],
                  [t('postDetail.collab'), t(`posts.collab.${post.collaborationType}`), <Users size={18} />],
                  [t('postDetail.commitment'), t(COMMITMENT_KEYS[post.levelOfCommitment ?? 'flexible']), <Clock size={18} />],
                  [t('postDetail.confidentiality'), t(post.confidentiality === 'public_pitch' ? 'posts.form.publicPitch' : 'posts.form.meetingOnly'), <Lock size={18} />],
                  [t('postDetail.listingExpiry'), formatDate(post.expiryDate, { day: 'numeric', month: 'short', year: 'numeric' }), <CalendarDays size={18} />],
                ] as const).map(([label, value, icon]) => (
                  <div key={label} className="flex gap-4">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#EEF0F3] text-[#6FB8C4]" aria-hidden="true">
                      {icon}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-[#6F6878]">{label}</span>
                      <span className="mt-1 block break-words text-sm font-black text-[#36213E]">{value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div id="comments" className="mx-auto w-full max-w-[1120px] scroll-mt-6 px-5 pb-14 sm:px-8 xl:px-0">
        {id && <CommentsSection postId={id} />}
      </div>

      {showInterest && (
        <ExpressInterestModal
          post={post}
          onClose={() => setShowInterest(false)}
          onSuccess={() => { setShowInterest(false); navigate(ROUTES.MEETINGS, { state: { requestSentTo: post.authorName } }) }}
        />
      )}

      {dialog === 'partnerFound' && (
        <ConfirmDialog
          title={t('partnerFound.confirmTitle')}
          confirmLabel={dialogBusy ? t('common.loading') : t('partnerFound.confirm')}
          cancelLabel={t('common.cancel')}
          onConfirm={() => runDialog(() => markPartnerFound(post.id))}
          onCancel={() => setDialog(null)}
          busy={dialogBusy}
          error={dialogError}
        >
          <p>{t('partnerFound.confirmBody', { title: post.title })}</p>
          <p>{t('partnerFound.confirmUndo')}</p>
        </ConfirmDialog>
      )}

      {dialog === 'reopen' && (
        <ConfirmDialog
          title={t('postDetail.reopenTitle')}
          confirmLabel={dialogBusy ? t('common.loading') : t('postDetail.reopen')}
          cancelLabel={t('common.cancel')}
          onConfirm={() => runDialog(() => reopen(post.id, expiredWhileClosed ? newExpiry : undefined))}
          onCancel={() => setDialog(null)}
          busy={dialogBusy}
          confirmDisabled={expiredWhileClosed && !newExpiry}
          error={dialogError}
        >
          <p>{t('postDetail.reopenBody')}</p>
          {expiredWhileClosed && (
            <>
              <p>{t('postDetail.reopenExpired')}</p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-black text-[#36213E]">{t('postDetail.newExpiry')}</span>
                <input
                  type="date"
                  value={newExpiry}
                  min={localDateInputValue(tomorrow)}
                  onChange={event => setNewExpiry(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#D5DAE0] px-3 text-sm font-semibold text-[#36213E] outline-none focus:border-[#36213E]"
                />
              </label>
            </>
          )}
        </ConfirmDialog>
      )}
    </main>
  )
}

/** `lang` matters for untranslated text: uppercase follows the language's rules ("Midwifery" → "MİDWİFERY" in Turkish). */
function Pill({ children, tone, lang }: { children: string; tone: 'blue' | 'green' | 'gray'; lang?: string }) {
  const cls = tone === 'green' ? 'bg-[#DCF5E6] text-[#14532D]' : tone === 'blue' ? 'bg-[#E8F4F7] text-[#1B6F7C]' : 'bg-[#EEF0F3] text-[#4B5563]'
  return <span lang={lang} className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-normal ${cls}`}>{children}</span>
}

function DetailSection({ title, children, isLast = false }: { title: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <section className={`${isLast ? '' : 'border-b border-[#E3E7EC] pb-8'} ${isLast ? 'pt-8' : 'py-8'} first:pt-0`}>
      <h2 className="text-xl font-black leading-tight text-[#36213E]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}
