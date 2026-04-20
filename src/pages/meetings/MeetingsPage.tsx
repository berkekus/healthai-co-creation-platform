import { useMemo, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useMeetingStore } from '../../store/meetingStore'
import MeetingCard from '../../components/meetings/MeetingCard'
import PageWrapper from '../../components/layout/PageWrapper'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import type { Meeting, MeetingStatus } from '../../types/meeting.types'

type TabId = 'all' | 'incoming' | 'outgoing' | 'confirmed'

interface TabSpec {
  id: TabId
  label: string
  icon: string
  count: number
}

function statusOrder(s: MeetingStatus): number {
  return { pending: 0, time_proposed: 1, confirmed: 2, declined: 3, cancelled: 4 }[s]
}

export default function MeetingsPage() {
  const { user } = useAuthStore()
  const { getByUser } = useMeetingStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('all')

  const all = user ? getByUser(user.id) : []

  const buckets = useMemo(() => {
    const sortFn = (a: Meeting, b: Meeting) => {
      const so = statusOrder(a.status) - statusOrder(b.status)
      if (so !== 0) return so
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
    const incoming  = all.filter(m => m.ownerId === user?.id).sort(sortFn)
    const outgoing  = all.filter(m => m.requesterId === user?.id).sort(sortFn)
    const confirmed = all.filter(m => m.status === 'confirmed').sort(sortFn)
    return { incoming, outgoing, confirmed, all: [...all].sort(sortFn) }
  }, [all, user?.id])

  const pendingIncoming = buckets.incoming.filter(m => m.status === 'pending' || m.status === 'time_proposed').length

  const tabs: TabSpec[] = [
    { id: 'all',       label: 'All',       icon: 'inbox',        count: buckets.all.length },
    { id: 'incoming',  label: 'Incoming',  icon: 'call_received', count: buckets.incoming.length },
    { id: 'outgoing',  label: 'Outgoing',  icon: 'call_made',     count: buckets.outgoing.length },
    { id: 'confirmed', label: 'Confirmed', icon: 'check_circle',  count: buckets.confirmed.length },
  ]

  const list =
    tab === 'all'       ? buckets.all :
    tab === 'incoming'  ? buckets.incoming :
    tab === 'outgoing'  ? buckets.outgoing :
                          buckets.confirmed

  const emptyCopy: Record<TabId, { title: string; body: string }> = {
    all:       { title: 'No meetings yet.',           body: 'Browse the directory and express interest in a listing to schedule your first meeting.' },
    incoming:  { title: 'No incoming requests.',      body: 'When other members express interest in your posts, their requests will appear here.' },
    outgoing:  { title: 'No outgoing requests.',      body: 'Found a post you\'d like to explore? Express interest to start scheduling.' },
    confirmed: { title: 'No confirmed meetings yet.', body: 'Once a slot is accepted by the post owner, the confirmed meeting appears here.' },
  }

  return (
    <PageWrapper maxWidth={1120}>
      {/* Header card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
            <span className="text-hai-plum/70">11</span>
            <span>Meetings</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="min-w-0">
              <h1 className="font-headline font-bold text-[40px] md:text-[56px] leading-[0.98] tracking-[-0.035em] text-hai-plum">
                Your meetings<span className="text-hai-teal">.</span>
              </h1>
              <p className="text-[15px] text-neutral-600 leading-relaxed mt-3 max-w-xl">
                Review requests, confirm time slots, and keep your collaboration pipeline in motion.
              </p>
            </div>

            {/* Stats ribbon */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-hai-offwhite rounded-full px-4 py-2 font-mono text-[10.5px] tracking-[0.14em] uppercase font-bold text-hai-plum">
                <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
                {buckets.all.length} total
              </div>
              {pendingIncoming > 0 && (
                <div className="inline-flex items-center gap-2 bg-hai-lime rounded-full px-4 py-2 font-mono text-[10.5px] tracking-[0.14em] uppercase font-bold text-hai-plum">
                  <span className="w-1.5 h-1.5 rounded-full bg-hai-plum animate-pulse" />
                  {pendingIncoming} awaiting you
                </div>
              )}
              {buckets.confirmed.length > 0 && (
                <div className="inline-flex items-center gap-2 bg-hai-plum rounded-full px-4 py-2 font-mono text-[10.5px] tracking-[0.14em] uppercase font-bold text-hai-mint">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                  {buckets.confirmed.length} confirmed
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {buckets.all.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[11.5px] font-mono tracking-[0.14em] uppercase font-bold transition-colors ${
                  active
                    ? 'bg-hai-plum text-white'
                    : 'bg-white border border-neutral-200 text-hai-plum hover:bg-hai-mint/40'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: '"FILL" 1' }}>{t.icon}</span>
                {t.label}
                <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] px-1.5 font-bold ${
                  active ? 'bg-hai-mint text-hai-plum' : 'bg-hai-offwhite text-hai-plum'
                }`}>
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Body */}
      {list.length === 0 ? (
        <div className="bg-white rounded-[1.75rem] border border-neutral-100 py-16 px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hai-mint/40 mb-4">
            <span className="material-symbols-outlined text-hai-plum text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              {buckets.all.length === 0 ? 'inbox' : 'filter_alt_off'}
            </span>
          </div>
          <h2 className="font-headline font-bold text-2xl text-hai-plum mb-2">{emptyCopy[tab].title}</h2>
          <p className="text-[14.5px] text-neutral-600 mb-6 max-w-sm mx-auto leading-relaxed">
            {emptyCopy[tab].body}
          </p>
          {buckets.all.length === 0 ? (
            <button
              onClick={() => navigate(ROUTES.POSTS)}
              className="inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
            >
              Browse directory <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              onClick={() => setTab('all')}
              className="inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
            >
              Show all meetings
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map(m => <MeetingCard key={m.id} meeting={m} />)}
        </div>
      )}
    </PageWrapper>
  )
}
