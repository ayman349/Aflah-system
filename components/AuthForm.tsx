'use client'
import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/client'

export default function AuthForm({ mode, next }: { mode: 'login' | 'register'; next?: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const reg = mode === 'register'
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : ''

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setOk(''); setFields({})
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    // quick client-side checks (the server validates everything again)
    const fe: Record<string, string> = {}
    if (reg && f.password !== f.confirmPassword) fe.confirmPassword = 'Passwords do not match'
    if (Object.keys(fe).length) { setFields(fe); return }
    setBusy(true)
    const r = await api(reg ? 'POST' : 'POST', `/api/auth/${mode}`, f)
    if (!r.ok) { setBusy(false); setError(r.error ?? 'Something went wrong'); setFields(r.fields ?? {}); return }
    setOk(reg ? 'Account created! Taking you to your dashboard…' : 'Login successful. Redirecting…')
    const to = r.data.role === 'admin' ? '/admin' : safeNext || r.data.redirect || '/dashboard'
    window.location.assign(to) // full reload so the navigation bar shows the logged-in state
  }
  const field = ({ name, label, type = 'text', ...rest }: any) => (
    <div>
      <label htmlFor={name} className="lbl">{label}</label>
      <input id={name} name={name} type={type} required className="inp" aria-invalid={!!fields[name]} {...rest} />
      {fields[name] && <p className="err">{fields[name]}</p>}
    </div>
  )
  return (
    <form onSubmit={submit} className="card mx-auto w-full max-w-md space-y-4 p-7 shadow-xl" noValidate={false}>
      <div>
        <h1 className="text-2xl font-extrabold text-navy-800">{reg ? 'Create your student account' : 'Welcome back'}</h1>
        <p className="mt-1 text-sm text-slate-500">{reg ? 'Register to watch courses and read learning materials.' : 'Log in to continue learning.'}</p>
      </div>
      {error && <div className="alert-err" role="alert">{error}</div>}
      {ok && <div className="alert-ok" role="status">{ok}</div>}
      {reg && field({ name: 'fullName', label: 'Full name', autoComplete: 'name', maxLength: 100, minLength: 2, placeholder: 'e.g. Mohamed Ali' })}
      {field({ name: 'email', label: 'Email address', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
      {field({ name: 'password', label: 'Password', type: 'password', autoComplete: reg ? 'new-password' : 'current-password', ...(reg ? { minLength: 8 } : {}) })}
      {reg && <p className="-mt-2 text-xs text-slate-500">At least 8 characters, with an upper-case letter, a lower-case letter and a number.</p>}
      {reg && field({ name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' })}
      <button className="btn-primary w-full" disabled={busy || !!ok}>{busy ? 'Please wait…' : reg ? 'Create account' : 'Log in'}</button>
      <p className="text-center text-sm text-slate-600">
        {reg ? <>Already registered? <Link className="font-semibold text-navy-600 underline" href={safeNext ? `/login?next=${encodeURIComponent(safeNext)}` : '/login'}>Log in</Link></>
          : <>New student? <Link className="font-semibold text-navy-600 underline" href={safeNext ? `/register?next=${encodeURIComponent(safeNext)}` : '/register'}>Create an account</Link></>}
      </p>
    </form>
  )
}
