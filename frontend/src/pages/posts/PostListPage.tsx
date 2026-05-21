import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Grid2X2,
  Sparkles,
  List,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../lib/api'
import { Skeleton, SkeletonLine, SkeletonPill } from '../../components/ui/Skeleton'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState as UiEmptyState,
  FieldLabel,
  IconButton,
  SectionCard,
  SelectInput,
  TextInput,
} from '../../components/ui'
import { ROUTES, postDetail } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { useSmartSuggestions } from '../../lib/gemini'
import { computeMatchReasons, getCombinedMatchScore } from '../../utils/matchPosts'
import type { CollaborationType, CommitmentLevel, Post, PostAuthorRole, PostStatus, ProjectStage } from '../../types/post.types'

type PostedBy = 'Anyone' | 'Engineer' | 'Healthcare Professional'

const POSTED_BY_SHORT: Record<PostedBy, string> = {
  'Anyone': 'Anyone',
  'Engineer': 'Engineer',
  'Healthcare Professional': 'Clinician',
}
type SortMode = 'best' | 'recent' | 'oldest' | 'expiring'
type ViewMode = 'list' | 'grid'
const POSTS_PER_PAGE = 5

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
  commitment: string
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
  hasAI: boolean
}

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

const commitmentLabels: Record<CommitmentLevel, string> = {
  flexible: 'Flexible',
  low: 'Light advisory',
  medium: 'Part-time',
  high: 'High commitment',
}

