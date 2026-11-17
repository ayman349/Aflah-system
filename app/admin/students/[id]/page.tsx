import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StudentActions } from '@/components/admin/Common'
import { q, q1, isUuid } from '@/lib/db'
import { fmtDate } from '@/lib/queries'
export const metadata = { title: 'Student details' }

export default async function StudentDetail({ params }: { params: { id: string } }) {
  if (!isUuid(params.id)) notFound()
  const s = await q1(`select * from users where id=$1 and role='student'`, [params.id]); if (!s) notFound()
  const courses = await q(`select c.id, c.title, e.created_at from enrollments e join courses c on c.id=e.course_id where e.user_id=$1 order by e.created_at desc`, [s.id])
  const rows: [string, string][] = [['Email', s.email], ['Student ID', s.student_code], ['Registered', fmtDate(s.created_at)], ['Last login', s.last_login_at ? fmtDate(s.last_login_at) : 'Never']]
  return (
    <>
      <Link href="/admin/students" className="text-sm text-navy-600 hover:text-brand-dark">← Students</Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-extrabold text-navy-800">{s.full_name}</h1><StudentActions id={s.id} active={s.is_active} /></div>
      <div className="card mt-6 divide-y divide-slate-100">{rows.map(([k, v]) => <div key={k} className="flex justify-between px-5 py-3 text-sm"><span className="text-slate-500">{k}</span><span className="font-medium">{v}</span></div>)}
        <div className="flex justify-between px-5 py-3 text-sm"><span className="text-slate-500">Status</span><span className={s.is_active ? 'badge-green' : 'badge-red'}>{s.is_active ? 'Active' : 'Deactivated'}</span></div></div>
      <h2 className="mb-3 mt-8 text-xl font-bold text-navy-800">Enrolled courses</h2>
      {courses.length ? <ul className="card divide-y divide-slate-100">{courses.map(c => <li key={c.id} className="flex justify-between px-5 py-3 text-sm"><span className="font-medium">{c.title}</span><span className="text-slate-500">{fmtDate(c.created_at)}</span></li>)}</ul> : <p className="text-sm text-slate-500">Not enrolled in any course.</p>}
    </>
  )
}
