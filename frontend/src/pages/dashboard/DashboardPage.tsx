import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, CalendarDays, Eye, FileText, Handshake, Plus, Search, Sparkles, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../lib/api'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import { usePostStore } from '../../store/postStore'
import type { Meeting } from '../../types/meeting.types'
import type { Post } from '../../types/post.types'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { getByUser, fetchByUser } = useMeetingStore()
  const { posts, fetchPosts } = usePostStore()

  useEffect(() => {
    if (user) fetchByUser(user.id)
  }, [fetchByUser, user])

  useEffect(() => {
    if (user) fetchPosts({ limit: 100, mine: true, filters: {} })
  }, [fetchPosts, user])

  const myMeetings = user ? getByUser(user.id) : []
  const upcomingMeetings = myMeetings.filter(meeting =>
    meeting.status === 'confirmed' || meeting.status === 'pending'
  )
  const activeListings = posts.filter(post => post.status === 'active' || post.status === 'meeting_scheduled').length
  const isNewUser = posts.length === 0 && myMeetings.length === 0

  return (
    <main className="min-h-screen bg-[#F3F4F6] text-[#36213E]">
      <div className="mx-auto w-full max-w-[1640px] px-4 pb-24 pt-[94px] sm:px-8">
        <section className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[420px_minmax(0,1fr)] xl:gap-28">
          <WelcomePanel user={user} />
          <WeeklyBlob postCount={posts.length} meetingCount={myMeetings.length} activeListings={activeListings} />
        </section>

        {isNewUser ? (
          <OnboardingPanel />
        ) : (
          <section className="mt-10 grid grid-cols-1 gap-12 xl:grid-cols-[minmax(0,680px)_minmax(0,700px)] xl:gap-28">
            <RecentPosts posts={posts} />
            <UpcomingMeetings meetings={upcomingMeetings} userId={user?.id ?? ''} />
          </section>
        )}
        <SavedPosts storePosts={posts} />
      </div>
    </main>
  )
}

