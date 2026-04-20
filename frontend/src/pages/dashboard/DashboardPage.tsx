import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { useMeetingStore } from '../../store/meetingStore'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const allPosts = usePostStore(s => s.posts)
  const allMeetings = useMeetingStore(s => s.meetings)

  const myPosts    = allPosts.filter(p => p.authorId === user?.id)
  const myMeetings = allMeetings.filter(m => m.requesterId === user?.id || m.ownerId === user?.id)
  const activePosts = allPosts.filter(p => p.status === 'active').length

  const pendingMeetings = myMeetings.filter(m => m.status === 'pending' || m.status === 'time_proposed')

  const stats: { label: string; value: number; icon: string; tint: string }[] = [
    { label: 'My Posts',        value: myPosts.length,    icon: 'article',       tint: '#B8F3FF' },
    { label: 'My Meetings',     value: myMeetings.length, icon: 'handshake',     tint: '#D2FF74' },
    { label: 'Active Listings', value: activePosts,       icon: 'visibility',    tint: '#E3DCD2' },
  ]

  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <PageWrapper maxWidth={1200}>
      {/* Header card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.15)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-hai-teal animate-pulse" />
            <span className="text-hai-plum/70">04</span>
            <span>Dashboard</span>
            {user?.role === 'admin' && (
              <>
                <span className="w-1 h-1 rounded-full bg-hai-plum/30" />
                <span className="text-hai-teal">admin</span>
              </>
            )}
          </div>

          <h1 className="font-headline font-bold text-[36px] md:text-[52px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-2">
            Welcome back,<br />
            <span className="text-hai-teal">{firstName}<span className="text-hai-plum">.</span></span>
          </h1>
          <p className="text-[15px] md:text-base text-neutral-600 leading-relaxed max-w-2xl font-body">
            {user?.role === 'admin'
              ? <>Platform administrator · <b className="text-hai-plum">{user?.institution}</b></>
              : <>Signed in as <b className="text-hai-plum">{user?.role === 'engineer' ? 'Engineer' : 'Healthcare Professional'}</b> · <b className="text-hai-plum">{user?.institution}</b></>}
          </p>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mt-7">
            <Link
              to={ROUTES.POST_CREATE}
              className="inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Post an opportunity
            </Link>
            <Link
              to={ROUTES.POSTS}
              className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-neutral-800 px-5 py-3 rounded-full font-bold text-sm hover:bg-neutral-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              Browse directory
            </Link>
            <Link
              to={ROUTES.MEETINGS}
              className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-neutral-800 px-5 py-3 rounded-full font-bold text-sm hover:bg-neutral-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">event</span>
              View meetings
              {pendingMeetings.length > 0 && (
                <span className="ml-1 bg-hai-plum text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {pendingMeetings.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stats.map(({ label, value, icon, tint }) => (
          <div
            key={label}
            className="bg-white rounded-[1.75rem] border border-neutral-100 p-6 shadow-sm hover:shadow-[0_20px_50px_-20px_rgba(54,33,62,0.2)] transition-shadow flex items-center gap-5"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: tint }}
            >
              <span className="material-symbols-outlined text-hai-plum text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                {icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-headline font-bold text-[40px] leading-none tracking-[-0.03em] text-hai-plum">
                {value}
              </div>
              <div className="text-[10.5px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mt-2">
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* My recent posts */}
        <div className="bg-white rounded-[1.75rem] border border-neutral-100 overflow-hidden">
          <div className="px-6 py-4 bg-hai-offwhite border-b border-neutral-100 flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
              My recent posts
            </span>
            <Link to={ROUTES.POSTS} className="text-[11px] font-mono tracking-[0.14em] uppercase text-hai-teal hover:text-hai-plum transition-colors font-bold">
              View all →
            </Link>
          </div>
          {myPosts.length > 0 ? (
            <ul className="divide-y divide-neutral-100">
              {myPosts.slice(0, 5).map(p => (
                <li key={p.id}>
                  <Link
                    to={`/posts/${p.id}`}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-hai-offwhite transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-body font-semibold text-[14.5px] text-hai-plum truncate">
                        {p.title}
                      </div>
                      <div className="text-[11px] font-mono tracking-wider uppercase text-neutral-500 mt-1 truncate">
                        {p.domain || 'General'}
                      </div>
                    </div>
                    <StatusChip status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow
              icon="article"
              title="No posts yet"
              cta={<Link to={ROUTES.POST_CREATE} className="text-hai-plum font-bold text-sm hover:text-hai-teal transition-colors">Create your first post →</Link>}
            />
          )}
        </div>

        {/* Meetings awaiting action */}
        <div className={`rounded-[1.75rem] border overflow-hidden ${pendingMeetings.length > 0 ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200' : 'bg-white border-neutral-100'}`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${pendingMeetings.length > 0 ? 'bg-amber-100/40 border-amber-200' : 'bg-hai-offwhite border-neutral-100'}`}>
            <span className="text-[10px] font-mono tracking-[0.18em] uppercase font-bold flex items-center gap-2 text-hai-plum">
              {pendingMeetings.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
              Meetings awaiting action
            </span>
            <Link to={ROUTES.MEETINGS} className="text-[11px] font-mono tracking-[0.14em] uppercase text-hai-teal hover:text-hai-plum transition-colors font-bold">
              View all →
            </Link>
          </div>
          {pendingMeetings.length > 0 ? (
            <ul className="divide-y divide-amber-100">
              {pendingMeetings.map(m => (
                <li key={m.id}>
                  <Link to={ROUTES.MEETINGS} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-amber-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="font-body font-semibold text-[14.5px] text-hai-plum truncate">
                        {m.postTitle}
                      </div>
                      <div className="text-[11px] font-mono tracking-wider uppercase text-amber-700 mt-1 font-bold">
                        {m.status === 'time_proposed' ? 'Time proposed' : 'Pending'}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono tracking-[0.14em] uppercase text-amber-800 font-bold shrink-0">
                      Action →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow
              icon="check_circle"
              title="All caught up"
              subtitle="No pending meetings."
            />
          )}
        </div>
      </div>
    </PageWrapper>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    draft:              { label: 'Draft',             bg: 'bg-neutral-100',   text: 'text-neutral-600' },
    active:             { label: 'Active',            bg: 'bg-hai-mint',      text: 'text-hai-plum' },
    meeting_scheduled:  { label: 'Meeting',           bg: 'bg-hai-lime',      text: 'text-hai-plum' },
    partner_found:      { label: 'Partner Found',     bg: 'bg-hai-plum',      text: 'text-hai-mint' },
    expired:            { label: 'Expired',           bg: 'bg-neutral-200',   text: 'text-neutral-500' },
  }
  const s = map[status] ?? { label: status, bg: 'bg-neutral-100', text: 'text-neutral-600' }
  return (
    <span className={`text-[10px] font-mono tracking-[0.14em] uppercase font-bold px-2.5 py-1 rounded-full shrink-0 ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function EmptyRow({ icon, title, subtitle, cta }: { icon: string; title: string; subtitle?: string; cta?: React.ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-hai-offwhite mb-3">
        <span className="material-symbols-outlined text-hai-plum/50 text-[24px]">{icon}</span>
      </div>
      <div className="font-body font-bold text-hai-plum text-[15px]">{title}</div>
      {subtitle && <div className="text-[13px] text-neutral-500 mt-1 font-body">{subtitle}</div>}
      {cta && <div className="mt-3">{cta}</div>}
    </div>
  )
}
