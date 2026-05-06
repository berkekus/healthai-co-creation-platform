import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  Grid2X2,
  List,
  LocateFixed,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { ROUTES, postDetail } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { useSmartSuggestions } from '../../lib/gemini'
import { computeMatchReasons, getCombinedMatchScore } from '../../utils/matchPosts'
import type { CollaborationType, Post, PostAuthorRole, PostStatus, ProjectStage } from '../../types/post.types'

type PostedBy = 'Anyone' | 'Engineer' | 'Clinician'
type SortMode = 'best' | 'recent' | 'oldest' | 'expiring'
type ViewMode = 'list' | 'grid'

interface DirectoryPost {
  id: string
  initials: string
  tags: string[]
  title: string
  description: string
  author: string
  location: string
  daysLeft?: string
  stage: string
  type: string
  domain: string
  projectStage: ProjectStage
  status: PostStatus
  authorRole: PostAuthorRole
  country: string
  city: string
  expiryDate: string
  createdAt: string
  matchScore: number
  aiReason?: string
}

const mockPosts: DirectoryPost[] = [
  {
    id: 'mock-smoke',
    initials: 'SE',
    tags: ['In Turkey', 'Machine Learning', 'Cardiology', 'Active'],
    title: 'Smoke Test Post',
    description:
      'Automated smoke test post - safe to ignore. This is a sample listing to preview how opportunities will appear in the directory.',
    author: 'Smoke Engineer',
    location: 'Istanbul',
    daysLeft: '24D LEFT',
    stage: 'Idea',
    type: 'Research Partner',
    domain: 'Cardiology',
    projectStage: 'idea',
    status: 'active',
    authorRole: 'engineer',
    country: 'Turkey',
    city: 'Istanbul',
    expiryDate: new Date(Date.now() + 24 * 86400000).toISOString(),
    createdAt: '2026-05-01T10:00:00Z',
    matchScore: 0,
  },
  {
    id: 'mock-deneme',
    initials: 'DM',
    tags: ['In Ankara', 'Needs Engineering', 'Orthopedics', 'Active'],
    title: 'deneme',
    description: 'Sample collaboration request looking for technical support and project development.',
    author: 'Dr. Mehmet Arslan',
    location: 'Ankara',
    daysLeft: '283D LEFT',
    stage: 'Idea',
    type: 'Co-Founder',
    domain: 'Orthopedics',
    projectStage: 'idea',
    status: 'active',
    authorRole: 'healthcare_professional',
    country: 'Turkey',
    city: 'Ankara',
    expiryDate: new Date(Date.now() + 283 * 86400000).toISOString(),
    createdAt: '2026-04-30T10:00:00Z',
    matchScore: 0,
  },
  {
    id: 'mock-cgm',
    initials: 'AY',
    tags: ['Clinical Pharmacy', 'Partner Found'],
    title: 'AI-powered Continuous Glucose Monitoring',
    description:
      'Development of an intelligent CGM system using machine learning for predictive alerts and personalized insights.',
    author: 'Ahmet Yilmaz',
    location: 'Istanbul',
    stage: 'Prototype',
    type: 'Co-Founder',
    domain: 'Clinical Pharmacy',
    projectStage: 'prototype',
    status: 'partner_found',
    authorRole: 'engineer',
    country: 'Turkey',
    city: 'Istanbul',
    expiryDate: new Date(Date.now() + 120 * 86400000).toISOString(),
    createdAt: '2026-04-29T10:00:00Z',
    matchScore: 0,
  },
]

const domainOptions = ['Cardiology', 'Orthopedics', 'Clinical Pharmacy', 'Public Health & Epidemiology', 'Endocrinology & Diabetes']
const stageOptions: { value: ProjectStage; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'concept_validation', label: 'Concept Validation' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'pre_deployment', label: 'Pre-deployment' },
]
const statusOptions: { value: PostStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { value: 'partner_found', label: 'Partner Found' },
  { value: 'expired', label: 'Expired' },
  { value: 'draft', label: 'Draft' },
]

