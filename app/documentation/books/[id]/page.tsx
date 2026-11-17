import Link from 'next/link'
import { notFound } from 'next/navigation'
import Icon from '@/components/Icon'
import { docById, fmtSize } from '@/lib/queries'
import { requireUser } from '@/lib/auth'

export default async function Viewer({ params }: { params: { id: string } }) {
  await requireUser(`/documentation/books/${params.id}`)
  const d = await docById(params.id); if (!d) notFound()
  return (
    <div className="wrap py-8">
      <Link href="/documentation/books" className="text-sm font-medium text-navy-600 hover:text-brand-dark">← Books & Documents</Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold text-navy-800">{d.title}</h1>{d.category_name && <span className="badge mt-2">{d.category_name}</span>}
          {d.description && <p className="mt-3 max-w-3xl text-slate-600">{d.description}</p>}<p className="mt-1 text-xs text-slate-500">PDF · {fmtSize(d.size_bytes)}</p></div>
        {d.allow_download && <a href={`/media/${d.file_id}?dl=1`} className="btn-primary"><Icon n="download" className="h-4 w-4" />Download PDF</a>}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow">
        <iframe src={`/media/${d.file_id}`} title={d.title} className="h-[80vh] w-full" />
      </div>
      <p className="mt-3 text-xs text-slate-500">PDF not showing? <a className="underline" href={`/media/${d.file_id}`} target="_blank">Open it in a new tab</a>.</p>
    </div>
  )
}
