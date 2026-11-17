import Link from 'next/link'
import Icon from './Icon'
import { Course } from '@/lib/queries'

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <section className="circuit relative overflow-hidden bg-navy-900 py-14 text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/80 to-transparent" />
      <div className="wrap relative fade-up">
        {eyebrow && <p className="eyebrow !text-brand">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {children && <p className="mt-3 max-w-2xl text-slate-300">{children}</p>}
      </div>
    </section>
  )
}
export function Empty({ icon = 'book', title, children, action }: { icon?: string; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand/15 text-brand-dark"><Icon n={icon} className="h-7 w-7" /></span>
      <h3 className="text-lg font-bold text-navy-800">{title}</h3>
      {children && <p className="mt-1 max-w-md text-sm text-slate-500">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
export function Thumb({ id, alt, className = '' }: { id: string | null; alt: string; className?: string }) {
  return id
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={`/media/${id}`} alt={alt} loading="lazy" className={`object-cover ${className}`} />
    : <div className={`circuit flex items-center justify-center bg-gradient-to-br from-navy-800 to-navy-600 text-brand ${className}`}><Icon n="bolt" fill className="h-12 w-12 opacity-90" /></div>
}
export function CourseCard({ c }: { c: Course }) {
  return (
    <Link href={`/courses/${c.id}`} className="card-hover group flex flex-col overflow-hidden">
      <Thumb id={c.thumbnail_file_id} alt={c.title} className="h-44 w-full transition duration-500 group-hover:scale-[1.03]" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {c.category_name && <span className="badge">{c.category_name}</span>}
          <span className="text-xs text-slate-500">{c.level}</span>
        </div>
        <h3 className="mt-2 text-lg font-bold leading-snug text-navy-800 group-hover:text-brand-dark">{c.title}</h3>
        <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-600">{c.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>{c.instructor_name || 'Aflax Instructor'}</span>
          <span className="flex items-center gap-1"><Icon n="play" fill className="h-3 w-3" />{c.video_count} video{c.video_count === 1 ? '' : 's'}</span>
        </div>
      </div>
    </Link>
  )
}
export function Chips({ base, items, active, extra = {} }: { base: string; items: { id: number; name: string }[]; active?: string; extra?: Record<string, string | undefined> }) {
  const href = (cat?: number) => { const p = new URLSearchParams(); Object.entries(extra).forEach(([k, v]) => v && p.set(k, v)); if (cat) p.set('category', String(cat)); const s = p.toString(); return s ? `${base}?${s}` : base }
  const cls = (on: boolean) => `rounded-full border px-3.5 py-1.5 text-sm transition ${on ? 'border-brand bg-brand text-navy-900 font-semibold' : 'border-slate-300 bg-white text-slate-600 hover:border-brand'}`
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={href()} className={cls(!active)}>All</Link>
      {items.map(c => <Link key={c.id} href={href(c.id)} className={cls(active === String(c.id))}>{c.name}</Link>)}
    </div>
  )
}
export function SearchBox({ action, defaultValue, placeholder, hidden = {} }: { action: string; defaultValue?: string; placeholder: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form action={action} className="relative w-full max-w-md" role="search">
      {Object.entries(hidden).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
      <Icon n="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input name="q" defaultValue={defaultValue} placeholder={placeholder} className="inp !pl-9" />
    </form>
  )
}
