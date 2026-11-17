'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/client'

export function EnrollButton({ courseId, enrolled }: { courseId: string; enrolled: boolean }) {
  const r = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  async function go() { setBusy(true); setErr(''); const res = await api(enrolled ? 'DELETE' : 'POST', `/api/courses/${courseId}/enroll`); setBusy(false); if (!res.ok) setErr(res.error ?? 'Failed'); else r.refresh() }
  return (<div><button onClick={go} disabled={busy} className={enrolled ? 'btn-outline' : 'btn-primary'}>{busy ? 'Please wait…' : enrolled ? '✓ Enrolled — click to leave course' : 'Enroll in this course'}</button>{err && <p className="err">{err}</p>}</div>)
}

export function VideoPlaylist({ videos }: { videos: { id: string; title: string; src: string | null; embed: string | null; link: string | null }[] }) {
  const [i, setI] = useState(0); const v = videos[i]
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
          {v.src ? <video key={v.id} controls controlsList="nodownload" preload="metadata" className="h-full w-full" src={v.src}>Your browser cannot play this video.</video>
            : v.embed ? <iframe key={v.id} src={v.embed} className="h-full w-full" title={v.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            : <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-white"><p>This video is hosted on an external site.</p><a className="btn-primary" href={v.link!} target="_blank" rel="noopener noreferrer">Open video</a></div>}
        </div>
        <h3 className="mt-3 text-lg font-bold text-navy-800">{v.title}</h3>
      </div>
      {videos.length > 1 && (
        <ol className="card max-h-[420px] divide-y divide-slate-100 overflow-auto">
          {videos.map((x, k) => (
            <li key={x.id}><button onClick={() => setI(k)} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-slate-50 ${k === i ? 'bg-brand/10 font-semibold text-navy-800' : 'text-slate-600'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${k === i ? 'bg-brand text-navy-900' : 'bg-slate-200'}`}>{k + 1}</span>{x.title}</button></li>))}
        </ol>)}
    </div>
  )
}
