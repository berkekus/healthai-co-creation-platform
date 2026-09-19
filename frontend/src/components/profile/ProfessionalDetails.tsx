import { useTranslation } from 'react-i18next'
import type { User } from '../../types/auth.types'

type Details = Pick<User, 'position' | 'department' | 'orcid' | 'institutionWebsite' | 'contactEmail' | 'linkedinUrl'>

/** ORCID iDs are shown bare; links go to the canonical orcid.org record. */
export function orcidId(value: string): string {
  return value.replace(/^https?:\/\/(www\.)?orcid\.org\//i, '').toUpperCase()
}

export function hasProfessionalDetails(user: Details): boolean {
  return Boolean(user.position || user.department || user.orcid || user.institutionWebsite || user.contactEmail || user.linkedinUrl)
}

/**
 * Role, department, ORCID iD and institutional contact routes — the details
 * that let a potential partner check who someone is before reaching out.
 */
export default function ProfessionalDetails({ user, emptyText }: { user: Details; emptyText?: string }) {
  const { t } = useTranslation()
  const rows: { label: string; content: React.ReactNode }[] = []
  const linkCls = 'break-all font-black text-[#1B7A88] underline decoration-[#8AC6D0] underline-offset-2 hover:text-hai-plum'

  if (user.position) rows.push({ label: t('professional.position'), content: user.position })
  if (user.department) rows.push({ label: t('professional.department'), content: user.department })
  if (user.orcid) {
    const id = orcidId(user.orcid)
    rows.push({ label: t('professional.orcid'), content: <a className={linkCls} href={`https://orcid.org/${id}`} target="_blank" rel="noreferrer">{id}</a> })
  }
  if (user.contactEmail) {
    rows.push({ label: t('professional.contactEmail'), content: <a className={linkCls} href={`mailto:${user.contactEmail}`}>{user.contactEmail}</a> })
  }
  if (user.institutionWebsite) {
    rows.push({ label: t('professional.institutionWebsite'), content: <a className={linkCls} href={user.institutionWebsite} target="_blank" rel="noreferrer">{user.institutionWebsite}</a> })
  }
  if (user.linkedinUrl) {
    rows.push({ label: t('professional.linkedinUrl'), content: <a className={linkCls} href={user.linkedinUrl} target="_blank" rel="noreferrer">{user.linkedinUrl}</a> })
  }

  if (rows.length === 0) {
    return emptyText ? <p className="text-sm font-semibold italic text-neutral-400">{emptyText}</p> : null
  }

  return (
    <dl className="grid gap-3">
      {rows.map(row => (
        <div key={row.label} className="grid grid-cols-1 gap-1 py-1 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-8">
          <dt className="text-sm font-semibold text-[#6F6878]">{row.label}</dt>
          <dd className="min-w-0 text-base font-black leading-snug text-hai-plum">{row.content}</dd>
        </div>
      ))}
    </dl>
  )
}
