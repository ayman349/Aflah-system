import Link from 'next/link'
import { RowActions } from '@/components/admin/Common'
import { Empty } from '@/components/ui'
import { q } from '@/lib/db'
import { fmtDate } from '@/lib/queries'
export const metadata = { title: 'Daily Lessons' }

export default async function AdminLessons() {
  const rows = await q(`select l.id, l.title, l.status, to_char(l.publish_date,'YYYY-MM-DD') pd, cat.name category from daily_lessons l left join categories cat on cat.id=l.category_id order by l.publish_date desc, l.created_at desc`)
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold text-navy-800">Daily Lessons</h1><Link href="/admin/lessons/new" className="btn-primary">+ New lesson</Link></div>
      {rows.length ? <div className="card overflow-x-auto"><table className="w-full min-w-[640px]"><thead className="border-b bg-slate-50"><tr><th className="th">Title</th><th className="th">Category</th><th className="th">Publication date</th><th className="th">Status</th><th className="th" /></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(r => (
          <tr key={r.id}><td className="td font-semibold text-navy-800">{r.title}</td><td className="td text-slate-600">{r.category ?? '—'}</td><td className="td text-slate-500">{fmtDate(r.pd)}</td>
            <td className="td"><span className={r.status === 'published' ? 'badge-green' : 'badge-gray'}>{r.status}</span></td>
            <td className="td"><RowActions resource="lessons" id={r.id} status={r.status} editHref={`/admin/lessons/${r.id}`} viewHref={`/documentation/lessons/${r.id}`} /></td></tr>))}</tbody></table></div>
        : <Empty icon="cal" title="No lessons yet" action={<Link href="/admin/lessons/new" className="btn-primary">Write your first lesson</Link>}>Write a lesson and publish it for students.</Empty>}
    </>
  )
}
