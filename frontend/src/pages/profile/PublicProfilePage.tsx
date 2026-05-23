import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, ShieldCheck, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../lib/api'
import BadgeList from '../../components/ui/BadgeList'
import type { User } from '../../types/auth.types'

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '')
const resolveAvatar = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`
  return url
}

export default function PublicProfilePage() {
  const { t, i18n } = useTranslation()
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    api.get<{ success: boolean; data: User }>(`/auth/users/${userId}`)
      .then(({ data }) => { setUser(data.data); setLoading(false) })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2d1838]/20 border-t-[#2d1838] rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-[#f5f6f8] flex flex-col items-center justify-center gap-4">
        <p className="text-[#2d1838] font-bold text-[18px]">{t('publicProfile.notFound')}</p>
        <button onClick={() => navigate(-1)} className="text-[#3db8d8] font-semibold hover:underline">
          {t('publicProfile.goBack')}
        </button>
      </div>
    )
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const avatar = resolveAvatar(user.avatarUrl)
  const roleLabel = t(`common.role.${user.role}`, { defaultValue: user.role })

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      <div className="mx-auto w-full max-w-[860px] px-6 pb-20 pt-[56px] md:px-10">

        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[13.5px] font-bold text-[#6f6a76] hover:text-[#2d1838] transition-colors mb-8">
          <ArrowLeft size={15} strokeWidth={2} /> {t('publicProfile.back')}
        </button>

        <div className="bg-white rounded-[24px] border border-[#e8e8ee] shadow-[0_24px_70px_-54px_rgba(45,24,56,0.3)] overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-[#dff8ff] via-[#c8e8f4] to-[#ddeef8]" />

          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-10 mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-sm overflow-hidden bg-[#2d1838] flex items-center justify-center text-[#8fdff0] font-black text-[22px] shrink-0">
                {avatar ? <img src={avatar} alt={user.name} className="w-full h-full object-cover" /> : initials}
              </div>
              <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${user.role === 'healthcare_professional' ? 'bg-[#dbeafe] text-[#2563eb]' : 'bg-[#d1fae5] text-[#059669]'}`}>
                {roleLabel}
              </span>
            </div>

            <h1 className="font-headline font-black text-[26px] text-[#2d1838] leading-tight mb-1">{user.name}</h1>

            {user.isVerified && (
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#3db8d8] font-semibold mb-4">
                <ShieldCheck size={13} /> {t('publicProfile.verified')}
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-[13px] text-[#6f6a76] font-semibold mb-6">
              {user.institution && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#9f9aaa]" /> {user.institution}
                </span>
              )}
              {(user.city || user.country) && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#9f9aaa]" /> {[user.city, user.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="text-[14.5px] text-[#4a4355] leading-relaxed mb-6 max-w-[600px]">{user.bio}</p>
            )}

            {user.expertiseTags && user.expertiseTags.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#9f9aaa] mb-3">
                  <Tag size={11} /> {t('publicProfile.expertise')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {user.expertiseTags.map(tag => (
                    <span key={tag} className="px-3 py-1.5 bg-[#f0f8fb] text-[#3db8d8] text-[12.5px] font-semibold rounded-full border border-[#cceef6]">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {userId && <BadgeList userId={userId} />}

        <p className="mt-5 text-center text-[12.5px] text-[#9f9aaa] font-semibold">
          {t('publicProfile.memberSince', {
            date: new Date(user.createdAt).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-GB', { month: 'long', year: 'numeric' })
          })}
        </p>
      </div>
    </main>
  )
}
