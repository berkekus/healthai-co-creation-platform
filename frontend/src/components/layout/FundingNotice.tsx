const PROJECT_NUMBER = '2025-1-TR01-KA220-HED-000363892'
const COMMUNITY_URL = 'https://healthai.cankaya.edu.tr/'

/**
 * Erasmus+ funding acknowledgement.
 *
 * Both footers render this rather than each carrying its own copy — the grant
 * number and project title have to read identically wherever they appear, and
 * two copies would eventually disagree.
 *
 * Deliberately not translated: the statement names a specific grant and is the
 * wording the programme expects, so it stays as issued in every locale.
 */
export default function FundingNotice({ tone = 'dark' }: { tone?: 'dark' | 'plum' }) {
  const text = tone === 'plum' ? 'text-hai-teal/80' : 'text-[#dff8ff]/70'
  const link = tone === 'plum' ? 'text-hai-mint hover:text-white' : 'text-white/90 hover:text-white'

  return (
    <div className={`flex items-start gap-4 text-xs leading-relaxed ${text}`}>
      <img
        src="/images/erasmus-logo.png"
        alt="Co-funded by Erasmus+"
        className="h-10 w-auto shrink-0"
      />
      <p className="max-w-3xl">
        This platform is funded by the Erasmus+ KA220 HED Project {PROJECT_NUMBER}{' '}
        &ldquo;HEALTH-AI: Advancing Healthcare with Adaptive AI Training and a
        Collaboration Platform&rdquo;. HealthAI Community Website:{' '}
        <a
          href={COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline underline-offset-2 transition-colors ${link}`}
        >
          healthai.cankaya.edu.tr
        </a>
      </p>
    </div>
  )
}
