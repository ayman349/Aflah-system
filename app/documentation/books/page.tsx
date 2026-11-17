import Link from 'next/link'
import Icon from '@/components/Icon'
import { PageHeader, Empty, Chips, SearchBox } from '@/components/ui'
import { publishedDocs, categories, fmtSize, fmtDate } from '@/lib/queries'
import { getUser } from '@/lib/auth'
export const metadata = { title: 'Books & Documents' }

export default async function Books({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = searchParams.q?.trim().slice(0, 80)
  const [docs, cats, user] = await Promise.all([publishedDocs({ search: q, category: searchParams.category }), categories('document'), getUser()])
  return (
    <>
      <PageHeader eyebrow="Documentation" title="Books & Documents">Read PDF books and technical documents online, or download them for offline study.</PageHeader>
      <div className="wrap py-10">
        <div className="mb-3 flex gap-4 text-sm"><span className="font-bold text-navy-800 underline decoration-brand decoration-2 underline-offset-8">Books & Documents</span><Link href="/documentation/lessons" className="text-slate-500 hover:text-navy-800">Daily Lessons</Link></div>
        <div className="mb-6 mt-6 space-y-4"><SearchBox action="/documentation/books" defaultValue={q} placeholder="Search books and documents…" hidden={{ category: searchParams.category }} /><Chips base="/documentation/books" items={cats} active={searchParams.category} extra={{ q }} /></div>
        {docs.length ? <div className="grid gap-5 md:grid-cols-2">{docs.map(d => (
          <article key={d.id} className="card-hover flex gap-4 p-5">
            <span className="flex h-16 w-14 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-brand"><Icon n="file" className="h-7 w-7" /></span>
            <div className="min-w-0 flex-1">
              {d.category_name && <span className="badge">{d.category_name}</span>}
              <h3 className="mt-1 font-bold text-navy-800">{d.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{d.description || 'No description provided.'}</p>
              <p className="mt-2 text-xs text-slate-500">PDF · {fmtSize(d.size_bytes)} · {fmtDate(d.created_at)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={user ? `/documentation/books/${d.id}` : `/login?next=/documentation/books/${d.id}`} className="btn-primary btn-sm">{user ? 'Read online' : 'Login to read'}</Link>
                {user && d.allow_download && <a href={`/media/${d.file_id}?dl=1`} className="btn-outline btn-sm"><Icon n="download" className="h-3.5 w-3.5" />Download</a>}
              </div>
            </div>
          </article>))}</div>
          : <Empty icon="file" title={q || searchParams.category ? 'Nothing matches your search' : 'No books or documents yet'}>{q || searchParams.category ? 'Try another keyword or category.' : 'Published books and documents will be listed here.'}</Empty>}
      </div>
    </>
  )
}
