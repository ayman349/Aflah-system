'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/client'
import FileUpload, { Uploaded } from './FileUpload'
import { Notice } from './Common'

type Cat = { id: number; name: string }
const useSubmit = (back: string) => {
  const r = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [fields, setFields] = useState<Record<string, string>>({})
  async function run(method: string, url: string, body: unknown) {
    setBusy(true); setError(''); setFields({}); const x = await api(method, url, body); setBusy(false)
    if (!x.ok) { setError(x.error ?? 'Something went wrong'); setFields(x.fields ?? {}); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    r.push(back); r.refresh()
  }
  return { busy, error, fields, run }
}
const Err = ({ f, k }: { f: Record<string, string>; k: string }) => (f[k] ? <p className="err">{f[k]}</p> : null)

// ---------------- COURSE ----------------
type VideoRow = { key: number; title: string; mode: 'file' | 'link'; file: Uploaded | null; url: string }
export type CourseInit = { id?: string; title: string; description: string; instructorName: string; categoryId: number | null; level: string; duration: string; status: string; thumbnail: Uploaded | null; videos: { title: string; file: Uploaded | null; url: string }[] }

export function CourseForm({ init, categories }: { init: CourseInit; categories: Cat[] }) {
  const s = useSubmit('/admin/courses')
  const [v, setV] = useState(init)
  const [thumb, setThumb] = useState<Uploaded | null>(init.thumbnail)
  const [rows, setRows] = useState<VideoRow[]>(init.videos.map((x, i) => ({ key: i, title: x.title, mode: x.file ? 'file' : 'link', file: x.file, url: x.url })))
  const upd = (p: Partial<VideoRow> & { key: number }) => setRows(rs => rs.map(r => (r.key === p.key ? { ...r, ...p } : r)))
  const set = (k: keyof CourseInit, val: any) => setV(o => ({ ...o, [k]: val }))
  function submit(e: React.FormEvent) {
    e.preventDefault()
    const videos = rows.filter(r => (r.mode === 'file' ? r.file : r.url.trim())).map(r => ({ title: r.title.trim() || 'Video', fileId: r.mode === 'file' ? r.file!.id : null, url: r.mode === 'link' ? r.url.trim() : null }))
    const body = { title: v.title, description: v.description, instructorName: v.instructorName, categoryId: v.categoryId, level: v.level, duration: v.duration, status: v.status, thumbnailFileId: thumb?.id ?? null, videos }
    s.run(init.id ? 'PUT' : 'POST', init.id ? `/api/admin/courses/${init.id}` : '/api/admin/courses', body)
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      <Notice error={s.error} />
      <div className="card space-y-4 p-6">
        <h2 className="font-bold text-navy-800">Course details</h2>
        <div><label className="lbl" htmlFor="t">Title *</label><input id="t" className="inp" value={v.title} onChange={e => set('title', e.target.value)} required minLength={3} maxLength={150} /><Err f={s.fields} k="title" /></div>
        <div><label className="lbl" htmlFor="d">Description</label><textarea id="d" rows={6} className="inp" value={v.description} onChange={e => set('description', e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="lbl" htmlFor="i">Instructor name</label><input id="i" className="inp" value={v.instructorName} onChange={e => set('instructorName', e.target.value)} /></div>
          <div><label className="lbl" htmlFor="c">Category</label><select id="c" className="inp" value={v.categoryId ?? ''} onChange={e => set('categoryId', e.target.value ? Number(e.target.value) : null)}><option value="">— None —</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="lbl" htmlFor="l">Level</label><select id="l" className="inp" value={v.level} onChange={e => set('level', e.target.value)}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div>
          <div><label className="lbl" htmlFor="du">Duration</label><input id="du" className="inp" placeholder="e.g. 8 weeks" value={v.duration} onChange={e => set('duration', e.target.value)} /></div>
        </div>
        <FileUpload kind="image" accept=".jpg,.jpeg,.png,.webp" label="Thumbnail image" hint="JPG, PNG or WebP, max 5 MB. Landscape (16:9) looks best." value={thumb} onChange={setThumb} />
        {thumb && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/${thumb.id}`} alt="Thumbnail preview" className="h-32 rounded-lg border object-cover" />}
      </div>
      <div className="card space-y-4 p-6">
        <div className="flex items-center justify-between"><h2 className="font-bold text-navy-800">Course videos</h2>
          <button type="button" className="btn-outline btn-sm" onClick={() => setRows(r => [...r, { key: Date.now(), title: '', mode: 'file', file: null, url: '' }])}>+ Add video</button></div>
        {!rows.length && <p className="text-sm text-slate-500">No videos yet. Add an uploaded file (MP4, WebM, OGV — up to 500 MB) or a YouTube / Vimeo / direct link.</p>}
        {rows.map((r, i) => (
          <div key={r.key} className="space-y-3 rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-600">Video {i + 1}</span><button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => setRows(rs => rs.filter(x => x.key !== r.key))}>Remove</button></div>
            <input className="inp" placeholder="Video title" value={r.title} onChange={e => upd({ key: r.key, title: e.target.value })} />
            <div className="flex gap-4 text-sm"><label className="flex items-center gap-1.5"><input type="radio" checked={r.mode === 'file'} onChange={() => upd({ key: r.key, mode: 'file' })} />Upload file</label><label className="flex items-center gap-1.5"><input type="radio" checked={r.mode === 'link'} onChange={() => upd({ key: r.key, mode: 'link' })} />Video link</label></div>
            {r.mode === 'file' ? <FileUpload kind="video" accept=".mp4,.m4v,.webm,.ogv" label="Video file" hint="MP4, WebM or OGV, max 500 MB." value={r.file} onChange={f => upd({ key: r.key, file: f })} />
              : <input className="inp" type="url" placeholder="https://www.youtube.com/watch?v=… or direct .mp4 link" value={r.url} onChange={e => upd({ key: r.key, url: e.target.value })} />}
          </div>))}
      </div>
      <div className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div><label className="lbl" htmlFor="st">Status</label><select id="st" className="inp" value={v.status} onChange={e => set('status', e.target.value)}><option value="draft">Draft (hidden from students)</option><option value="published">Published (visible to students)</option></select></div>
        <div className="flex gap-3"><a href="/admin/courses" className="btn-outline">Cancel</a><button className="btn-primary" disabled={s.busy}>{s.busy ? 'Saving…' : init.id ? 'Save changes' : 'Create course'}</button></div>
      </div>
    </form>
  )
}

// ---------------- DOCUMENT ----------------
export type DocInit = { id?: string; title: string; description: string; categoryId: number | null; file: Uploaded | null; allowDownload: boolean; status: string }
export function DocumentForm({ init, categories }: { init: DocInit; categories: Cat[] }) {
  const s = useSubmit('/admin/documents'); const [v, setV] = useState(init); const [file, setFile] = useState<Uploaded | null>(init.file)
  const set = (k: keyof DocInit, val: any) => setV(o => ({ ...o, [k]: val }))
  function submit(e: React.FormEvent) { e.preventDefault(); const body = { title: v.title, description: v.description, categoryId: v.categoryId, fileId: file?.id, allowDownload: v.allowDownload, status: v.status }; s.run(init.id ? 'PUT' : 'POST', init.id ? `/api/admin/documents/${init.id}` : '/api/admin/documents', body) }
  return (
    <form onSubmit={submit} className="card max-w-3xl space-y-4 p-6">
      <Notice error={s.error} />
      <div><label className="lbl" htmlFor="t">Title *</label><input id="t" className="inp" value={v.title} onChange={e => set('title', e.target.value)} required minLength={3} maxLength={150} /><Err f={s.fields} k="title" /></div>
      <div><label className="lbl" htmlFor="d">Description</label><textarea id="d" rows={4} className="inp" value={v.description} onChange={e => set('description', e.target.value)} /></div>
      <div><label className="lbl" htmlFor="c">Category</label><select id="c" className="inp" value={v.categoryId ?? ''} onChange={e => set('categoryId', e.target.value ? Number(e.target.value) : null)}><option value="">— None —</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <FileUpload kind="pdf" accept=".pdf" label="PDF file *" hint="PDF only, max 50 MB." value={file} onChange={setFile} />
      <Err f={s.fields} k="fileId" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.allowDownload} onChange={e => set('allowDownload', e.target.checked)} />Allow students to download this file</label>
      <div className="flex flex-wrap items-end justify-between gap-4 border-t pt-4">
        <div><label className="lbl" htmlFor="st">Status</label><select id="st" className="inp" value={v.status} onChange={e => set('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></div>
        <div className="flex gap-3"><a href="/admin/documents" className="btn-outline">Cancel</a><button className="btn-primary" disabled={s.busy}>{s.busy ? 'Saving…' : init.id ? 'Save changes' : 'Add document'}</button></div>
      </div>
    </form>
  )
}

// ---------------- DAILY LESSON ----------------
export type LessonInit = { id?: string; title: string; content: string; categoryId: number | null; publishDate: string; status: string; attachments: Uploaded[] }
export function LessonForm({ init, categories }: { init: LessonInit; categories: Cat[] }) {
  const s = useSubmit('/admin/lessons'); const [v, setV] = useState(init); const [files, setFiles] = useState<Uploaded[]>(init.attachments); const [slot, setSlot] = useState<Uploaded | null>(null)
  const set = (k: keyof LessonInit, val: any) => setV(o => ({ ...o, [k]: val }))
  function submit(e: React.FormEvent) { e.preventDefault(); const body = { title: v.title, content: v.content, categoryId: v.categoryId, publishDate: v.publishDate, status: v.status, attachmentIds: files.map(f => f.id) }; s.run(init.id ? 'PUT' : 'POST', init.id ? `/api/admin/lessons/${init.id}` : '/api/admin/lessons', body) }
  return (
    <form onSubmit={submit} className="card max-w-4xl space-y-4 p-6">
      <Notice error={s.error} />
      <div><label className="lbl" htmlFor="t">Lesson title *</label><input id="t" className="inp" value={v.title} onChange={e => set('title', e.target.value)} required minLength={3} maxLength={150} /><Err f={s.fields} k="title" /></div>
      <div><label className="lbl" htmlFor="ct">Lesson content *</label>
        <textarea id="ct" rows={16} className="inp font-mono" value={v.content} onChange={e => set('content', e.target.value)} required minLength={10} />
        <p className="mt-1 text-xs text-slate-500">Formatting: <code># Heading</code>, <code>## Sub-heading</code>, <code>- bullet</code>, <code>1. numbered</code>, <code>**bold**</code>, <code>*italic*</code>, <code>&gt; note</code>, <code>[link text](https://…)</code>. Leave a blank line between paragraphs.</p><Err f={s.fields} k="content" /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className="lbl" htmlFor="c">Category</label><select id="c" className="inp" value={v.categoryId ?? ''} onChange={e => set('categoryId', e.target.value ? Number(e.target.value) : null)}><option value="">— None —</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="lbl" htmlFor="pd">Publication date</label><input id="pd" type="date" className="inp" value={v.publishDate} onChange={e => set('publishDate', e.target.value)} required /><Err f={s.fields} k="publishDate" /></div>
        <div><label className="lbl" htmlFor="st">Status</label><select id="st" className="inp" value={v.status} onChange={e => set('status', e.target.value)}><option value="draft">Draft</option><option value="published">Published</option></select></div>
      </div>
      <div className="space-y-2"><span className="lbl">Attachments (optional)</span>
        {files.map(f => <div key={f.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"><span className="truncate">📎 {f.name}</span><button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => setFiles(x => x.filter(y => y.id !== f.id))}>Remove</button></div>)}
        <FileUpload key={files.length} kind="attachment" accept=".pdf,.docx,.pptx,.xlsx,.zip,.jpg,.jpeg,.png" label="Add attachment" hint="PDF, Word, PowerPoint, Excel, ZIP or image, max 25 MB." value={slot} onChange={f => { if (f) setFiles(x => [...x, f]); setSlot(null) }} /></div>
      <div className="flex justify-end gap-3 border-t pt-4"><a href="/admin/lessons" className="btn-outline">Cancel</a><button className="btn-primary" disabled={s.busy}>{s.busy ? 'Saving…' : init.id ? 'Save changes' : 'Save lesson'}</button></div>
    </form>
  )
}
