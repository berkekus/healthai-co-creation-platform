import { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreHorizontal,
  PieChart,
  Plus,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

type TabId = 'all' | 'incoming' | 'outgoing' | 'confirmed' | 'cancelled'
type MeetingStatus = 'Pending review' | 'Confirmed' | 'Cancelled'

interface MeetingItem {
  initials: string
  title: string
  status: MeetingStatus
  direction: 'Incoming' | 'Outgoing'
  doctor: string
  specialty: string
  date: string
  time: string
}

const meetings: MeetingItem[] = [
  {
    initials: 'DM',
    title: 'deneme',
    status: 'Pending review',
    direction: 'Outgoing',
    doctor: 'Dr. Mehmet Arslan',
    specialty: 'Orthopedics',
    date: '1 May 2026',
    time: '15:22',
  },
  {
    initials: 'DM',
    title: 'testst',
    status: 'Confirmed',
    direction: 'Incoming',
    doctor: 'Dr. Mehmet Arslan',
    specialty: 'Cardiology',
    date: '30 Apr 2026',
    time: '16:40',
  },
  {
    initials: 'AY',
    title: 'AI-powered Continuous Glucose Monitoring',
    status: 'Confirmed',
    direction: 'Incoming',
    doctor: 'Dr. Fatma Celik',
    specialty: 'Endocrinology',
    date: '29 Apr 2026',
    time: '11:15',
  },
  {
    initials: 'DF',
    title: 'AI-powered Continuous Glucose Monitoring',
    status: 'Confirmed',
    direction: 'Incoming',
    doctor: 'Dr. Fatma Celik',
    specialty: 'Endocrinology',
    date: '28 Apr 2026',
    time: '09:20',
  },
  {
    initials: 'SE',
    title: 'COUNTRYCITYDROPDOWNDENEME',
    status: 'Confirmed',
    direction: 'Outgoing',
    doctor: 'Dr. Mehmet Arslan',
    specialty: 'Public Health',
    date: '27 Apr 2026',
    time: '14:05',
  },
]

const tabs: { id: TabId; label: string; count: number }[] = [
  { id: 'all', label: 'All', count: 11 },
  { id: 'incoming', label: 'Incoming', count: 4 },
  { id: 'outgoing', label: 'Outgoing', count: 3 },
  { id: 'confirmed', label: 'Confirmed', count: 4 },
  { id: 'cancelled', label: 'Cancelled', count: 2 },
]

const days = Array.from({ length: 31 }, (_, index) => index + 1)
const calendarOffset = Array.from({ length: 5 }, (_, index) => `blank-${index}`)
const dottedDays = new Set([4, 8, 14, 18, 23, 27])

export default function MeetingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all')

  return (
    <main
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{
        '--bg': '#f5f6f8',
        '--surface': '#ffffff',
        '--primary': '#2d1838',
        '--accent': '#8fdff0',
        '--accent-strong': '#55c7df',
        '--text': '#25172f',
        '--muted': '#6f6a76',
        '--border': '#e8e8ee',
        '--success-bg': '#dff8ff',
        '--pending-bg': '#d8ff8f',
        '--cancelled-bg': '#eeeeee',
      } as CSSProperties}
    >
      <section className="mx-auto w-full max-w-[1640px] px-6 pb-20 pt-[72px] md:px-10 2xl:px-0">
        <Hero />

        <div className="mt-11 flex flex-col gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs activeTab={activeTab} onChange={setActiveTab} />
            <SortControl />
          </div>

          <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.41fr)]">
            <MeetingList />
            <aside>
              <WidgetArea />
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

function Hero() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[var(--primary)] shadow-[0_10px_30px_-24px_rgba(45,24,56,0.5)]">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          11 meetings
        </div>

        <h1 className="mt-5 font-headline text-[58px] font-black leading-[0.98] tracking-normal text-[var(--primary)] md:text-[78px]">
          Your <span className="text-[var(--accent-strong)]">meetings</span>
          <span className="text-[var(--primary)]">.</span>
        </h1>

        <p className="mt-5 max-w-[650px] text-[18px] leading-8 text-[var(--muted)]">
          Review requests, confirm time slots, and keep your collaboration pipeline in motion.
        </p>
      </div>

      <button
        onClick={() => navigate(ROUTES.POSTS)}
        className="inline-flex h-14 items-center justify-center gap-2.5 self-start rounded-full bg-[var(--primary)] px-7 text-[15px] font-extrabold text-white shadow-[0_16px_34px_-22px_rgba(45,24,56,0.8)] transition hover:bg-[#1b1022]"
      >
        <Plus size={18} strokeWidth={2.6} />
        New meeting request
      </button>
    </div>
  )
}

