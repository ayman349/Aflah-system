import Link from 'next/link'
import { RowActions } from '@/components/admin/Common'
import { Empty } from '@/components/ui'
import { q } from '@/lib/db'
import { fmtDate, fmtSize } from '@/lib/queries'
export const metadata = { title: 'Books & Documents' }

export default async function AdminDocs() {
  const rows = await q(`select d.id, d.title, d.status, d.created_at, cat.name category, f.size_bytes from documents d join files f on f.id=d.file_id left join categories cat on cat.id=d.category_id order by d.created_at desc`)
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl font-extrabold text-navy-800">Books & Documents</h1><Link href="/admin/documents/new" className="btn-primary">+ Upload PDF</Link></div>
      {rows.length ? <div className="card overflow-x-auto"><table className="w-full min-w-[640px]"><thead className="border-b bg-slate-50"><tr><th className="th">Title</th><th className="th">Category</th><th className="th">Size</th><th className="th">Status</th><th className="th">Added</th><th className="th" /></tr></thead>
        <tbody className="divide-y divide-slate-100">{rows.map(r => (
          <tr key={r.id}><td className="td font-semibold text-navy-800">{r.title}</td><td className="td text-slate-600">{r.category ?? '—'}</td><td className="td">{fmtSize(r.size_bytes)}</td>
            <td className="td"><span className={r.status === 'published' ? 'badge-green' : 'badge-gray'}>{r.status}</span></td><td className="td text-slate-500">{fmtDate(r.created_at)}</td>
            <td className="td"><RowActions resource="documents" id={r.id} status={r.status} editHref={`/admin/documents/${r.id}`} viewHref={`/documentation/books/${r.id}`} /></td></tr>))}</tbody></table></div>
        : <Empty icon="file" title="No documents yet" action={<Link href="/admin/documents/new" className="btn-primary">Upload your first PDF</Link>}>Upload books and PDFs for students to read and download.</Empty>}
    </>
  )
}
