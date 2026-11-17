import Link from 'next/link'
import Icon from '@/components/Icon'
import { PageHeader, Empty } from '@/components/ui'
import { publishedDocs, publishedLessons, fmtDate } from '@/lib/queries'
export const metadata = { title: 'Documentation' }

export default async function Documentation() {
  const [docs, lessons] = await Promise.all([publishedDocs(), publishedLessons({ limit: 4 })])
  return (
    <>
      <PageHeader eyebrow="Learning materials" title="Documentation">Textbooks, technical documents and daily lessons to support your studies.</PageHeader>
      <div className="wrap grid gap-6 py-12 md:grid-cols-2">
        {[
          { href: '/documentation/books', icon: 'file', title: 'Books & Documents', text: 'PDF books, manuals and technical guides to read online or download.', count: `${docs.length} available` },
          { href: '/documentation/lessons', icon: 'cal', title: 'Daily Lessons', text: 'Short, focused lessons written by the college and published every day.', count: `${lessons.length ? 'Latest first' : 'Coming soon'}` },
        ].map(c => (
          <Link key={c.href} href={c.href} className="card-hover group flex gap-5 p-7">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy-800 text-brand"><Icon n={c.icon} className="h-8 w-8" /></span>
            <div><h2 className="text-xl font-extrabold text-navy-800 group-hover:text-brand-dark">{c.title}</h2><p className="mt-1 text-sm text-slate-600">{c.text}</p><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-brand-dark">{c.count} →</p></div>
          </Link>))}
      </div>
      <div className="wrap grid gap-10 pb-6 lg:grid-cols-2">
        <section><h2 className="mb-4 text-xl font-extrabold text-navy-800">Newest books & documents</h2>
          {docs.length ? <ul className="card divide-y divide-slate-100">{docs.slice(0, 4).map(d => <li key={d.id}><Link href={`/documentation/books/${d.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50"><Icon n="file" className="h-5 w-5 text-brand-dark" /><span className="font-medium text-navy-800">{d.title}</span></Link></li>)}</ul>
            : <Empty icon="file" title="No documents yet">Books and documents will appear here once published.</Empty>}</section>
        <section><h2 className="mb-4 text-xl font-extrabold text-navy-800">Latest daily lessons</h2>
          {lessons.length ? <ul className="card divide-y divide-slate-100">{lessons.map(l => <li key={l.id}><Link href={`/documentation/lessons/${l.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"><span className="font-medium text-navy-800">{l.title}</span><span className="shrink-0 text-xs text-slate-500">{fmtDate(l.publish_date)}</span></Link></li>)}</ul>
            : <Empty icon="cal" title="No lessons yet">Daily lessons will appear here once published.</Empty>}</section>
      </div>
    </>
  )
}
