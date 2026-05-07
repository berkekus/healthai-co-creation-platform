import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Eye, FileText, Handshake, Plus, Search, Sparkles, User } from 'lucide-react'
import type { ReactNode } from 'react'
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
    <main className="min-h-screen bg-[#f7f8fa] text-[#2d1838]">
      <div className="mx-auto w-full max-w-[1640px] px-8 pb-24 pt-[94px]">
        <section className="grid min-h-[500px] grid-cols-[420px_minmax(0,1fr)] items-start gap-28">
          <WelcomePanel user={user} />
          <WeeklyBlob postCount={posts.length} meetingCount={myMeetings.length} activeListings={activeListings} />
        </section>

        {isNewUser ? (
          <OnboardingPanel />
        ) : (
          <section className="mt-10 grid grid-cols-[minmax(0,680px)_minmax(0,700px)] gap-28">
            <RecentPosts posts={posts} />
            <UpcomingMeetings meetings={upcomingMeetings} userId={user?.id ?? ''} />
          </section>
        )}
      </div>
    </main>
  )
}

function OnboardingPanel() {
  const steps = [
    {
      icon: <User size={22} />,
      bg: '#dff8ff',
      title: 'Complete your profile',
      body: 'Add your expertise tags, bio, and institution so collaborators can find you.',
      cta: 'Go to profile',
      to: ROUTES.PROFILE,
    },
    {
      icon: <Search size={22} />,
      bg: '#d8ff8f',
      title: 'Browse the directory',
      body: 'Explore active collaboration opportunities from clinicians and engineers.',
      cta: 'Browse directory',
      to: ROUTES.POSTS,
    },
    {
      icon: <Plus size={22} />,
      bg: '#e7dccb',
      title: 'Post an opportunity',
      body: 'Have a project idea? Post it and let the right partner find you.',
      cta: 'Post now',
      to: ROUTES.POST_CREATE,
    },
  ]

  return (
    <section className="mt-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2d1838] text-[#dff8ff]">
          <Sparkles size={17} />
        </div>
        <h3 className="text-[16px] font-black text-[#403645]">Get started</h3>
      </div>

      <div className="grid grid-cols-3 gap-7">
        {steps.map((step, i) => (
          <div key={i} className="rounded-[24px] border border-[#e3e7ec] bg-white p-7 shadow-[0_20px_60px_-44px_rgba(45,24,56,0.35)]">
            <div
              className="mb-6 flex h-[50px] w-[50px] items-center justify-center rounded-[14px] text-[#2d1838]"
              style={{ backgroundColor: step.bg }}
            >
              {step.icon}
            </div>
            <div className="mb-2 text-[17px] font-black text-[#2d1838]">{step.title}</div>
            <p className="mb-7 text-[14px] font-semibold leading-6 text-[#77727f]">{step.body}</p>
            <Link
              to={step.to}
              className="inline-flex items-center gap-2 text-[13px] font-black text-[#85cbd8] transition hover:text-[#2d1838]"
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

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Professional',
  admin: 'Administrator',
}

function weekRange() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} - ${fmt(sunday)}, ${sunday.getFullYear()}`
}

function WelcomePanel({ user }: { user: ReturnType<typeof useAuthStore.getState>['user'] }) {
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  return (
    <div className="pt-6">
      <h1 className="font-headline text-[54px] font-black leading-[1.05] tracking-normal text-[#2d1838]">
        Welcome back,
      </h1>
      <h2 className="font-headline text-[54px] font-black leading-[1.05] tracking-normal text-[#8bddea]">
        {firstName}<span className="text-[#2d1838]">.</span>
      </h2>

      <p className="mt-5 text-[16px] font-semibold text-[#77727f]">
        Signed in as <span className="font-black text-[#3a3043]">{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</span>
        {user?.institution && (
          <>
            <span className="px-1.5">·</span>
            <span className="font-black text-[#3a3043]">{user.institution}</span>
          </>
        )}
      </p>

      <div className="mt-10 border-l-2 border-[#b7c1ca] py-1 pl-6 text-[17px] font-semibold leading-8 text-[#77727f]">
        Collaborate, innovate, and build the future<br />
        of healthcare — together.
      </div>

      <div className="mt-14 flex w-[292px] flex-col gap-[13px]">
        <Link
          to={ROUTES.POST_CREATE}
          className="flex h-[48px] items-center gap-5 rounded-full bg-[#2d1838] px-7 text-[14px] font-black text-white shadow-[0_18px_30px_-18px_rgba(45,24,56,0.82)] transition hover:bg-[#1e1027]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Post an opportunity
        </Link>
        <Link
          to={ROUTES.POSTS}
          className="flex h-[48px] items-center gap-5 rounded-full border border-[#cfd3d9] bg-white/55 px-7 text-[14px] font-black text-[#16121b] transition hover:border-[#8bddea] hover:bg-white"
        >
          <Search size={17} strokeWidth={2.4} />
          Browse directory
        </Link>
        <Link
          to={ROUTES.MEETINGS}
          className="flex h-[48px] items-center gap-5 rounded-full border border-[#cfd3d9] bg-white/55 px-7 text-[14px] font-black text-[#16121b] transition hover:border-[#8bddea] hover:bg-white"
        >
          <CalendarDays size={17} strokeWidth={2.4} />
          View meetings
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
  return (
    <div className="relative h-[455px]">
      <div
        className="absolute left-[-86px] right-[-42px] top-[-28px] h-[505px] bg-[#eaf8fb]/75"
        style={{
          borderRadius: '46% 54% 41% 59% / 44% 39% 61% 56%',
          transform: 'rotate(1.2deg)',
        }}
      />
      <div
        className="absolute right-2 top-[240px] h-[96px] w-[150px] opacity-45"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.95) 1.4px, transparent 1.4px)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[790px] px-4 pt-[115px]">
        <div className="mb-10 flex items-center justify-between">
          <div className="text-[15px] font-black text-[#44364f]">Weekly overview</div>
          <div className="text-[14px] font-bold text-[#86a8b4]">{weekRange()}</div>
        </div>

        <div className="grid grid-cols-3 gap-16">
          <Metric icon={<FileText size={21} />} iconBg="#8bddea" value={postCount} label="My posts" change="↗ Synced with backend" />
          <Metric icon={<Handshake size={21} />} iconBg="#d8ff8f" value={meetingCount} label="My meetings" change={meetingCount > 0 ? '↗ Review queue' : '— No change'} />
          <Metric icon={<Eye size={21} />} iconBg="#e7dccb" value={activeListings} label="Active listings" change={activeListings > 0 ? '↗ Open for interest' : '— No active listings'} />
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
  change,
}: {
  icon: ReactNode
  iconBg: string
  value: number
  label: string
  change: string
}) {
  return (
    <div>
      <div className="mb-7 flex h-[50px] w-[50px] items-center justify-center rounded-[14px] text-[#2d1838]" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="font-headline text-[42px] font-black leading-none text-[#2d1838]">{value}</div>
      <div className="mt-3 text-[17px] font-semibold text-[#5d5668]">{label}</div>
      <div className="mt-3 text-[14px] font-semibold text-[#6f8792]">{change}</div>
    </div>
  )
}

function RecentPosts({ posts }: { posts: Post[] }) {
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 3)

  return (
    <div>
      <div className="mb-9 flex items-center justify-between">
        <h3 className="text-[16px] font-black text-[#403645]">Recent posts</h3>
        <Link to={ROUTES.POSTS} className="flex items-center gap-6 text-[14px] font-black text-[#85cbd8] transition hover:text-[#2d1838]">
          View all
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="relative ml-2 pl-9">
        <div className="absolute left-0 top-[8px] bottom-[34px] border-l border-dashed border-[#c5cbd2]" />
        {recentPosts.length > 0 ? (
          recentPosts.map(post => (
            <Link
              to={`/posts/${post.id}`}
              key={post.id}
              className="group relative grid min-h-[94px] grid-cols-[minmax(0,1fr)_132px] items-start gap-8 border-b border-[#dfe2e7] pt-0.5 transition hover:border-[#8bddea]"
            >
              <span className="absolute -left-[41px] top-[4px] h-2.5 w-2.5 rounded-full bg-[#9bdce8]" />
              <div>
                <div className="truncate text-[16px] font-black text-[#393041] transition group-hover:text-[#2d1838]">{post.title}</div>
                <div className="mt-2 text-[15px] font-semibold text-[#7b7682]">{post.domain}</div>
              </div>
              <StatusPill status={post.status} />
            </Link>
          ))
        ) : (
          <div className="relative min-h-[94px] border-b border-[#dfe2e7] pt-0.5 text-[15px] font-semibold text-[#7b7682]">
            <span className="absolute -left-[41px] top-[4px] h-2.5 w-2.5 rounded-full bg-[#9bdce8]" />
            No posts yet.
          </div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: Post['status'] }) {
  const labels: Record<Post['status'], string> = {
    draft: 'Draft',
    active: 'Active',
    meeting_scheduled: 'Meeting',
    partner_found: 'Partner Found',
    expired: 'Expired',
  }

  return (
    <span className="mt-1 rounded-full bg-[#2d1838] px-4 py-1.5 text-center text-[11px] font-black uppercase tracking-[0.1em] text-[#dff8ff]">
      {labels[status]}
    </span>
  )
}

function UpcomingMeetings({ meetings, userId }: { meetings: Meeting[]; userId: string }) {
  const visibleMeetings = meetings.slice(0, 3)
  const positions = ['left-[312px] top-[76px]', 'left-[112px] top-[210px]', 'left-[334px] top-[270px]']

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[16px] font-black text-[#403645]">Upcoming meetings</h3>
        <Link to={ROUTES.MEETINGS} className="flex items-center gap-6 text-[14px] font-black text-[#85cbd8] transition hover:text-[#2d1838]">
          View all
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="relative mx-auto h-[360px] w-[520px]">
        <div className="absolute left-[88px] top-[34px] h-[330px] w-[330px] rounded-full border border-[#edf0f4]" />
        <div className="absolute left-[128px] top-[74px] h-[250px] w-[250px] rounded-full border border-[#edf0f4]" />
        <div className="absolute left-[168px] top-[114px] h-[170px] w-[170px] rounded-full border border-[#edf0f4]" />
        <div className="absolute left-[206px] top-[152px] flex h-[94px] w-[94px] items-center justify-center rounded-full bg-[#dff8ff]">
          <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#c7edf5] text-[#2d1838]">
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
              <div className="text-[18px] font-black text-[#2d1838]">All caught up</div>
              <div className="mt-2 text-[15px] font-semibold leading-6 text-[#7c7682]">
                No pending<br />meetings.
              </div>
            </>
          ) : (
            <>
              <div className="text-[18px] font-black text-[#2d1838]">{visibleMeetings.length} upcoming</div>
              <div className="mt-2 text-[15px] font-semibold leading-6 text-[#7c7682]">
                Hover profiles<br />for details.
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
  const isRequester = meeting.requesterId === userId
  const partner = isRequester ? meeting.ownerName : meeting.requesterName
  const slot = meeting.confirmedSlot ?? meeting.proposedSlots[0]
  const statusLabel = meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)
  const dateLabel = slot
    ? new Date(`${slot.date}T${slot.time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Slot pending'

  return (
    <div className={`group absolute flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white shadow-[0_10px_28px_-18px_rgba(45,24,56,0.6)] ${className}`}>
      <img src={imageSrc} alt={partner} className="h-[38px] w-[38px] rounded-full object-cover" />
      <div className="pointer-events-none absolute left-1/2 top-[62px] z-20 w-[230px] -translate-x-1/2 translate-y-2 rounded-2xl border border-[#e8e8ee] bg-white px-4 py-3 text-left opacity-0 shadow-[0_24px_60px_-28px_rgba(45,24,56,0.45)] transition group-hover:translate-y-0 group-hover:opacity-100">
        <div className="truncate text-[13px] font-black text-[#2d1838]">{partner}</div>
        <div className="mt-1 line-clamp-2 text-[12px] font-semibold leading-4 text-[#6f6b76]">{meeting.postTitle}</div>
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.08em] text-[#7f9ca6]">
          <span>{statusLabel}</span>
          <span>{slot ? slot.time : ''}</span>
        </div>
        <div className="mt-1 text-[11px] font-bold text-[#9a95a1]">{dateLabel}</div>
      </div>
    </div>
  )
}
