'use client'
import { useRef, useState } from 'react'

export type Uploaded = { id: string; name: string; size?: number }
export default function FileUpload({ kind, accept, label, hint, value, onChange }: {
  kind: 'video' | 'image' | 'pdf' | 'attachment'; accept: string; label: string; hint?: string; value: Uploaded | null; onChange: (v: Uploaded | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number | null>(null)
  const [err, setErr] = useState('')

  function pick(file: File) {
    setErr(''); setPct(0)
    const x = new XMLHttpRequest()
    x.open('POST', `/api/admin/uploads?kind=${kind}`)
    x.setRequestHeader('x-filename', encodeURIComponent(file.name))
    x.setRequestHeader('Content-Type', 'application/octet-stream')
    x.upload.onprogress = e => e.lengthComputable && setPct(Math.round((e.loaded / e.total) * 100))
    x.onerror = () => { setPct(null); setErr('Upload failed. Check your connection.') }
    x.onload = () => {
      setPct(null)
      let d: any = {}; try { d = JSON.parse(x.responseText) } catch {}
      if (x.status >= 200 && x.status < 300) onChange({ id: d.id, name: d.name, size: d.size })
      else setErr(d.error || (x.status === 413 ? 'File is too large.' : 'Upload failed.'))
      if (ref.current) ref.current.value = ''
    }
    x.send(file)
  }
  return (
    <div>
      <span className="lbl">{label}</span>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        {value && pct === null && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm shadow-sm">
            <span className="truncate font-medium text-navy-800">✓ {value.name}</span>
            <button type="button" onClick={() => onChange(null)} className="shrink-0 text-xs font-semibold text-red-600 hover:underline">Remove</button>
          </div>)}
        {pct !== null ? (
          <div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-brand transition-all" style={{ width: `${pct}%` }} /></div><p className="mt-1 text-xs text-slate-500">Uploading… {pct}%</p></div>
        ) : (
          <label className="btn-outline btn-sm cursor-pointer">{value ? 'Replace file' : 'Choose file'}
            <input ref={ref} type="file" accept={accept} className="sr-only" onChange={e => e.target.files?.[0] && pick(e.target.files[0])} /></label>)}
        {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
        {err && <p className="err" role="alert">{err}</p>}
      </div>
    </div>
  )
}
