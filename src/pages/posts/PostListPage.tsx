import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePostStore } from '../../store/postStore'
import { useAuthStore } from '../../store/authStore'
import PostCard from '../../components/posts/PostCard'
import PageWrapper from '../../components/layout/PageWrapper'
import { ROUTES } from '../../constants/routes'
import type { PostFilters, PostStatus, ProjectStage } from '../../types/post.types'

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

const selectStyle: React.CSSProperties = {
  width: '100%', background: 'var(--paper)', border: '1px solid var(--rule)',
  padding: '8px 10px', fontSize: 13, fontFamily: 'var(--ff-sans)',
  color: 'var(--ink)', borderRadius: 0, appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7' viewBox='0 0 10 7'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
  cursor: 'pointer',
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 7 }}>
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

  const allFiltered = getFiltered()
  const visible = allFiltered.filter(p => p.status !== 'draft' || p.authorId === user?.id)

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  const handleSearch = (v: string) => {
    setLocalSearch(v)
    setFilters({ search: v || undefined })
  }

  const handleSelect = <K extends keyof PostFilters>(key: K, value: string) => {
    setFilters({ [key]: value || undefined } as Partial<PostFilters>)
  }

  const mono: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--ink-muted)',
  }

  const totalVisible = posts.filter(p => p.status !== 'draft' || p.authorId === user?.id).length

  return (
    <PageWrapper>
      {/* Section label */}
      <div style={{ ...mono, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 32, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--primary)' }}>05</span>
        <span>Directory</span>
        <span style={{ width: 4, height: 4, background: 'var(--ink-muted)', borderRadius: '50%' }} />
        <span>
          {visible.length} of {totalVisible} listing{totalVisible !== 1 ? 's' : ''}
          {activeFilterCount > 0 && (
            <span style={{ marginLeft: 8, background: 'var(--primary)', color: 'var(--paper)', borderRadius: 2, padding: '1px 6px', fontSize: 9.5 }}>
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            </span>
          )}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {activeFilterCount > 0 && (
            <button
              onClick={() => { clearFilters(); setLocalSearch('') }}
              style={{ ...mono, background: 'none', border: '1px solid var(--rule)', padding: '6px 12px', cursor: 'pointer', color: 'var(--ink-muted)' }}
            >
              Clear filters
            </button>
          )}
          <button
            onClick={() => navigate(ROUTES.POST_CREATE)}
            style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--paper)', background: 'var(--ink)', border: 'none', padding: '7px 16px', cursor: 'pointer' }}
          >
            + New Post
          </button>
        </div>
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(26px,3.5vw,44px)', letterSpacing: '-0.025em', margin: '0 0 28px', color: 'var(--ink)' }}>
        Collaboration opportunities.
      </h1>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)', pointerEvents: 'none', fontSize: 16 }}>
          ⌕
        </span>
        <input
          type="search"
          value={localSearch}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search by title or description…"
          style={{
            width: '100%', background: 'var(--paper)',
            border: '1.5px solid var(--rule)', borderRadius: 0,
            padding: '12px 14px 12px 38px',
            fontSize: 15, fontFamily: 'var(--ff-sans)', color: 'var(--ink)',
            boxSizing: 'border-box', outline: 'none',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
        />
      </div>

      {/* Body: sidebar + grid */}
      <div className="posts-layout">

        {/* Filter sidebar */}
        <aside className="filter-aside" style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--rule)', background: 'var(--paper)' }}>
          <button
            onClick={() => setFiltersOpen(v => !v)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--paper-2)', border: 'none', borderBottom: '1px solid var(--rule)', cursor: 'pointer', width: '100%' }}
          >
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
            </span>
            <span style={{ fontSize: 12, color: 'var(--ink-muted)', transform: filtersOpen ? 'none' : 'rotate(-90deg)', transition: 'transform .2s' }}>▾</span>
          </button>

          {filtersOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Domain */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
                <FilterLabel>Domain</FilterLabel>
                <select value={filters.domain ?? ''} onChange={e => handleSelect('domain', e.target.value)} style={selectStyle}>
                  <option value="">All domains</option>
                  {MEDICAL_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Project stage */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
                <FilterLabel>Project stage</FilterLabel>
                <select value={filters.projectStage ?? ''} onChange={e => handleSelect('projectStage', e.target.value)} style={selectStyle}>
                  <option value="">All stages</option>
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Status */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
                <FilterLabel>Status</FilterLabel>
                <select value={filters.status ?? ''} onChange={e => handleSelect('status', e.target.value)} style={selectStyle}>
                  <option value="">All statuses</option>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              {/* Author role */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
                <FilterLabel>Posted by</FilterLabel>
                <select value={filters.authorRole ?? ''} onChange={e => handleSelect('authorRole', e.target.value)} style={selectStyle}>
                  <option value="">Anyone</option>
                  <option value="engineer">Engineer</option>
                  <option value="healthcare_professional">Healthcare Professional</option>
                </select>
              </div>

              {/* City */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
                <FilterLabel>City</FilterLabel>
                <input
                  type="text"
                  value={filters.city ?? ''}
                  onChange={e => handleSelect('city', e.target.value)}
                  placeholder="e.g. Berlin"
                  style={{ ...selectStyle, backgroundImage: 'none', paddingRight: 10 }}
                />
              </div>

              {/* Country */}
              <div style={{ padding: '14px 16px' }}>
                <FilterLabel>Country</FilterLabel>
                <input
                  type="text"
                  value={filters.country ?? ''}
                  onChange={e => handleSelect('country', e.target.value)}
                  placeholder="e.g. Germany"
                  style={{ ...selectStyle, backgroundImage: 'none', paddingRight: 10 }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* Post grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {visible.length === 0 ? (
            <div style={{ padding: '60px 32px', textAlign: 'center', border: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
              {activeFilterCount > 0 ? (
                <>
                  <p style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', margin: '0 0 10px' }}>No results found.</p>
                  <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 20px' }}>Try adjusting your filters or clearing the search.</p>
                  <button onClick={() => { clearFilters(); setLocalSearch('') }} style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500, background: 'var(--ink)', color: 'var(--paper)', border: 'none', padding: '11px 24px', cursor: 'pointer' }}>
                    Clear all filters
                  </button>
                </>
              ) : (
                <>
                  <p style={{ fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', margin: '0 0 10px' }}>No listings yet.</p>
                  <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 20px' }}>Be the first to post a collaboration opportunity.</p>
                  <button onClick={() => navigate(ROUTES.POST_CREATE)} style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500, background: 'var(--ink)', color: 'var(--paper)', border: 'none', padding: '11px 24px', cursor: 'pointer' }}>
                    Post a Collaboration Opportunity →
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="posts-grid">
              {visible.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
