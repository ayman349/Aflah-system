import Link from 'next/link'
import Icon from './Icon'
export default function Logo({ light = true }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Aflax Electrical College home">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-navy-900 shadow-lg shadow-brand/30"><Icon n="bolt" fill className="h-6 w-6" /></span>
      <span className="leading-tight">
        <span className={`block text-lg font-extrabold tracking-wide ${light ? 'text-white' : 'text-navy-800'}`}>AFLAX</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[.22em] text-brand">Electrical College</span>
      </span>
    </Link>
  )
}
