import { useState, useEffect } from 'react'
import api from '../../lib/api'

interface Badge {
  id: string
  label: string
  icon: string
  description: string
}

interface BadgeData {
  badges: Badge[]
  collaborationScore: number
}

export default function BadgeList({ userId }: { userId: string }) {
  const [data, setData] = useState<BadgeData | null>(null)

  useEffect(() => {
    api.get<{ success: boolean; data: BadgeData }>(`/auth/users/${userId}/badges`)
      .then(res => setData(res.data.data))
      .catch(() => {})
  }, [userId])

  if (!data || data.badges.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-wide text-[#6F6878]">Badges</p>
        {data.collaborationScore > 0 && (
          <span className="rounded-full bg-[#E8F4F7] px-2 py-0.5 text-xs font-black text-hai-teal">
            {data.collaborationScore} pts
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {data.badges.map(badge => (
          <div
            key={badge.id}
            title={badge.description}
            className="group relative flex items-center gap-1.5 rounded-full border border-[#D5DAE0] bg-white px-2.5 py-1 text-xs font-black text-hai-plum transition hover:border-hai-teal hover:bg-[#E8F4F7]"
          >
            <span
              className="material-symbols-outlined text-sm text-hai-teal"
              style={{ fontVariationSettings: '"FILL" 1' }}
            >
              {badge.icon}
            </span>
            {badge.label}
          </div>
        ))}
      </div>
    </div>
  )
}
