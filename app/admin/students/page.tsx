import Link from 'next/link'
import { StudentActions } from '@/components/admin/Common'
import { Empty, SearchBox } from '@/components/ui'
import { q } from '@/lib/db'
import { fmtDate } from '@/lib/queries'
export const metadata = { title: 'Students' }

export default async function Students({ searchParams }: { searchParams: { q?: string } }) {
  const term = searchParams.q?.trim().slice(0, 80)
  const rows = await q(`select id, full_name, email, student_code, is_active, created_at, last_login_at from users where role='student'
    ${term ? `and (full_name ilike $1 or email ilike $1 or student_code ilike $1)` : ''} order by created_at desc limit 500`, term ? [`%${term}%`] : [])
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold text-navy-800">Students</h1><SearchBox action="/admin/students" defaultValue={term} placeholder="Search name, email or ID…" /></div>
      {rows.length ? <div className="card overflow-x-auto"><table className="w-full min-w-[720px]"><thead className="border-b bg-slate-50"><tr><th className="th">Student</th><th className="th">ID</th><th className="th">Registered</th><th className="th">Last login</th><th className="th">Status</th><th className="th" /></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(r => (
          <tr key={r.id}><td className="td"><Link href={`/admin/students/${r.id}`} className="font-semibold text-navy-800 hover:text-brand-dark">{r.full_name}</Link><div className="text-xs text-slate-500">{r.email}</div></td>
            <td className="td text-slate-600">{r.student_code}</td><td className="td text-slate-500">{fmtDate(r.created_at)}</td><td className="td text-slate-500">{r.last_login_at ? fmtDate(r.last_login_at) : 'Never'}</td>
            <td className="td"><span className={r.is_active ? 'badge-green' : 'badge-red'}>{r.is_active ? 'Active' : 'Deactivated'}</span></td>
            <td className="td"><StudentActions id={r.id} active={r.is_active} /></td></tr>))}</tbody></table></div>
        : <Empty icon="users" title={term ? 'No students match your search' : 'No students yet'}>{term ? 'Try a different name, email or ID.' : 'Students appear here after they register.'}</Empty>}
    </>
  )
}