function FilterTabs({ activeTab, onChange }: { activeTab: TabId; onChange: (tab: TabId) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {tabs.map(tab => {
        const active = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`inline-flex h-12 items-center gap-2.5 rounded-full border px-5 text-[14px] font-extrabold transition ${
              active
                ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_12px_28px_-22px_rgba(45,24,56,0.9)]'
                : 'border-[var(--border)] bg-white text-[var(--text)] hover:border-[var(--accent)] hover:bg-white'
            }`}
          >
            {tab.label}
            <span
              className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-black ${
                active ? 'bg-[var(--accent)] text-[var(--primary)]' : 'bg-[#f0f1f4] text-[var(--muted)]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SortControl() {
  return (
    <div className="flex items-center gap-3 text-[13px] font-bold text-[var(--muted)]">
      <span>Sort by</span>
      <button className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 text-[13px] font-extrabold text-[var(--text)] transition hover:border-[var(--accent)]">
        Most recent
        <ChevronDown size={16} />
      </button>
    </div>
  )
}

function MeetingList() {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_24px_70px_-54px_rgba(45,24,56,0.5)]">
      {meetings.map((meeting, index) => (
        <MeetingRow key={`${meeting.title}-${meeting.date}`} meeting={meeting} isLast={index === meetings.length - 1} />
      ))}

      <div className="flex h-[76px] items-center justify-center border-t border-[var(--border)]">
        <button className="text-[14px] font-extrabold text-[var(--primary)] transition hover:text-[var(--accent-strong)]">
          View all meetings →
        </button>
      </div>
    </section>
  )
}

function MeetingRow({ meeting, isLast }: { meeting: MeetingItem; isLast: boolean }) {
  const statusClass =
    meeting.status === 'Confirmed'
      ? 'bg-[var(--success-bg)] text-[var(--primary)]'
      : meeting.status === 'Pending review'
        ? 'bg-[var(--pending-bg)] text-[var(--primary)]'
        : 'bg-[var(--cancelled-bg)] text-[var(--muted)]'

  return (
    <article
      className={`grid min-h-[115px] grid-cols-[52px_minmax(0,1fr)_minmax(152px,0.22fr)_36px] items-center gap-5 px-7 transition hover:bg-[#fbfcfd] max-md:grid-cols-[46px_minmax(0,1fr)_34px] max-md:py-5 ${
        isLast ? '' : 'border-b border-[var(--border)]'
      }`}
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[var(--primary)] text-[12px] font-black tracking-[0.08em] text-[var(--accent)]">
        {meeting.initials}
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="truncate font-headline text-[17px] font-extrabold text-[var(--text)]">{meeting.title}</h2>
          <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${statusClass}`}>
            {meeting.status}
          </span>
        </div>
        <p className="mt-2 truncate text-[14px] font-semibold text-[var(--muted)]">
          {meeting.direction} <span className="px-1.5 text-[#bbb8c2]">•</span> {meeting.doctor}{' '}
          <span className="px-1.5 text-[#bbb8c2]">•</span> {meeting.specialty}
        </p>
      </div>

      <div className="space-y-2 text-[14px] font-bold text-[var(--muted)] max-md:hidden">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[var(--primary)]" />
          {meeting.date}
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[var(--primary)]" />
          {meeting.time}
        </div>
      </div>

      <button aria-label="Meeting actions" className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[#f0f1f4] hover:text-[var(--primary)]">
        <MoreHorizontal size={20} />
      </button>
    </article>
  )
}

function WidgetArea() {
  return (
    <div className="relative">
      <div className="mb-6 flex items-start justify-end gap-4 pr-2">
        <div className="relative mr-2 mt-1 hidden w-[190px] text-right text-[13px] font-bold leading-snug text-[var(--accent-strong)] sm:block">
          Takvim ve overview etkileşimle açılır
          <svg className="absolute -right-10 top-7 h-12 w-12 overflow-visible" viewBox="0 0 64 64" fill="none">
            <path d="M4 9C20 10 24 35 50 37" stroke="#55c7df" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 6" />
            <path d="M42 29L51 38L39 43" stroke="#55c7df" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <IconButton icon={<Calendar size={20} />} label="Open calendar" />
        <IconButton icon={<PieChart size={20} />} label="Open overview" />
      </div>

      <div className="space-y-6">
        <CalendarPanel />
        <OverviewPanel />
      </div>
    </div>
  )
}

function IconButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--primary)] shadow-[0_18px_45px_-32px_rgba(45,24,56,0.72)] transition hover:border-[var(--accent)] hover:bg-[var(--success-bg)]"
    >
      {icon}
    </button>
  )
}

function CalendarPanel() {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_28px_70px_-54px_rgba(45,24,56,0.6)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-headline text-[18px] font-extrabold text-[var(--primary)]">May 2026</h2>
        <div className="flex items-center gap-1.5">
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#f0f1f4]">
            <ChevronLeft size={16} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#f0f1f4]">
            <ChevronRight size={16} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#f0f1f4]">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={`${day}-${index}`} className="text-center text-[11px] font-black uppercase text-[#b6b1bd]">
            {day}
          </div>
        ))}
        {calendarOffset.map(item => (
          <div key={item} />
        ))}
        {days.map(day => (
          <div key={day} className="flex h-10 items-center justify-center">
            <button
              className={`relative flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-extrabold transition ${
                day === 10 ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[#f0f1f4]'
              }`}
            >
              {day}
              {dottedDays.has(day) && (
                <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${day === 10 ? 'bg-white' : 'bg-[var(--accent-strong)]'}`} />
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function OverviewPanel() {
  const legend = [
    { label: 'Pending review', value: 1, percent: '9%', color: '#d8ff8f' },
    { label: 'Confirmed', value: 4, percent: '36%', color: '#8fdff0' },
    { label: 'Incoming', value: 4, percent: '36%', color: '#2d1838' },
    { label: 'Outgoing', value: 3, percent: '27%', color: '#55c7df' },
  ]

  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[0_28px_70px_-54px_rgba(45,24,56,0.6)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-headline text-[18px] font-extrabold text-[var(--primary)]">Meetings overview</h2>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-3 text-[12px] font-extrabold text-[var(--text)]">
            This month
            <ChevronDown size={14} />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[#f0f1f4]">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <DonutChart />
        <div className="mt-5 w-full space-y-3.5">
          {legend.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-4 text-[14px]">
              <div className="flex items-center gap-2.5 font-bold text-[var(--muted)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </div>
              <div className="font-black text-[var(--primary)]">
                {item.value} <span className="text-[12px] text-[var(--muted)]">({item.percent})</span>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-6 text-[14px] font-extrabold text-[var(--primary)] hover:text-[var(--accent-strong)]">
          View analytics →
        </button>
      </div>
    </section>
  )
}

function DonutChart() {
  return (
    <div className="relative h-[178px] w-[178px]">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r="67" fill="none" stroke="#f0f1f4" strokeWidth="22" />
        <circle cx="90" cy="90" r="67" fill="none" stroke="#d8ff8f" strokeWidth="22" strokeDasharray="38 421" strokeDashoffset="0" />
        <circle cx="90" cy="90" r="67" fill="none" stroke="#8fdff0" strokeWidth="22" strokeDasharray="151 421" strokeDashoffset="-45" />
        <circle cx="90" cy="90" r="67" fill="none" stroke="#2d1838" strokeWidth="22" strokeDasharray="151 421" strokeDashoffset="-203" />
        <circle cx="90" cy="90" r="67" fill="none" stroke="#55c7df" strokeWidth="22" strokeDasharray="114 421" strokeDashoffset="-360" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-headline text-[32px] font-black leading-none text-[var(--primary)]">11</span>
        <span className="mt-1 text-[13px] font-extrabold text-[var(--muted)]">Total</span>
      </div>
    </div>
  )
}
