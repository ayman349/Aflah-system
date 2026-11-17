import Link from 'next/link'
import Icon from '@/components/Icon'
import { q, q1 } from '@/lib/db'
import { fmtDate } from '@/lib/queries'
export const metadata = { title: 'Overview' }

export default async function Overview() {
  const s = await q1(`select
    (select count(*)::int from users where role='student') students,
    (select count(*)::int from courses) courses,
    (select count(*)::int from courses where status='published') pub_courses,
    (select count(*)::int from documents) docs,
    (select count(*)::int from daily_lessons) lessons`)
  const recent = await q(`select id, full_name, email, created_at from users where role='student' order by created_at desc limit 5`)
  const stats = [['Registered students', s.students, 'users'], ['Total courses', s.courses, 'play'], ['Published courses', s.pub_courses, 'check'], ['Books & documents', s.docs, 'file'], ['Daily lessons', s.lessons, 'cal']]
  return (
    <>
      <h1 className="text-3xl font-extrabold text-navy-800">Dashboard overview</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-5">{stats.map(([t, n, i]) =>
        <div key={t as string} className="card p-5"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/20 text-brand-dark"><Icon n={i as string} className="h-5 w-5" /></span><p className="mt-3 text-3xl font-extrabold text-navy-800">{n as number}</p><p className="text-xs text-slate-500">{t as string}</p></div>)}</div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5"><h2 className="mb-3 font-bold text-navy-800">Quick actions</h2><div className="grid gap-2 sm:grid-cols-2">
          {[['/admin/courses/new', 'New course'], ['/admin/documents/new', 'Upload a book / PDF'], ['/admin/lessons/new', 'Write a daily lesson'], ['/admin/students', 'Manage students']].map(([h, t]) => <Link key={h} href={h} className="btn-outline justify-start">+ {t}</Link>)}</div></div>
        <div className="card p-5"><h2 className="mb-3 font-bold text-navy-800">Newest students</h2>
          {recent.length ? <ul className="divide-y divide-slate-100 text-sm">{recent.map(r => <li key={r.id} className="flex justify-between py-2"><Link href={`/admin/students/${r.id}`} className="font-medium text-navy-700 hover:text-brand-dark">{r.full_name}</Link><span className="text-xs text-slate-500">{fmtDate(r.created_at)}</span></li>)}</ul> : <p className="text-sm text-slate-500">No students have registered yet.</p>}</div>
      </div>
    </>
  )
}