export default function PostListPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { posts, fetchPosts, isLoading, remove } = usePostStore()
  const { suggestions, isLoading: isMatching, load: loadSmartSuggestions, reset: resetSmartSuggestions } = useSmartSuggestions()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [domain, setDomain] = useState('')
  const [stage, setStage] = useState('')
  const [status, setStatus] = useState('')
  const [postedBy, setPostedBy] = useState<PostedBy>('Anyone')
  const [location, setLocation] = useState('')
  const [sort, setSort] = useState<SortMode>(() => (localStorage.getItem('postList_sort') as SortMode) ?? 'best')
  const [viewMode, setViewMode] = useState<ViewMode>(() => (localStorage.getItem('postList_view') as ViewMode) ?? 'list')
  const [page, setPage] = useState(1)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const mineOnly = searchParams.get('mine') === 'true'

  useEffect(() => {
    fetchPosts({ limit: 100, mine: mineOnly, filters: {} })
  }, [fetchPosts, mineOnly])

  useEffect(() => {
    if (!user || posts.length === 0) {
      resetSmartSuggestions()
      return
    }
    loadSmartSuggestions(user, posts)
  }, [loadSmartSuggestions, posts, resetSmartSuggestions, user])

  const hasActiveFilters = Boolean(search.trim() || domain || stage || status || location.trim() || postedBy !== 'Anyone')

  const directoryPosts = useMemo(() => {
    const source = posts.map(post => toDirectoryPost(post, user, suggestions.get(post.id)))
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
        if (postedBy === 'Healthcare Professional' && post.authorRole !== 'healthcare_professional') return false
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
    setPage(1)
  }

  const saveCurrentSearch = async () => {
    const filterParts: string[] = []
    if (domain) filterParts.push(domain)
    if (stage) filterParts.push(stage)
    if (postedBy !== 'Anyone') filterParts.push(postedBy)
    if (location.trim()) filterParts.push(location.trim())
    if (search.trim()) filterParts.push(`"${search.trim()}"`)
    const defaultName = filterParts.length > 0 ? filterParts.join(' · ') : 'All posts'
    const name = window.prompt('Name this saved search:', defaultName)
    if (!name) return
    try {
      await api.post('/saved-searches', {
        name: name.trim(),
        filters: {
          domain: domain || undefined,
          expertise: search.trim() || undefined,
          city: location.trim() || undefined,
          projectStage: stage || undefined,
          authorRole: postedBy === 'Engineer' ? 'engineer' : postedBy === 'Healthcare Professional' ? 'healthcare_professional' : undefined,
        },
      })
      window.alert(`Search "${name.trim()}" saved! You'll be notified when new matching posts are published.`)
    } catch {
      window.alert('Could not save search. Try again.')
    }
  }

  useEffect(() => {
    setPage(1)
  }, [domain, location, postedBy, search, sort, stage, status, viewMode])

  const totalPages = Math.max(1, Math.ceil(directoryPosts.length / POSTS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedPosts = directoryPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE,
  )

  const deletePost = async (postId: string) => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return
    setDeletingPostId(postId)
    try {
      await remove(postId)
    } finally {
      setDeletingPostId(null)
    }
  }

  const locationSuggestions = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    for (const p of posts) {
      if (p.city && !seen.has(p.city)) { seen.add(p.city); result.push(p.city) }
      if (p.country && !seen.has(p.country)) { seen.add(p.country); result.push(p.country) }
    }
    return result
  }, [posts])

  return (
    <main
      className="min-h-screen bg-[var(--bg)] text-[var(--text)]"
      style={{
        '--bg': '#F3F4F6',
        '--surface': '#ffffff',
        '--primary': '#36213E',
        '--accent': '#8AC6D0',
        '--accent-soft': '#E8F4F7',
        '--text': '#36213E',
        '--muted': '#6F6878',
        '--border': '#E3E7EC',
        '--tag-bg': '#EEF0F3',
        '--tag-text': '#6F6878',
      } as CSSProperties}
    >
      <div className="mx-auto w-full px-8 pb-16 pt-[70px]" style={{ maxWidth: 1760 }}>
        <PageHeader search={search} onSearch={setSearch} mineOnly={mineOnly} />

        <section className="directory-body-grid grid grid-cols-1 gap-8">
          <FilterSidebar
            domain={domain}
            stage={stage}
            status={status}
            postedBy={postedBy}
            location={location}
            locationSuggestions={locationSuggestions}
            hasActiveFilters={hasActiveFilters}
            onDomain={setDomain}
            onStage={setStage}
            onStatus={setStatus}
            onPostedBy={setPostededBySafe(setPostedBy)}
            onLocation={setLocation}
            onClear={clearFilters}
          />
          {hasActiveFilters && user && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={saveCurrentSearch}
                className="inline-flex items-center gap-2 rounded-full border border-[#D5DAE0] bg-white px-4 py-2 text-xs font-black text-hai-plum hover:bg-hai-mint/30 transition-colors"
              >
                <Bookmark size={13} />
                {t('posts.saveSearch')}
              </button>
            </div>
          )}
          <PostList
            posts={paginatedPosts}
            totalPosts={directoryPosts.length}
            mineOnly={mineOnly}
            isLoading={isLoading && posts.length === 0}
            isMatching={isMatching}
            aiError={Boolean(user && !isMatching && posts.length > 0 && suggestions.size === 0)}
            hasActiveFilters={hasActiveFilters}
            sort={sort}
            viewMode={viewMode}
            onSort={v => { setSort(v); localStorage.setItem('postList_sort', v) }}
            onViewMode={v => { setViewMode(v); localStorage.setItem('postList_view', v) }}
            onClear={clearFilters}
            page={currentPage}
            totalPages={totalPages}
            onPage={setPage}
            onDelete={deletePost}
            deletingPostId={deletingPostId}
          />
        </section>
      </div>
    </main>
  )
}

function setPostededBySafe(setter: (value: PostedBy) => void) {
  return (value: PostedBy) => setter(value)
}

function PageHeader({ search, onSearch, mineOnly }: { search: string; onSearch: (value: string) => void; mineOnly: boolean }) {
  return (
    <header className="mb-[52px]">
      <div className="mb-5 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--muted)]">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        {mineOnly ? '05 My Posts' : '05 Directory'}
      </div>

      <div className="directory-header-grid grid grid-cols-1 gap-10 xl:items-end">
        <div>
          <h1 className="font-headline text-6xl font-black leading-tight tracking-normal md:text-7xl">
            {mineOnly ? (
              <>
                <span className="text-[var(--primary)]">Your </span>
                <span className="text-[#8AC6D0]">posts</span>
              </>
            ) : (
              <>
                <span className="text-[var(--primary)]">Collaboration </span>
                <span className="text-[#8AC6D0]">opportunities</span>
              </>
            )}
            <span className="text-[var(--primary)]">.</span>
          </h1>
          <p className="mt-5 text-lg font-semibold leading-8 text-[var(--muted)]">
            {mineOnly
              ? 'Review, open, and manage the opportunities you have published.'
              : 'Browse & connect with clinicians and engineers working on real healthcare solutions.'}
          </p>
          {mineOnly && (
            <Link to={ROUTES.POSTS} className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#8AC6D0] transition hover:text-[#36213E]">
              View full directory
              <ChevronRight size={15} />
            </Link>
          )}
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
        <TextInput
          type="search"
          value={value}
          onChange={event => onChange(event.target.value)}
          leftIcon={<Search size={20} />}
          placeholder="Search by title, expertise, or keyword..."
          className="h-full rounded-full border-transparent bg-[#EEF0F3] pl-16 pr-6 text-[var(--text)] hover:bg-white hover:border-[var(--border)] focus:bg-white focus:border-[var(--accent)]"
        />
      </label>

      <ButtonLink
        to={ROUTES.POST_CREATE}
        variant="primary"
        size="lg"
        icon={<Plus size={19} strokeWidth={2.6} />}
        className="w-[196px]"
      >
        Post opportunity
      </ButtonLink>
    </div>
  )
}

