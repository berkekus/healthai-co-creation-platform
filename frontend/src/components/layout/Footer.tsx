import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'

export default function Footer() {
  return (
    <footer className="bg-[#2d1838] text-[#dff8ff] font-body">
      <div className="max-w-[1640px] mx-auto px-6 md:px-10 2xl:px-0 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/15 p-1.5 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="16.5" y="5" width="7" height="30" rx="1.5" fill="#8fdff0" />
              <rect x="5" y="16.5" width="30" height="7" rx="1.5" fill="#8fdff0" />
            </svg>
          </div>
          <div className="text-[11px] font-mono tracking-[0.16em] uppercase leading-snug text-[#dff8ff]/75">
            <span className="font-bold text-white">HealthAI</span> · Co-Creation Platform<br />
            Built in Europe · zero patient data
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono tracking-[0.14em] uppercase text-[#dff8ff]/70">
          <Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">GDPR Rights</Link>
          <span>SENG 384</span>
          <span>Spring 2026</span>
          <span>v0.1</span>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  )
}
