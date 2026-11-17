import Link from 'next/link'
import { PageHeader, Empty, Chips } from '@/components/ui'
import { publishedLessons, categories, fmtDate } from '@/lib/queries'
export const metadata = { title: 'Daily Lessons' }

export default async function Lessons({ searchParams }: { searchParams: { category?: string } }) {
  const [lessons, cats] = await Promise.all([publishedLessons({ category: searchParams.category }), categories('lesson')])
  return (
    <>
      <PageHeader eyebrow="Documentation" title="Daily Lessons">Short lessons published by the college. The newest lesson is always at the top.</PageHeader>
      <div className="wrap py-10">
        <div className="mb-3 flex gap-4 text-sm"><Link href="/documentation/books" className="text-slate-500 hover:text-navy-800">Books & Documents</Link><span className="font-bold text-navy-800 underline decoration-brand decoration-2 underline-offset-8">Daily Lessons</span></div>
        <div className="my-6"><Chips base="/documentation/lessons" items={cats} active={searchParams.category} /></div>
        {lessons.length ? <div className="space-y-4">{lessons.map(l => (
          <Link key={l.id} href={`/documentation/lessons/${l.id}`} className="card-hover block p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">{l.category_name && <span className="badge">{l.category_name}</span>}<time>{fmtDate(l.publish_date)}</time></div>
            <h2 className="mt-2 text-xl font-bold text-navy-800">{l.title}</h2>
            <p className="mt-1 line-clamp-2 text-slate-600">{l.content.replace(/[#*`>]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 220)}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-brand-dark">Read lesson →</span></Link>))}</div>
          : <Empty icon="cal" title="No lessons published yet">Daily lessons will appear here as soon as the college publishes them.</Empty>}
      </div>
    </>
  )
}
