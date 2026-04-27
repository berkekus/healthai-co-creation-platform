import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import PostCard from '../../components/posts/PostCard'
import PageWrapper from '../../components/layout/PageWrapper'
import { ROUTES } from '../../constants/routes'
import type { PostFilters, PostStatus, ProjectStage } from '../../types/post.types'
import { computeMatchReasons, computeEnhancedMatchReasons, rankByMatch } from '../../utils/matchPosts'
import { useSmartSuggestions } from '../../lib/gemini'

const MEDICAL_DOMAINS = [
  'Cardiology','Oncology','Radiology & Imaging','Neurology','Orthopedics',
  'Dermatology','Ophthalmology','Pediatrics','Psychiatry & Mental Health',
  'Emergency Medicine','Intensive Care (ICU)','Surgical Robotics',
  'Genomics & Precision Medicine','Rehabilitation & Physio','Clinical Pharmacy',
  'Public Health & Epidemiology','Pathology & Lab Diagnostics',
  'Endocrinology & Diabetes','Remote Patient Monitoring','Mental Health AI',
]

const STAGES: { value: ProjectStage; label: string }[] = [
  { value: 'idea',               label: 'Idea' },
  { value: 'concept_validation', label: 'Concept Validation' },
  { value: 'prototype',          label: 'Prototype' },
  { value: 'pilot',              label: 'Pilot Testing' },
  { value: 'pre_deployment',     label: 'Pre-Deployment' },
]

const STATUSES: { value: PostStatus; label: string }[] = [
  { value: 'active',            label: 'Active' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { value: 'partner_found',     label: 'Partner Found' },
  { value: 'expired',           label: 'Expired' },
  { value: 'draft',             label: 'Draft' },
]

const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2336213E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '1.5px solid #E5E5E5',
  borderRadius: 10,
  padding: '10px 36px 10px 12px',
  fontSize: 13,
  fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
  fontWeight: 500,
  color: '#36213E',
  outline: 'none',
  appearance: 'none',
  backgroundImage: chevronSvg,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  cursor: 'pointer',
  transition: 'border-color 180ms, box-shadow 180ms',
}

const inputSoft: React.CSSProperties = {
  ...selectStyle,
  backgroundImage: 'none',
  paddingRight: 12,
  cursor: 'text',
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-2">
      {children}
    </div>
  )
}