function FilterSidebar({
  domain,
  stage,
  status,
  postedBy,
  location,
  locationSuggestions,
  hasActiveFilters,
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
  locationSuggestions: string[]
  hasActiveFilters: boolean
  onDomain: (value: string) => void
  onStage: (value: string) => void
  onStatus: (value: string) => void
  onPostedBy: (value: PostedBy) => void
  onLocation: (value: string) => void
  onClear: () => void
}) {
  return (
    <aside className="lg:self-start">
      <Card padding="md" className="rounded-[28px] border-[var(--border)] shadow-[0_30px_80px_-66px_rgba(45,24,56,0.65)]">
      <div className="mb-9 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--primary)]">
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
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--tag-bg)] px-3 py-1 text-xs font-black text-[var(--tag-text)] transition hover:text-[var(--primary)]"
                >
                  Near me · {location}
                  <span className="text-sm">×</span>
                </button>
              </div>
            )}
            <div className="relative">
              <TextInput
                value={location}
                onChange={event => onLocation(event.target.value)}
                placeholder="Search city or country..."
                list="location-suggestions"
                autoComplete="off"
                className="h-12 rounded-none border-0 text-[var(--text)]"
              />
              <datalist id="location-suggestions">
                {locationSuggestions.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-10 border-t border-[var(--border)] pt-7">
          <Button onClick={onClear} variant="ghost" size="sm" icon={<RotateCcw size={17} />} className="-ml-4 text-[var(--muted)] hover:text-[var(--primary)]">
            Clear filters
          </Button>
        </div>
      )}
      </Card>
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
      <SelectInput
        value={value}
        onChange={event => onChange(event.target.value)}
        className="border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] focus:border-[var(--accent)]"
      >
        <option value="">{placeholder}</option>
        {children}
      </SelectInput>
    </div>
  )
}

function FilterLabel({ children }: { children: ReactNode }) {
  return <FieldLabel className="text-[var(--muted)]">{children}</FieldLabel>
}

function SegmentedControl({ active, onChange }: { active: PostedBy; onChange: (value: PostedBy) => void }) {
  return (
    <div>
      <FilterLabel>Posted by</FilterLabel>
      <div className="grid grid-cols-3 rounded-[14px] border border-[var(--border)] bg-white p-1" style={{ height: 46 }}>
        {(['Anyone', 'Engineer', 'Healthcare Professional'] as PostedBy[]).map(item => (
          <button
            key={item}
            onClick={() => onChange(item)}
            title={item}
            className={`rounded-[11px] text-xs font-black transition ${
              active === item
                ? 'bg-[var(--primary)] text-white shadow-[0_10px_24px_-16px_rgba(45,24,56,0.8)]'
                : 'text-[var(--text)] hover:bg-[var(--tag-bg)]'
            }`}
          >
            {POSTED_BY_SHORT[item]}
          </button>
        ))}
      </div>
    </div>
  )
}