const stageLabels: Record<ProjectStage, string> = {
  idea: 'Idea',
  concept_validation: 'Concept Validation',
  prototype: 'Prototype',
  pilot: 'Pilot',
  pre_deployment: 'Pre-deployment',
}

const typeLabels: Record<CollaborationType, string> = {
  advisor: 'Advisor',
  co_founder: 'Co-Founder',
  research_partner: 'Research Partner',
  contract: 'Contract',
}

export default function PostListPage() {
  const { user } = useAuthStore()
  const { posts, fetchPosts, isLoading } = usePostStore()
  const { suggestions, isLoading: isMatching, load: loadSmartSuggestions, reset: resetSmartSuggestions } = useSmartSuggestions()
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [stage, setStage] = useState('')
  const [status, setStatus] = useState('')
  const [postedBy, setPostedBy] = useState<PostedBy>('Anyone')
  const [location, setLocation] = useState('Ankara')
  const [sort, setSort] = useState<SortMode>('best')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    fetchPosts({ limit: 100, filters: {} })
  }, [fetchPosts])

  useEffect(() => {
    if (!user || posts.length === 0) {
      resetSmartSuggestions()
      return
    }
    loadSmartSuggestions(user, posts)
  }, [loadSmartSuggestions, posts, resetSmartSuggestions, user])

  const directoryPosts = useMemo(() => {
    const source = posts.length > 0
      ? posts.map(post => toDirectoryPost(post, user, suggestions.get(post.id)))
      : mockPosts
    const query = search.trim().toLowerCase()

    return source
      .filter(post => {
        if (query) {
          const haystack = [post.title, post.description, post.domain, post.author, post.tags.join(' ')].join(' ').toLowerCase()
          if (!haystack.includes(query)) return false
        }
        if (domain && post.domain !== domain) return false
        if (stage && post.projectStage !== stage) return false
        if (status && post.status !== status) return false
        if (postedBy === 'Engineer' && post.authorRole !== 'engineer') return false
        if (postedBy === 'Clinician' && post.authorRole !== 'healthcare_professional') return false
        if (location.trim()) {
          const loc = location.trim().toLowerCase()
          if (!post.city.toLowerCase().includes(loc) && !post.country.toLowerCase().includes(loc)) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sort === 'best') {
          if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (sort === 'expiring') return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [domain, location, postedBy, posts, search, sort, stage, status, suggestions, user])

  const clearFilters = () => {
    setSearch('')
    setDomain('')
    setStage('')
    setStatus('')
    setPostedBy('Anyone')
    setLocation('')
  }

  return (
    <main
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{
        '--bg': '#f5f6f8',
        '--surface': '#ffffff',
        '--primary': '#2d1838',
        '--accent': '#8bddea',
        '--accent-soft': '#e8f9fc',
        '--text': '#26162f',
        '--muted': '#6f6a76',
        '--border': '#e7e7ec',
        '--tag-bg': '#f0f1f4',
        '--tag-text': '#5c5864',
      } as CSSProperties}
    >
      <div className="mx-auto w-full px-8 pb-16 pt-[70px]" style={{ maxWidth: 1760 }}>
        <PageHeader search={search} onSearch={setSearch} />

        <section className="directory-body-grid grid grid-cols-1 gap-8">
          <FilterSidebar
            domain={domain}
            stage={stage}
            status={status}
            postedBy={postedBy}
            location={location}
            onDomain={setDomain}
            onStage={setStage}
            onStatus={setStatus}
            onPostedBy={setPostededBySafe(setPostedBy)}
            onLocation={setLocation}
            onClear={clearFilters}
          />
          <PostList
            posts={directoryPosts}
            isLoading={isLoading && posts.length === 0}
            isMatching={isMatching}
            sort={sort}
            viewMode={viewMode}
            onSort={setSort}
            onViewMode={setViewMode}
          />
        </section>
      </div>
    </main>
  )
}

function setPostededBySafe(setter: (value: PostedBy) => void) {
  return (value: PostedBy) => setter(value)
}

function PageHeader({ search, onSearch }: { search: string; onSearch: (value: string) => void }) {
  return (
    <header className="mb-[52px]">
      <div className="mb-5 inline-flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        05 Directory
      </div>

      <div className="directory-header-grid grid grid-cols-1 gap-10 xl:items-end">
        <div>
          <h1 className="font-headline text-[58px] font-black leading-[0.98] tracking-normal md:text-[72px]">
            <span className="text-[var(--primary)]">Collaboration </span>
            <span className="text-[#78cbd8]">opportunities</span>
            <span className="text-[var(--primary)]">.</span>
          </h1>
          <p className="mt-5 text-[18px] font-semibold leading-8 text-[var(--muted)]">
            Browse & connect with clinicians and engineers working on real healthcare solutions.
          </p>
        </div>

        <SearchAndAction value={search} onChange={onSearch} />
      </div>
    </header>
  )
}

function SearchAndAction({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex items-center gap-12 max-sm:flex-col max-sm:items-stretch">
      <label className="relative block min-w-0 flex-1" style={{ height: 58 }}>
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#a5a0aa]" size={20} />
        <input
          type="search"
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Search by title, expertise, or keyword..."
          className="h-full w-full rounded-full border border-transparent bg-[#eceef2] pl-16 pr-6 text-sm font-semibold text-[var(--text)] outline-none transition placeholder:text-[#9a95a0] hover:bg-white hover:border-[var(--border)] focus:bg-white focus:border-[var(--accent)]"
        />
      </label>

      <Link
        to={ROUTES.POST_CREATE}
        className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[var(--primary)] text-sm font-black text-white shadow-[0_18px_42px_-28px_rgba(45,24,56,0.9)] transition hover:bg-[#1d1025]"
        style={{ width: 196, height: 58 }}
      >
        <Plus size={19} strokeWidth={2.6} />
        Post opportunity
      </Link>
    </div>
  )
}

function FilterSidebar({
  domain,
  stage,
  status,
  postedBy,
  location,
  onDomain,
  onStage,
  onStatus,
  onPostedBy,
  onLocation,
  onClear,
}: {
  domain: string
  stage: string
  status: string
  postedBy: PostedBy
  location: string
  onDomain: (value: string) => void
  onStage: (value: string) => void
  onStatus: (value: string) => void
  onPostedBy: (value: PostedBy) => void
  onLocation: (value: string) => void
  onClear: () => void
}) {
  return (
    <aside className="rounded-[28px] border border-[var(--border)] bg-white px-6 py-6 shadow-[0_30px_80px_-66px_rgba(45,24,56,0.65)] lg:self-start">
      <div className="mb-9 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.16em] text-[var(--primary)]">
          <SlidersHorizontal size={15} />
          Filters
        </div>
      </div>

      <div className="space-y-8">
        <FilterSelect label="Domain" value={domain} placeholder="All domains" onChange={onDomain}>
          {domainOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Project stage" value={stage} placeholder="All stages" onChange={onStage}>
          {stageOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Status" value={status} placeholder="All statuses" onChange={onStatus}>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </FilterSelect>
        <SegmentedControl active={postedBy} onChange={onPostedBy} />

        <div>
          <FilterLabel>Location</FilterLabel>
          <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-white">
            {location && (
              <div className="border-b border-[var(--border)] px-4 py-2.5">
                <button
                  onClick={() => onLocation('')}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--tag-bg)] px-3 py-1 text-[12px] font-black text-[var(--tag-text)] transition hover:text-[var(--primary)]"
                >
                  Near me · {location}
                  <span className="text-[13px]">×</span>
                </button>
              </div>
            )}
            <div className="relative">
              <input
                value={location}
                onChange={event => onLocation(event.target.value)}
                placeholder="Search city or country..."
                className="h-12 w-full bg-white px-4 pr-10 text-[13px] font-semibold text-[var(--text)] outline-none placeholder:text-[#aaa6b0]"
              />
              <LocateFixed size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-[var(--border)] pt-7">
        <button onClick={onClear} className="inline-flex items-center gap-3 rounded-full px-2 py-2 text-[14px] font-black text-[var(--muted)] transition hover:text-[var(--primary)]">
          <RotateCcw size={17} />
          Clear filters
        </button>
      </div>
    </aside>
  )
}

function FilterSelect({
  label,
  value,
  placeholder,
  onChange,
  children,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div>
      <FilterLabel>{label}</FilterLabel>
      <div className="relative">
        <select
          value={value}
          onChange={event => onChange(event.target.value)}
          className="h-[46px] w-full appearance-none rounded-[14px] border border-[var(--border)] bg-white px-4 pr-10 text-[13px] font-black text-[var(--text)] outline-none transition hover:border-[var(--accent)] focus:border-[var(--accent)]"
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
        <ChevronDown size={17} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary)]" />
      </div>
    </div>
  )
}

function FilterLabel({ children }: { children: ReactNode }) {
  return <div className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">{children}</div>
}

function SegmentedControl({ active, onChange }: { active: PostedBy; onChange: (value: PostedBy) => void }) {
  return (
    <div>
      <FilterLabel>Posted by</FilterLabel>
      <div className="grid grid-cols-3 rounded-[14px] border border-[var(--border)] bg-white p-1" style={{ height: 46 }}>
        {(['Anyone', 'Engineer', 'Clinician'] as PostedBy[]).map(item => (
          <button
            key={item}
            onClick={() => onChange(item)}
            className={`rounded-[11px] text-[12px] font-black transition ${
              active === item
                ? 'bg-[var(--primary)] text-white shadow-[0_10px_24px_-16px_rgba(45,24,56,0.8)]'
                : 'text-[var(--text)] hover:bg-[var(--tag-bg)]'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}

function PostList({
  posts,
  isLoading,
  isMatching,
  sort,
  viewMode,
  onSort,
  onViewMode,
}: {
  posts: DirectoryPost[]
  isLoading: boolean
  isMatching: boolean
  sort: SortMode
  viewMode: ViewMode
  onSort: (value: SortMode) => void
  onViewMode: (value: ViewMode) => void
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[0_30px_80px_-66px_rgba(45,24,56,0.65)]">
      <div className="flex h-[68px] items-center justify-between border-b border-[var(--border)] px-7">
        <div className="text-[15px] font-black text-[var(--muted)]">
          {isLoading ? 'Loading opportunities...' : `${posts.length} opportunities found${isMatching ? ' · matching...' : ''}`}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-[13px] font-black text-[var(--muted)]">
            <span>Sort by</span>
            <div className="relative">
              <select
                value={sort}
                onChange={event => onSort(event.target.value as SortMode)}
                className="appearance-none bg-transparent pr-6 text-[var(--text)] outline-none"
              >
                <option value="best">Best match</option>
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest</option>
                <option value="expiring">Expiring soon</option>
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-pressed={viewMode === 'grid'}
              onClick={() => onViewMode('grid')}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${viewMode === 'grid' ? 'bg-[var(--accent-soft)] text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--tag-bg)] hover:text-[var(--primary)]'}`}
            >
              <Grid2X2 size={17} />
            </button>
            <button
              aria-pressed={viewMode === 'list'}
              onClick={() => onViewMode('list')}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${viewMode === 'list' ? 'bg-[var(--accent-soft)] text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--tag-bg)] hover:text-[var(--primary)]'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="px-7 py-16 text-center text-[15px] font-semibold text-[var(--muted)]">
          No opportunities match your filters.
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'md:grid md:grid-cols-2' : ''}>
          {posts.map((post, index) => (
            <PostRow
              key={post.id}
              post={post}
              isLast={index === posts.length - 1}
              compact={viewMode === 'grid'}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function PostRow({ post, isLast, compact }: { post: DirectoryPost; isLast: boolean; compact: boolean }) {
  return (
    <Link
      to={post.id.startsWith('mock-') ? ROUTES.POSTS : postDetail(post.id)}
      className={`post-row block transition hover:bg-[#fbfcfd] ${compact ? 'post-row-compact' : ''} ${isLast ? '' : 'border-b border-[var(--border)]'}`}
      style={{ minHeight: compact ? 220 : 246, padding: '32px 28px' }}
    >
      <div style={{ paddingTop: compact ? 0 : 54 }}>
        <div
          className="flex shrink-0 items-center justify-center rounded-full bg-[#dff8ff] text-xs font-black tracking-[0.08em] text-[var(--primary)]"
          style={{ width: 42, height: 42 }}
        >
          {post.initials}
        </div>
      </div>

      <div className="min-w-0 pt-1">
        <div className="mb-6 flex flex-wrap gap-2">
          {post.tags.map(tag => (
            <Tag key={tag} label={tag} />
          ))}
          {post.aiReason && <Tag label={post.aiReason} />}
        </div>

        <h2 className="truncate font-headline text-2xl font-black leading-tight text-[var(--primary)]">{post.title}</h2>
        <p className="mt-4 max-w-[900px] break-words text-[15px] font-semibold leading-6 text-[var(--muted)]">{post.description}</p>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] font-black text-[var(--muted)]">
          <span className="text-[var(--primary)]">{post.author}</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} />
            {post.location}
          </span>
          {post.daysLeft && (
            <>
              <span className="text-[#d2d1d8]">|</span>
              <span className="uppercase tracking-[0.12em]">{post.daysLeft}</span>
            </>
          )}
        </div>
      </div>

      <div className="post-row-side flex flex-col items-end justify-between">
        <div className="flex items-center gap-3">
          <StatusPill label={post.stage} />
          <StatusPill label={post.type} />
        </div>
      </div>
    </Link>
  )
}

function Tag({ label }: { label: string }) {
  const cyan = ['In Turkey', 'Cardiology', 'Active', 'Clinical Pharmacy', 'Orthopedics'].includes(label)
  const green = label === 'In Ankara'
  const primary = ['Needs Engineering', 'Partner Found'].includes(label) || label.startsWith('AI:')

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] ${
        primary
          ? 'bg-[var(--primary)] text-white'
          : green
            ? 'bg-[#d8ff8f] text-[var(--tag-text)]'
            : cyan
              ? 'bg-[#dff8ff] text-[var(--tag-text)]'
              : 'bg-[var(--tag-bg)] text-[var(--tag-text)]'
      }`}
      style={{ height: 22 }}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-70" />
      {label}
    </span>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex min-w-24 items-center justify-center rounded-full border border-[var(--border)] bg-white px-4 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--tag-text)]" style={{ height: 32 }}>
      {label}
    </span>
  )
}

function toDirectoryPost(
  post: Post,
  user: ReturnType<typeof useAuthStore.getState>['user'],
  aiSuggestion?: { reason: string; score: number } | null,
): DirectoryPost {
  const days = Math.ceil((new Date(post.expiryDate).getTime() - Date.now()) / 86400000)
  const basicReasons = computeMatchReasons(post, user)
  const tags = [
    ...basicReasons.slice(0, 2).map(reason => reason.label),
    post.country ? `In ${post.country}` : '',
    post.domain,
    statusLabel(post.status),
  ].filter(Boolean)
  return {
    id: post.id,
    initials: initials(post.authorName),
    tags,
    title: post.title,
    description: post.description,
    author: post.authorName,
    location: post.city,
    daysLeft: days > 0 && post.status === 'active' ? `${days}D LEFT` : undefined,
    stage: stageLabels[post.projectStage],
    type: typeLabels[post.collaborationType],
    domain: post.domain,
    projectStage: post.projectStage,
    status: post.status,
    authorRole: post.authorRole,
    country: post.country,
    city: post.city,
    expiryDate: post.expiryDate,
    createdAt: post.createdAt,
    matchScore: user ? getCombinedMatchScore(post, user, aiSuggestion?.score) : 0,
    aiReason: aiSuggestion?.reason ? `AI: ${aiSuggestion.reason}` : undefined,
  }
}

function initials(name: string) {
  return name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function statusLabel(status: PostStatus) {
  const labels: Record<PostStatus, string> = {
    draft: 'Draft',
    active: 'Active',
    meeting_scheduled: 'Meeting Scheduled',
    partner_found: 'Partner Found',
    expired: 'Expired',
  }
  return labels[status]
}