function OnboardingPanel() {
  const { t } = useTranslation()
  const steps = [
    {
      icon: <User size={22} />,
      bg: '#E8F4F7',
      title: t('dashboard.onboarding.profileTitle'),
      body: t('dashboard.onboarding.profileBody'),
      cta: t('dashboard.onboarding.profileCta'),
      to: ROUTES.PROFILE,
    },
    {
      icon: <Search size={22} />,
      bg: '#D8EFF2',
      title: t('dashboard.onboarding.browseTitle'),
      body: t('dashboard.onboarding.browseBody'),
      cta: t('dashboard.onboarding.browseCta'),
      to: ROUTES.POSTS,
    },
    {
      icon: <Plus size={22} />,
      bg: '#E3DCD2',
      title: t('dashboard.onboarding.postTitle'),
      body: t('dashboard.onboarding.postBody'),
      cta: t('dashboard.onboarding.postCta'),
      to: ROUTES.POST_CREATE,
    },
  ]

  return (
    <section className="mt-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#36213E] text-[#E8F4F7]">
          <Sparkles size={17} />
        </div>
        <h3 className="text-base font-black text-[#36213E]">{t('dashboard.getStarted')}</h3>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-7">
        {steps.map((step, i) => (
          <div key={i} className="rounded-[24px] border border-[#E3E7EC] bg-white p-7 shadow-[0_20px_60px_-44px_rgba(45,24,56,0.35)]">
            <div
              className="mb-6 flex h-[50px] w-[50px] items-center justify-center rounded-[14px] text-[#36213E]"
              style={{ backgroundColor: step.bg }}
            >
              {step.icon}
            </div>
            <div className="mb-2 text-lg font-black text-[#36213E]">{step.title}</div>
            <p className="mb-7 text-sm font-semibold leading-6 text-[#6F6878]">{step.body}</p>
            <Link
              to={step.to}
              className="inline-flex items-center gap-2 text-sm font-black text-[#1B7A88] transition hover:text-[#36213E]"
            >
              {step.cta}
              <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function useRoleLabel() {
  const { t } = useTranslation()
  return (role: string) => t(`common.role.${role}`, { defaultValue: role })
}

function weekRange(locale: string) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} - ${fmt(sunday)}, ${sunday.getFullYear()}`
}

function WelcomePanel({ user }: { user: ReturnType<typeof useAuthStore.getState>['user'] }) {
  const { t } = useTranslation()
  const roleLabel = useRoleLabel()
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  return (
    <div className="pt-6">
      <h1 className="font-headline text-4xl font-black leading-tight tracking-normal text-[#36213E] sm:text-6xl">
        {t('dashboard.welcomeBack')}
      </h1>
      <h2 className="font-headline text-4xl font-black leading-tight tracking-normal text-[#1B7A88] sm:text-6xl">
        {firstName}<span className="text-[#36213E]">.</span>
      </h2>

      <p className="mt-5 text-base font-semibold text-[#6F6878]">
        {t('dashboard.signedInAs')} <span className="font-black text-[#36213E]">{roleLabel(user?.role ?? '')}</span>
        {user?.institution && (
          <>
            <span className="px-1.5">·</span>
            <span className="font-black text-[#36213E]">{user.institution}</span>
          </>
        )}
      </p>

      <div className="mt-10 border-l-2 border-[#b7c1ca] py-1 pl-6 text-lg font-semibold leading-8 text-[#6F6878]">
        {t('dashboard.tagline')}
      </div>

      <div className="mt-14">
        <Link
          to={ROUTES.POST_CREATE}
          className="flex h-[48px] w-full max-w-[292px] items-center gap-5 rounded-full bg-[#36213E] px-7 text-sm font-black text-white shadow-[0_18px_30px_-18px_rgba(45,24,56,0.82)] transition hover:bg-[#24162B]"
        >
          <Plus size={18} strokeWidth={2.5} />
          {t('dashboard.postOpportunity')}
        </Link>
      </div>
    </div>
  )
}

function WeeklyBlob({
  postCount,
  meetingCount,
  activeListings,
}: {
  postCount: number
  meetingCount: number
  activeListings: number
}) {
  const { t, i18n } = useTranslation()
  return (
    <div className="relative xl:h-[455px]">
      <div
        className="absolute left-[-86px] right-[-42px] top-[-28px] hidden h-[505px] bg-[#E8F4F7]/75 xl:block"
        style={{
          borderRadius: '46% 54% 41% 59% / 44% 39% 61% 56%',
          transform: 'rotate(1.2deg)',
        }}
      />
      <div
        className="absolute right-2 top-[240px] hidden h-[96px] w-[150px] opacity-45 xl:block"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.95) 1.4px, transparent 1.4px)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[790px] px-4 pt-6 xl:pt-[115px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-base font-black text-[#36213E]">{t('dashboard.weeklyOverview')}</div>
          <div className="text-sm font-bold text-[#6F6878]">{weekRange(i18n.language)}</div>
        </div>

        <div className="grid grid-cols-3 gap-6 xl:gap-16">
          <Metric icon={<FileText size={21} />} iconBg="#8AC6D0" value={postCount} label={t('dashboard.myPosts')} sub={postCount === 0 ? t('dashboard.noPostsYet') : t('dashboard.totalCreated')} />
          <Metric icon={<Handshake size={21} />} iconBg="#D8EFF2" value={meetingCount} label={t('dashboard.myMeetings')} sub={meetingCount === 0 ? t('dashboard.noneScheduled') : t('dashboard.pendingConfirmed')} />
          <Metric icon={<Eye size={21} />} iconBg="#E3DCD2" value={activeListings} label={t('dashboard.activeListings')} sub={activeListings === 0 ? t('dashboard.noneActive') : t('dashboard.openForInterest')} />
        </div>
      </div>
    </div>
  )
}

function Metric({
  icon,
  iconBg,
  value,
  label,
  sub,
}: {
  icon: ReactNode
  iconBg: string
  value: number
  label: string
  sub: string
}) {
  return (
    <div>
      <div className="mb-7 flex h-[50px] w-[50px] items-center justify-center rounded-[14px] text-[#36213E]" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="font-headline text-5xl font-black leading-none text-[#36213E]">{value}</div>
      <div className="mt-3 text-lg font-semibold text-[#6F6878]">{label}</div>
      <div className="mt-3 text-sm font-semibold text-[#6F6878]">{sub}</div>
    </div>
  )
}

function RecentPosts({ posts }: { posts: Post[] }) {
  const { t } = useTranslation()
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 3)

  return (
    <div>
      <div className="mb-9 flex items-center justify-between">
        <h3 className="text-base font-black text-[#36213E]">{t('dashboard.recentPosts')}</h3>
        <Link to={`${ROUTES.POSTS}?mine=true`} className="flex items-center gap-6 text-sm font-black text-[#8AC6D0] transition hover:text-[#36213E]">
          {t('common.viewAll')}
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="relative ml-2 pl-9">
        <div className="absolute left-0 top-[8px] bottom-[34px] border-l border-dashed border-[#D5DAE0]" />
        {recentPosts.length > 0 ? (
          recentPosts.map(post => (
            <Link
              to={`/posts/${post.id}`}
              key={post.id}
              className="group relative grid min-h-[94px] grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-[#D5DAE0] pt-0.5 transition hover:border-[#8AC6D0] sm:grid-cols-[minmax(0,1fr)_132px] sm:gap-8"
            >
              <span className="absolute -left-[41px] top-[4px] h-2.5 w-2.5 rounded-full bg-[#8AC6D0]" />
              <div>
                <div className="truncate text-base font-black text-[#36213E] transition group-hover:text-[#36213E]">{post.title}</div>
                <div className="mt-2 text-base font-semibold text-[#6F6878]">{post.domain}</div>
              </div>
              <StatusPill status={post.status} />
            </Link>
          ))
        ) : (
          <div className="relative min-h-[94px] border-b border-[#D5DAE0] pt-0.5 text-base font-semibold text-[#6F6878]">
            <span className="absolute -left-[41px] top-[4px] h-2.5 w-2.5 rounded-full bg-[#8AC6D0]" />
            {t('dashboard.noPostsYet')}.
          </div>
        )}
      </div>
    </div>
  )
}

function SavedPosts({ storePosts }: { storePosts: Post[] }) {
  const { t } = useTranslation()
  const [savedPosts, setSavedPosts] = useState<Post[]>([])

  useEffect(() => {
    const ids = Object.keys(localStorage)
      .filter(k => k.startsWith('saved_post_') && localStorage.getItem(k) === 'true')
      .map(k => k.replace('saved_post_', ''))

    if (ids.length === 0) { setSavedPosts([]); return }

    const fromStore = ids.map(id => storePosts.find(p => p.id === id)).filter(Boolean) as Post[]
    const missingIds = ids.filter(id => !storePosts.find(p => p.id === id))

    Promise.all(
      missingIds.map(id =>
        api.get<{ success: boolean; data: Post & { _id?: string } }>(`/posts/${id}`)
          .then(({ data }) => ({ ...data.data, id: data.data._id ?? data.data.id }))
          .catch(() => null)
      )
    ).then(fetched => {
      setSavedPosts([...fromStore, ...(fetched.filter(Boolean) as Post[])])
    })
  }, [storePosts])

  if (savedPosts.length === 0) return null

  const unsave = (id: string) => {
    localStorage.removeItem(`saved_post_${id}`)
    setSavedPosts(prev => prev.filter(p => p.id !== id))
  }

  return (
    <section className="mt-14">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#36213E] text-[#E8F4F7]">
            <Bookmark size={16} fill="white" />
          </div>
          <h3 className="text-base font-black text-[#36213E]">{t('dashboard.savedPosts')}</h3>
          <span className="rounded-full bg-[#e8f4f7] px-2.5 py-0.5 text-xs font-black text-[#36213E]">
            {savedPosts.length}
          </span>
        </div>
        <Link to={ROUTES.POSTS} className="flex items-center gap-2 text-sm font-black text-[#1B7A88] transition hover:text-[#36213E]">
          {t('dashboard.browseAll')} <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {savedPosts.map(post => (
          <div key={post.id} className="group relative rounded-[20px] border border-[#E3E7EC] bg-white p-5 shadow-[0_12px_40px_-28px_rgba(45,24,56,0.25)] transition hover:border-[#8AC6D0] hover:shadow-[0_16px_48px_-28px_rgba(45,24,56,0.35)]">
            <button
              onClick={() => unsave(post.id)}
              className="absolute right-4 top-4 text-[#1B7A88] opacity-0 group-hover:opacity-100 transition hover:text-[#36213E]"
              title={t('dashboard.removeFromSaved')}
            >
              <Bookmark size={15} fill="#8AC6D0" />
            </button>
            <Link to={`/posts/${post.id}`} className="block">
              <div className="mb-2 line-clamp-2 text-[14.5px] font-black text-[#36213E] leading-snug pr-6">
                {post.title}
              </div>
              <div className="text-[12.5px] font-semibold text-[#6F6878] mb-3">{post.domain}</div>
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold text-[#9f9aaa]">{post.authorName}</span>
                <StatusPill status={post.status} />
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatusPill({ status }: { status: Post['status'] }) {
  const { t } = useTranslation()
  return (
    <span className="mt-1 rounded-full bg-[#36213E] px-4 py-1.5 text-center text-xs font-black uppercase tracking-[0.12em] text-[#E8F4F7]">
      {t(`dashboard.status.${status}`, { defaultValue: status })}
    </span>
  )
}

function UpcomingMeetings({ meetings, userId }: { meetings: Meeting[]; userId: string }) {
  const { t } = useTranslation()
  const visibleMeetings = meetings.slice(0, 3)
  const positions = ['left-[312px] top-[76px]', 'left-[112px] top-[210px]', 'left-[334px] top-[270px]']

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-black text-[#36213E]">{t('dashboard.upcomingMeetings')}</h3>
        <Link to={ROUTES.MEETINGS} className="flex items-center gap-6 text-sm font-black text-[#1B7A88] transition hover:text-[#36213E]">
          {t('common.viewAll')}
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Mobile: simple list */}
      <div className="mt-4 xl:hidden">
        {visibleMeetings.length === 0 ? (
          <p className="text-sm font-semibold text-[#6F6878]">{t('dashboard.noPendingMeetings')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleMeetings.map(meeting => {
              const isRequester = meeting.requesterId === userId
              const partner = isRequester ? meeting.ownerName : meeting.requesterName
              const slot = meeting.confirmedSlot ?? meeting.proposedSlots[0]
              return (
                <Link key={meeting.id} to={ROUTES.MEETINGS} className="flex items-center gap-4 rounded-2xl border border-[#E3E7EC] bg-white px-4 py-3 transition hover:border-[#8AC6D0]">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#36213E] text-xs font-black tracking-normal text-[#8AC6D0]">
                    {partner.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-[#36213E]">{partner}</div>
                    <div className="truncate text-xs font-semibold text-[#6F6878]">
                      {slot ? `${slot.date} · ${slot.time}` : t('dashboard.slotPending')} · {meeting.status}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Desktop: orbit widget */}
      <div className="relative mx-auto hidden h-[360px] w-[520px] xl:block">
        <div className="absolute left-[88px] top-[34px] h-[330px] w-[330px] rounded-full border border-[#E3E7EC]" />
        <div className="absolute left-[128px] top-[74px] h-[250px] w-[250px] rounded-full border border-[#E3E7EC]" />
        <div className="absolute left-[168px] top-[114px] h-[170px] w-[170px] rounded-full border border-[#E3E7EC]" />
        <div className="absolute left-[206px] top-[152px] flex h-[94px] w-[94px] items-center justify-center rounded-full bg-[#E8F4F7]">
          <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#D7EEF2] text-[#36213E]">
            <CalendarDays size={23} strokeWidth={2.4} />
          </div>
        </div>

        {visibleMeetings.map((meeting, index) => (
          <MeetingAvatar
            key={meeting.id}
            meeting={meeting}
            userId={userId}
            className={positions[index]}
            imageSrc={index === 1 ? '/images/engineer-portrait.png' : '/images/clinician-portrait.png'}
          />
        ))}

        <div className="absolute left-[200px] top-[248px] w-[120px] text-center">
          {visibleMeetings.length === 0 ? (
            <>
              <div className="text-lg font-black text-[#36213E]">{t('dashboard.allCaughtUp')}</div>
              <div className="mt-2 text-base font-semibold leading-6 text-[#6F6878]">
                {t('dashboard.noPendingMeetings')}
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-black text-[#36213E]">{visibleMeetings.length} {t('dashboard.upcoming')}</div>
              <div className="mt-2 text-base font-semibold leading-6 text-[#6F6878]">
                {t('dashboard.hoverProfiles')}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MeetingAvatar({
  meeting,
  userId,
  imageSrc,
  className,
}: {
  meeting: Meeting
  userId: string
  imageSrc: string
  className: string
}) {
  const { t, i18n } = useTranslation()
  const isRequester = meeting.requesterId === userId
  const partner = isRequester ? meeting.ownerName : meeting.requesterName
  const slot = meeting.confirmedSlot ?? meeting.proposedSlots[0]
  const statusLabel = t(`meetings.status.${meeting.status}`, { defaultValue: meeting.status })
  const dateLabel = slot
    ? new Date(`${slot.date}T${slot.time}`).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : t('dashboard.slotPending')

  const tooltipId = `meeting-tip-${meeting.id}`
  const tooltipContent = `${partner} · ${meeting.postTitle} · ${statusLabel} · ${dateLabel}`

  return (
    <div
      className={`group absolute flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white shadow-[0_10px_28px_-18px_rgba(45,24,56,0.6)] ${className}`}
      tabIndex={0}
      role="button"
      aria-describedby={tooltipId}
      aria-label={`Meeting with ${partner}`}
    >
      <img src={imageSrc} alt={partner} className="h-[38px] w-[38px] rounded-full object-cover" />
      <div
        id={tooltipId}
        role="tooltip"
        aria-label={tooltipContent}
        className="pointer-events-none absolute left-1/2 top-[62px] z-20 w-[230px] -translate-x-1/2 translate-y-2 rounded-2xl border border-[#E3E7EC] bg-white px-4 py-3 text-left opacity-0 shadow-[0_24px_60px_-28px_rgba(45,24,56,0.45)] transition group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100"
      >
        <div className="truncate text-sm font-black text-[#36213E]">{partner}</div>
        <div className="mt-1 line-clamp-2 text-xs font-semibold leading-4 text-[#6F6878]">{meeting.postTitle}</div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-[#6F6878]">
          <span>{statusLabel}</span>
          <span>{slot ? slot.time : ''}</span>
        </div>
        <div className="mt-1 text-xs font-bold text-[#6F6878]">{dateLabel}</div>
      </div>
    </div>
  )
}
