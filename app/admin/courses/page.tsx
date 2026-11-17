import Link from 'next/link'
import { RowActions } from '@/components/admin/Common'
import { Empty } from '@/components/ui'
import { q } from '@/lib/db'
import { fmtDate } from '@/lib/queries'
export const metadata = { title: 'Courses' }

export default async function AdminCourses() {
  const rows = await q(`select c.id, c.title, c.status, c.created_at, cat.name as category, (select count(*)::int from course_videos v where v.course_id=c.id) videos from courses c left join categories cat on cat.id=c.category_id order by c.created_at desc`)
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold text-navy-800">Courses</h1><Link href="/admin/courses/new" className="btn-primary">+ New course</Link></div>
      {rows.length ? <div className="card overflow-x-auto"><table className="w-full min-w-[640px]"><thead className="border-b bg-slate-50"><tr><th className="th">Course</th><th className="th">Category</th><th className="th">Videos</th><th className="th">Status</th><th className="th">Created</th><th className="th" /></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(r => (
          <tr key={r.id}><td className="td font-semibold text-navy-800">{r.title}</td><td className="td text-slate-600">{r.category ?? '—'}</td><td className="td">{r.videos}</td>
            <td className="td"><span className={r.status === 'published' ? 'badge-green' : 'badge-gray'}>{r.status}</span></td><td className="td text-slate-500">{fmtDate(r.created_at)}</td>
            <td className="td"><RowActions resource="courses" id={r.id} status={r.status} editHref={`/admin/courses/${r.id}`} viewHref={`/courses/${r.id}`} /></td></tr>))}</tbody></table></div>
        : <Empty icon="play" title="No courses yet" action={<Link href="/admin/courses/new" className="btn-primary">Create your first course</Link>}>Create a course, add a thumbnail and videos, then publish it.</Empty>}
    </>
  )
}