function PostList({
  posts,
  totalPosts,
  mineOnly,
  isLoading,
  isMatching,
  aiError,
  hasActiveFilters,
  sort,
  viewMode,
  onSort,
  onViewMode,
  onClear,
  page,
  totalPages,
  onPage,
  onDelete,
  deletingPostId,
}: {
  posts: DirectoryPost[]
  totalPosts: number
  mineOnly: boolean
  isLoading: boolean
  isMatching: boolean
  aiError: boolean
  hasActiveFilters: boolean
  sort: SortMode
  viewMode: ViewMode
  onSort: (value: SortMode) => void
  onViewMode: (value: ViewMode) => void
  onClear: () => void
  page: number
  totalPages: number
  onPage: (page: number) => void
  onDelete: (postId: string) => void
  deletingPostId: string | null
}) {
  return (
    <SectionCard className="border-[var(--border)] shadow-[0_30px_80px_-66px_rgba(45,24,56,0.65)]">
      <div className="border-b border-[var(--border)] px-7 py-5">
        <div className="flex items-center justify-between gap-6">
          <div>
            <div className="text-base font-black text-[var(--muted)]">
              {isLoading ? 'Loading opportunities...' : mineOnly ? `${totalPosts} posts found` : `${totalPosts} opportunities found`}
            </div>
            {mineOnly ? (
              <Badge variant="soft" className="mt-2 py-2" icon={<FileText size={14} />}>
                Your published and draft opportunities
              </Badge>
            ) : (
              <Badge variant={aiError ? 'soft' : 'ai'} className="mt-2 py-2" icon={<Sparkles size={14} />}>
                {isMatching ? 'AI matching in progress' : aiError ? 'AI fallback ranking active' : 'AI-ranked for your profile'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm font-black text-[var(--muted)]">
              <span>Sort by</span>
              <div className="relative">
                <select
                  value={sort}
                  onChange={event => onSort(event.target.value as SortMode)}
                  className="appearance-none bg-transparent pr-6 text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--accent)]/25"
                >
                  <option value="best">AI best match</option>
                  <option value="recent">Most recent</option>
                  <option value="oldest">Oldest</option>
                  <option value="expiring">Expiring soon</option>
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconButton
                label="Grid view"
                aria-pressed={viewMode === 'grid'}
                onClick={() => onViewMode('grid')}
                icon={<Grid2X2 size={17} />}
                variant={viewMode === 'grid' ? 'soft' : 'ghost'}
                size="sm"
                className={viewMode === 'grid' ? 'bg-[var(--accent-soft)] text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--tag-bg)] hover:text-[var(--primary)]'}
              />
              <IconButton
                label="List view"
                aria-pressed={viewMode === 'list'}
                onClick={() => onViewMode('list')}
                icon={<List size={18} />}
                variant={viewMode === 'list' ? 'soft' : 'ghost'}
                size="sm"
                className={viewMode === 'list' ? 'bg-[var(--accent-soft)] text-[var(--primary)]' : 'text-[var(--muted)] hover:bg-[var(--tag-bg)] hover:text-[var(--primary)]'}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <PostListSkeleton />
      ) : totalPosts === 0 && !hasActiveFilters ? (
        <DirectoryEmptyState mineOnly={mineOnly} />
      ) : totalPosts === 0 ? (
        <div className="flex flex-col items-center gap-4 px-7 py-16 text-center">
          <p className="text-base font-semibold text-[var(--muted)]">No opportunities match your filters.</p>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            icon={<RotateCcw size={14} />}
            className="border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <>
          <div className={viewMode === 'grid' ? 'md:grid md:grid-cols-2' : ''}>
            {posts.map((post, index) => (
              <PostRow
                key={post.id}
                post={post}
                isLast={index === posts.length - 1}
                compact={viewMode === 'grid'}
                mineOnly={mineOnly}
                onDelete={onDelete}
                isDeleting={deletingPostId === post.id}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalPosts={totalPosts}
            onPage={onPage}
          />
        </>
      )}
    </SectionCard>
  )
}

function PostListSkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="post-row border-b border-[var(--border)] last:border-b-0"
          style={{ minHeight: 246, padding: '32px 28px' }}
        >
          <div style={{ paddingTop: 54 }}>
            <Skeleton width={42} height={42} rounded="full" />
          </div>
          <div className="min-w-0 space-y-4 pt-1">
            <SkeletonLine height={26} width="75%" />
            <SkeletonLine width="100%" />
            <SkeletonLine width="66%" />
            <div className="flex gap-3 pt-3">
              <SkeletonPill height={16} width={96} />
              <SkeletonPill height={16} width={80} />
            </div>
          </div>
          <div className="post-row-side flex flex-col items-end justify-between gap-8">
            <div className="flex gap-3">
              <SkeletonPill height={32} width={112} />
              <SkeletonPill height={32} width={96} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <SkeletonPill height={22} width={80} />
              <SkeletonPill height={22} width={64} />
              <SkeletonPill height={22} width={96} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function DirectoryEmptyState({ mineOnly }: { mineOnly: boolean }) {
  return (
    <UiEmptyState
      icon={<FileText size={28} strokeWidth={1.5} />}
      title={mineOnly ? 'No posts yet' : 'No opportunities yet'}
      description={mineOnly ? 'Your published and draft opportunities will appear here.' : 'Be the first to post a collaboration opportunity.'}
      action={(
        <ButtonLink
          to={ROUTES.POST_CREATE}
          variant="primary"
          icon={<Plus size={16} strokeWidth={2.6} />}
        >
          Post an opportunity
        </ButtonLink>
      )}
    />
  )
}

function PostRow({
  post,
  isLast,
  compact,
  mineOnly,
  onDelete,
  isDeleting,
}: {
  post: DirectoryPost
  isLast: boolean
  compact: boolean
  mineOnly: boolean
  onDelete: (postId: string) => void
  isDeleting: boolean
}) {
  return (
    <article
      className={`post-row block transition hover:bg-[#F3F4F6] ${compact ? 'post-row-compact' : ''} ${isLast ? '' : 'border-b border-[var(--border)]'}`}
      style={{ minHeight: compact ? 220 : 246, padding: '32px 28px' }}
    >
      <div style={{ paddingTop: compact ? 0 : 54 }}>
        <div
          className="flex shrink-0 items-center justify-center rounded-full bg-[#E8F4F7] text-xs font-black tracking-[0.12em] text-[var(--primary)]"
          style={{ width: 42, height: 42 }}
        >
          {post.initials}
        </div>
      </div>

      <div className="min-w-0 pt-1">
        {post.matchScore > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${post.hasAI ? 'bg-[#36213E] text-white' : 'bg-[#D8EFF2] text-[#36213E]'}`}>
              <Sparkles size={14} />
              {post.hasAI ? 'AI match' : 'Profile match'} · {post.matchScore}%
            </div>
            {post.aiReason && (
              <div className="rounded-full bg-[#E8F4F7] px-4 py-2 text-xs font-black text-[#36213E]">
                {post.aiReason}
              </div>
            )}
          </div>
        )}

        <Link to={postDetail(post.id)} className="group block">
          <h2 className="truncate font-headline text-2xl font-black leading-tight text-[var(--primary)] transition group-hover:text-[#8AC6D0]">{post.title}</h2>
          <p className="mt-4 max-w-[900px] break-words text-base font-semibold leading-6 text-[var(--muted)]">{post.description}</p>
        </Link>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-black text-[var(--muted)]">
          <span className="text-[var(--primary)]">{post.author}</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} />
            {post.location}
          </span>
          {post.daysLeft && (
            <>
              <span className="text-[#D5DAE0]">|</span>
              <span className="uppercase tracking-[0.12em]">{post.daysLeft}</span>
            </>
          )}
        </div>
      </div>

      <div className="post-row-side flex flex-col items-end justify-between gap-8">
        <div className="flex max-w-[340px] flex-wrap items-center justify-end gap-3">
          <StatusPill label={post.stage} />
          <StatusPill label={post.type} />
          <StatusPill label={post.commitment} />
        </div>
        <div className="flex max-w-[340px] flex-wrap justify-end gap-2 self-end">
          {post.tags.map(tag => (
            <Tag key={tag} label={tag} />
          ))}
          {mineOnly && (
            <Button
              type="button"
              onClick={() => onDelete(post.id)}
              disabled={isDeleting}
              variant="outline"
              size="sm"
              icon={<Trash2 size={13} />}
              className="h-8 border-[#F0C8CC] text-[#B64B55] hover:bg-[#F7EDEE]"
            >
              {isDeleting ? 'Deleting' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function Tag({ label }: { label: string }) {
  const cyan = ['Cardiology', 'Active', 'Clinical Pharmacy', 'Orthopedics', 'Radiology', 'Neurology'].includes(label)
  const primary = ['Needs Engineering', 'Partner Found'].includes(label) || label.startsWith('AI:')

  return (
    <Badge
      variant={primary ? 'primary' : cyan ? 'soft' : 'neutral'}
      className={
        primary
          ? 'bg-[var(--primary)]'
          : cyan
            ? 'bg-[#E8F4F7] text-[var(--tag-text)]'
            : 'bg-[var(--tag-bg)] text-[var(--tag-text)]'
      }
    >
      {label}
    </Badge>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <Badge variant="outline" size="md" className="min-w-24 border-[var(--border)] text-[var(--tag-text)]">
      {label}
    </Badge>
  )
}

function Pagination({
  page,
  totalPages,
  totalPosts,
  onPage,
}: {
  page: number
  totalPages: number
  totalPosts: number
  onPage: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const start = (page - 1) * POSTS_PER_PAGE + 1
  const end = Math.min(totalPosts, page * POSTS_PER_PAGE)

  return (
    <div className="flex flex-col gap-4 border-t border-[var(--border)] px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm font-bold text-[var(--muted)]">
        Showing {start}-{end} of {totalPosts}
      </div>
      <div className="flex items-center gap-2">
        <IconButton
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page === 1}
          label="Previous page"
          icon={<ChevronLeft size={17} />}
          variant="outline"
          className="border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)]"
        />
        {buildPageRange(page, totalPages).map((item, i) =>
          item === '…' ? (
            <span key={`ellipsis-${i}`} className="flex h-10 w-6 items-center justify-center text-sm text-[var(--muted)]">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onPage(item as number)}
              className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-black transition ${
                item === page
                  ? 'bg-[var(--primary)] text-white'
                  : 'border border-[var(--border)] bg-white text-[var(--primary)] hover:border-[var(--accent)]'
              }`}
            >
              {item}
            </button>
          ),
        )}
        <IconButton
          onClick={() => onPage(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          label="Next page"
          icon={<ChevronRight size={17} />}
          variant="outline"
          className="border-[var(--border)] text-[var(--primary)] hover:border-[var(--accent)]"
        />
      </div>
    </div>
  )
}

function toDirectoryPost(
  post: Post,
  user: ReturnType<typeof useAuthStore.getState>['user'],
  aiSuggestion?: { reason: string; score: number } | null,
): DirectoryPost {
  const days = Math.ceil((new Date(post.expiryDate).getTime() - Date.now()) / 86400000)
  const basicReasons = computeMatchReasons(post, user)
  const filteredReasons = basicReasons
    .filter(reason => reason.tone !== 'city' && reason.tone !== 'country')
    .map(reason => reason.label)
  const tags = Array.from(new Set([
    ...filteredReasons.slice(0, 2),
    post.domain,
    statusLabel(post.status),
  ].filter(Boolean)))
  return {
    id: post.id,
    initials: initials(post.authorName),
    tags,
    title: post.title,
    description: post.description,
    author: post.authorName,
    location: `${post.city}, ${formatCountry(post.country)}`,
    daysLeft: days > 0 && post.status === 'active' ? `${days}D LEFT` : undefined,
    stage: stageLabels[post.projectStage],
    type: typeLabels[post.collaborationType],
    commitment: commitmentLabels[post.levelOfCommitment ?? 'flexible'],
    domain: post.domain,
    projectStage: post.projectStage,
    status: post.status,
    authorRole: post.authorRole,
    country: post.country,
    city: post.city,
    expiryDate: post.expiryDate,
    createdAt: post.createdAt,
    matchScore: user ? getCombinedMatchScore(post, user, aiSuggestion?.score) : 0,
    aiReason: aiSuggestion?.reason,
    hasAI: Boolean(aiSuggestion?.reason),
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

function buildPageRange(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const delta = 1
  const left = page - delta
  const right = page + delta
  const pages: (number | '…')[] = []
  let prev = 0
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= left && p <= right)) {
      if (prev && p - prev > 1) pages.push('…')
      pages.push(p)
      prev = p
    }
  }
  return pages
}

function formatCountry(country: string) {
  const normalized = country.trim().toLowerCase()
  if (normalized === 'turkey' || normalized === 'türkiye' || normalized === 'turkiye') return 'Türkiye'
  return country
}