export default function PostListPage() {
  const { filters, setFilters, clearFilters, getFiltered, posts } = usePostStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [filtersOpen, setFiltersOpen] = useState(true)
  const [localSearch, setLocalSearch] = useState(filters.search ?? '')
  const { suggestions, isLoading: aiLoading, load: loadAI } = useSmartSuggestions()

  // AI önerileri: sadece kullanıcı değiştiğinde tetikle (posts.length değişimi tekrar çağırmaz)
  useEffect(() => {
    if (user && posts.length > 0) loadAI(user, posts)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  // Debounce: wait 220ms after user stops typing before filtering the list.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters({ search: localSearch.trim() || undefined })
    }, 220)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch])

  const allFiltered = getFiltered()
  const visible = allFiltered.filter(p => p.status !== 'draft' || p.authorId === user?.id)

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length
  const totalVisible = posts.filter(p => p.status !== 'draft' || p.authorId === user?.id).length

  // Per-card match reasons — AI önerileri gelince otomatik güncellenir
  const matchMap = useMemo(() => {
    const m = new Map<string, ReturnType<typeof computeMatchReasons>>()
    visible.forEach(p => m.set(p.id, computeEnhancedMatchReasons(p, user, suggestions.get(p.id))))
    return m
  }, [visible, user, suggestions])

  // "Best matches for you" — AI skoru dahil sıralama
  const featuredMatches = useMemo(() => {
    if (!user || activeFilterCount > 0) return []
    if (!user.expertiseTags?.length) return []
    const active = posts.filter(p => p.status === 'active' && p.authorId !== user.id)
    return rankByMatch(active, user)
      .map(({ post }) => ({
        post,
        reasons: computeEnhancedMatchReasons(post, user, suggestions.get(post.id)),
      }))
      .filter(m => m.reasons.length > 0)
      .slice(0, 3)
  }, [posts, user, activeFilterCount, suggestions])

  const handleSelect = <K extends keyof PostFilters>(key: K, value: string) => {
    setFilters({ [key]: value || undefined } as Partial<PostFilters>)
  }

  const isCityFilterActive = !!filters.city && user?.city && filters.city.toLowerCase() === user.city.toLowerCase()

  return (
    <PageWrapper maxWidth={1280}>
      {/* Header card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
            <span className="text-hai-plum/70">05</span>
            <span>Directory</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="font-headline font-bold text-[40px] md:text-[56px] leading-[0.98] tracking-[-0.035em] text-hai-plum">
                Collaboration<br />
                <span className="text-hai-teal">opportunities<span className="text-hai-plum">.</span></span>
              </h1>
              <p className="text-[15px] text-neutral-600 leading-relaxed mt-3 max-w-xl">
                Browse {totalVisible} active listing{totalVisible !== 1 ? 's' : ''} from clinicians and engineers across Europe.
              </p>
            </div>
            <button
              onClick={() => navigate(ROUTES.POST_CREATE)}
              className="inline-flex items-center gap-2 bg-hai-plum text-white px-6 py-3.5 rounded-full font-bold text-sm hover:bg-black transition-colors shrink-0 self-start lg:self-end"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Post opportunity
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span
              aria-hidden="true"
              className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-hai-plum/50 pointer-events-none"
            >
              search
            </span>
            <input
              type="search"
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search by title, description, or expertise…"
              className="w-full bg-hai-offwhite border-2 border-transparent rounded-full pl-14 pr-5 py-4 text-[15px] font-body font-medium text-hai-plum placeholder:text-neutral-400 focus:border-hai-plum focus:bg-white outline-none transition-colors"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                aria-label="Clear search"
                className="absolute right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-hai-plum/10 hover:bg-hai-plum/20 text-hai-plum flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Result summary row */}
          <div className="flex items-center justify-between flex-wrap gap-3 mt-5 text-[11px] font-mono tracking-[0.14em] uppercase font-bold">
            <div className="flex items-center gap-3">
              <span className="text-hai-plum">
                {visible.length} of {totalVisible} result{totalVisible !== 1 ? 's' : ''}
              </span>
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-hai-lime text-hai-plum rounded-full px-2.5 py-0.5">
                  <span className="w-1 h-1 rounded-full bg-hai-plum" />
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { clearFilters(); setLocalSearch('') }}
                className="text-neutral-500 hover:text-hai-plum transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">

        {/* Filter sidebar card */}
        <aside className="bg-white rounded-[1.75rem] border border-neutral-100 overflow-hidden self-start lg:sticky lg:top-20">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 bg-hai-offwhite border-b border-neutral-100 hover:bg-hai-mint/40 transition-colors"
          >
            <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>tune</span>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-hai-plum text-hai-mint rounded-full px-2 py-0.5 text-[9px]">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <span
              className={`material-symbols-outlined text-[18px] text-hai-plum transition-transform ${filtersOpen ? 'rotate-0' : '-rotate-90'}`}
            >
              expand_more
            </span>
          </button>

          {filtersOpen && (
            <div className="p-5 flex flex-col gap-5">

              <div>
                <FilterLabel>Domain</FilterLabel>
                <select value={filters.domain ?? ''} onChange={e => handleSelect('domain', e.target.value)} style={selectStyle}>
                  <option value="">All domains</option>
                  {MEDICAL_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <FilterLabel>Project stage</FilterLabel>
                <select value={filters.projectStage ?? ''} onChange={e => handleSelect('projectStage', e.target.value)} style={selectStyle}>
                  <option value="">All stages</option>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <FilterLabel>Status</FilterLabel>
                <select value={filters.status ?? ''} onChange={e => handleSelect('status', e.target.value)} style={selectStyle}>
                  <option value="">All statuses</option>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <FilterLabel>Posted by</FilterLabel>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: '',                         label: 'Anyone',    icon: 'group',       full: true  },
                    { value: 'engineer',                 label: 'Engineer',  icon: 'memory',      full: false },
                    { value: 'healthcare_professional',  label: 'Clinician', icon: 'stethoscope', full: false },
                  ].map(r => {
                    const active = (filters.authorRole ?? '') === r.value
                    return (
                      <button
                        key={r.label}
                        onClick={() => handleSelect('authorRole', r.value)}
                        className={`${r.full ? 'col-span-2' : 'col-span-1'} inline-flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-full text-[11px] font-mono tracking-[0.1em] uppercase font-bold transition-colors ${
                          active ? 'bg-hai-plum text-white' : 'bg-hai-offwhite text-hai-plum hover:bg-hai-mint/40'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>{r.icon}</span>
                        {r.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <FilterLabel>City</FilterLabel>
                {user?.city && (
                  <button
                    onClick={() => handleSelect('city', isCityFilterActive ? '' : user.city)}
                    className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 mb-2 rounded-full text-[11px] font-mono tracking-[0.1em] uppercase font-bold transition-colors ${
                      isCityFilterActive
                        ? 'bg-hai-lime text-hai-plum'
                        : 'bg-hai-offwhite text-hai-plum hover:bg-hai-mint/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>near_me</span>
                    Near me · {user.city}
                  </button>
                )}
                <input
                  type="text"
                  value={filters.city ?? ''}
                  onChange={e => handleSelect('city', e.target.value)}
                  placeholder="e.g. Berlin"
                  style={inputSoft}
                />
              </div>

              <div>
                <FilterLabel>Country</FilterLabel>
                <input
                  type="text"
                  value={filters.country ?? ''}
                  onChange={e => handleSelect('country', e.target.value)}
                  placeholder="e.g. Germany"
                  style={inputSoft}
                />
              </div>
            </div>
          )}
        </aside>

        {/* Post grid / empty state */}
        <section className="min-w-0">
          {visible.length === 0 ? (
            <div className="bg-white rounded-[1.75rem] border border-neutral-100 py-16 px-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hai-mint/40 mb-4">
                <span className="material-symbols-outlined text-hai-plum text-[32px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                  {activeFilterCount > 0 ? 'search_off' : 'folder_open'}
                </span>
              </div>
              {activeFilterCount > 0 ? (
                <>
                  <h2 className="font-headline font-bold text-2xl text-hai-plum mb-2">No results found</h2>
                  <p className="text-[14.5px] text-neutral-600 mb-6 max-w-sm mx-auto leading-relaxed">
                    Try adjusting your filters or clearing the search to see more listings.
                  </p>
                  <button
                    onClick={() => { clearFilters(); setLocalSearch('') }}
                    className="inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
                  >
                    Clear all filters
                  </button>
                </>
              ) : (
                <>
                  <h2 className="font-headline font-bold text-2xl text-hai-plum mb-2">No listings yet</h2>
                  <p className="text-[14.5px] text-neutral-600 mb-6 max-w-sm mx-auto leading-relaxed">
                    Be the first to post a collaboration opportunity and spark the directory.
                  </p>
                  <button
                    onClick={() => navigate(ROUTES.POST_CREATE)}
                    className="inline-flex items-center gap-2 bg-hai-plum text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Post an opportunity
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Best matches for you — featured row */}
              {featuredMatches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-hai-plum text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                        auto_awesome
                      </span>
                      <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
                        Best matches for you
                      </span>
                      <span className="bg-hai-lime text-hai-plum rounded-full px-2 py-0.5 text-[9.5px] font-mono tracking-[0.12em] uppercase font-bold">
                        {featuredMatches.length}
                      </span>
                    </div>
                    {aiLoading ? (
                      <span className="hidden md:inline-flex items-center gap-1.5 text-[10.5px] font-mono tracking-[0.14em] uppercase text-hai-teal font-bold animate-pulse">
                        <span className="material-symbols-outlined text-[13px]">psychology</span>
                        AI analysing…
                      </span>
                    ) : (
                      <span className="hidden md:inline-flex items-center gap-1.5 text-[10.5px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold">
                        {suggestions.size > 0
                          ? <><span className="material-symbols-outlined text-[13px] text-hai-teal">psychology</span>AI + city, role & expertise</>
                          : 'Based on your city, role & expertise'
                        }
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {featuredMatches.map(({ post, reasons }) => (
                      <PostCard key={`featured-${post.id}`} post={post} matchReasons={reasons} featured />
                    ))}
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="flex-1 h-px bg-neutral-200" />
                    <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-neutral-400 font-bold">
                      All opportunities
                    </span>
                    <span className="flex-1 h-px bg-neutral-200" />
                  </div>
                </div>
              )}

              {/* Main grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                {visible.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    matchReasons={matchMap.get(post.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </PageWrapper>
  )
}
