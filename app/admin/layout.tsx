import Link from 'next/link'
import Icon from '@/components/Icon'
import { requireAdminPage } from '@/lib/auth'

const nav = [['/admin', 'grid', 'Overview'], ['/admin/courses', 'play', 'Courses'], ['/admin/documents', 'file', 'Books & Documents'], ['/admin/lessons', 'cal', 'Daily Lessons'], ['/admin/students', 'users', 'Students'], ['/admin/categories', 'tag', 'Categories'], ['/admin/profile', 'cog', 'My Profile']]
export const metadata = { title: { default: 'Admin', template: '%s · Admin · Aflax' } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await requireAdminPage() // server-side role check for every admin page
  return (
    <div className="wrap grid gap-8 py-8 lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card mb-4 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-brand-dark">Administrator</p><p className="truncate font-bold text-navy-800">{u.full_name}</p></div>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1" aria-label="Admin">
          {nav.map(([h, i, t]) => <Link key={h} href={h} className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-navy-800 hover:text-white"><Icon n={i} className="h-4 w-4" />{t}</Link>)}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
