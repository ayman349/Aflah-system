'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/client'

export function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (error) return <div className="alert-err" role="alert">{error}</div>
  if (ok) return <div className="alert-ok" role="status">{ok}</div>
  return null
}

/** Edit / publish-unpublish / delete controls for a row in an admin table. */
export function RowActions({ resource, id, status, editHref, viewHref }: { resource: 'courses' | 'documents' | 'lessons'; id: string; status: string; editHref: string; viewHref?: string }) {
  const r = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  async function toggle() { setBusy(true); setErr(''); const x = await api('PATCH', `/api/admin/${resource}/${id}`, { status: status === 'published' ? 'draft' : 'published' }); setBusy(false); x.ok ? r.refresh() : setErr(x.error ?? 'Failed') }
  async function del() { if (!confirm('Delete this item permanently? Its uploaded files will be deleted too.')) return; setBusy(true); setErr(''); const x = await api('DELETE', `/api/admin/${resource}/${id}`); setBusy(false); x.ok ? r.refresh() : setErr(x.error ?? 'Failed') }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {viewHref && status === 'published' && <a href={viewHref} target="_blank" className="btn-outline btn-sm">View</a>}
      <a href={editHref} className="btn-outline btn-sm">Edit</a>
      <button onClick={toggle} disabled={busy} className="btn-dark btn-sm">{status === 'published' ? 'Unpublish' : 'Publish'}</button>
      <button onClick={del} disabled={busy} className="btn-danger btn-sm">Delete</button>
      {err && <span className="err w-full text-right">{err}</span>}
    </div>
  )
}

export function StudentActions({ id, active }: { id: string; active: boolean }) {
  const r = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  async function toggle() { setBusy(true); setErr(''); const x = await api('PATCH', `/api/admin/students/${id}`, { active: !active }); setBusy(false); x.ok ? r.refresh() : setErr(x.error ?? 'Failed') }
  async function del() { if (!confirm('Permanently delete this student account and their enrolments?')) return; setBusy(true); const x = await api('DELETE', `/api/admin/students/${id}`); setBusy(false); x.ok ? r.push('/admin/students') : setErr(x.error ?? 'Failed') }
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button onClick={toggle} disabled={busy} className={active ? 'btn-outline btn-sm' : 'btn-primary btn-sm'}>{active ? 'Deactivate' : 'Activate'}</button>
      <button onClick={del} disabled={busy} className="btn-danger btn-sm">Delete</button>
      {err && <span className="err w-full text-right">{err}</span>}
    </div>
  )
}

export function CategoryManager({ items }: { items: { id: number; kind: string; name: string }[] }) {
  const r = useRouter(); const [kind, setKind] = useState('course'); const [name, setName] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  async function add(e: React.FormEvent) { e.preventDefault(); setErr(''); setBusy(true); const x = await api('POST', '/api/admin/categories', { kind, name }); setBusy(false); if (!x.ok) return setErr(x.error ?? 'Failed'); setName(''); r.refresh() }
  async function del(id: number) { if (!confirm('Delete this category? Items using it will become uncategorised.')) return; const x = await api('DELETE', `/api/admin/categories/${id}`); x.ok ? r.refresh() : setErr(x.error ?? 'Failed') }
  const labels: Record<string, string> = { course: 'Course categories', document: 'Document categories', lesson: 'Lesson categories' }
  return (
    <div className="space-y-6">
      <form onSubmit={add} className="card flex flex-wrap items-end gap-3 p-5">
        <div><label className="lbl" htmlFor="ck">Type</label><select id="ck" className="inp" value={kind} onChange={e => setKind(e.target.value)}><option value="course">Course</option><option value="document">Document</option><option value="lesson">Lesson</option></select></div>
        <div className="min-w-[200px] flex-1"><label className="lbl" htmlFor="cn">New category name</label><input id="cn" className="inp" value={name} onChange={e => setName(e.target.value)} required minLength={2} maxLength={80} /></div>
        <button className="btn-primary" disabled={busy}>Add category</button>
        {err && <p className="err w-full">{err}</p>}
      </form>
      <div className="grid gap-5 md:grid-cols-3">{Object.entries(labels).map(([k, t]) => (
        <div key={k} className="card p-5"><h3 className="mb-3 font-bold text-navy-800">{t}</h3>
          <ul className="space-y-1.5 text-sm">{items.filter(i => i.kind === k).map(i => <li key={i.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5">{i.name}<button onClick={() => del(i.id)} className="text-xs font-semibold text-red-600 hover:underline">Delete</button></li>)}</ul></div>))}</div>
    </div>
  )
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const r = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [f, setF] = useState<Record<string, string>>({})
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(''); setOk(''); setF({}); const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    if (d.newPassword && d.newPassword !== d.confirm) return setF({ confirm: 'Passwords do not match' })
    setBusy(true); const x = await api('PATCH', '/api/admin/profile', { fullName: d.fullName, currentPassword: d.currentPassword || undefined, newPassword: d.newPassword || undefined }); setBusy(false)
    if (!x.ok) { setErr(x.error ?? 'Failed'); setF(x.fields ?? {}); return }
    setOk('Profile updated.'); (e.target as HTMLFormElement).reset(); r.refresh()
  }
  const E = ({ k }: { k: string }) => (f[k] ? <p className="err">{f[k]}</p> : null)
  return (
    <form onSubmit={submit} className="card max-w-xl space-y-4 p-6">
      <Notice error={err} ok={ok} />
      <div><label className="lbl">Email</label><input className="inp bg-slate-100" value={email} disabled /></div>
      <div><label className="lbl" htmlFor="fn">Full name</label><input id="fn" name="fullName" className="inp" defaultValue={name} required minLength={2} /><E k="fullName" /></div>
      <fieldset className="space-y-3 rounded-lg border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold text-slate-600">Change password (optional)</legend>
        <div><label className="lbl">Current password</label><input name="currentPassword" type="password" className="inp" autoComplete="current-password" /><E k="currentPassword" /></div>
        <div><label className="lbl">New password</label><input name="newPassword" type="password" className="inp" autoComplete="new-password" /><E k="newPassword" /></div>
        <div><label className="lbl">Confirm new password</label><input name="confirm" type="password" className="inp" autoComplete="new-password" /><E k="confirm" /></div></fieldset>
      <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    </form>
  )
}
