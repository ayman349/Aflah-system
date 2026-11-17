import Link from 'next/link'
import { notFound } from 'next/navigation'
import Icon from '@/components/Icon'
import { Formatted } from '@/lib/markdown'
import { lessonById, lessonFiles, fmtDate, fmtSize } from '@/lib/queries'
import { requireUser } from '@/lib/auth'

export default async function LessonPage({ params }: { params: { id: string } }) {
  await requireUser(`/documentation/lessons/${params.id}`)
  const l = await lessonById(params.id); if (!l) notFound()
  const files = await lessonFiles(l.id)
  return (
    <article className="wrap max-w-3xl py-10">
      <Link href="/documentation/lessons" className="text-sm font-medium text-navy-600 hover:text-brand-dark">← Daily Lessons</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">{l.category_name && <span className="badge">{l.category_name}</span>}<time>{fmtDate(l.publish_date)}</time></div>
      <h1 className="mt-3 text-3xl font-extrabold text-navy-800 sm:text-4xl">{l.title}</h1>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><Formatted text={l.content} /></div>
      {files.length > 0 && <section className="mt-8"><h2 className="mb-3 font-bold text-navy-800">Attachments</h2>
        <ul className="space-y-2">{files.map(f => <li key={f.id}><a href={`/media/${f.id}`} className="card flex items-center gap-3 px-4 py-3 text-sm hover:border-brand"><Icon n="download" className="h-5 w-5 text-brand-dark" /><span className="font-medium text-navy-800">{f.original_name}</span><span className="ml-auto text-xs text-slate-500">{fmtSize(f.size_bytes)}</span></a></li>)}</ul></section>}
    </article>
  )
}
