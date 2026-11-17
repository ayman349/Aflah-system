import Link from 'next/link'
import { getUser } from '@/lib/auth'
import Logo from './Logo'
import Icon from './Icon'
import ThemeToggle from './ThemeToggle'

const links = [['/', 'Home'], ['/about', 'About'], ['/courses', 'Courses'], ['/documentation', 'Documentation']]

export default async function Navbar() {
  const u = await getUser()
  const first = u?.full_name.split(' ')[0]
  const account = u ? (
    <>
      <Link href={u.role === 'admin' ? '/admin' : '/dashboard'} className="navlink font-semibold text-brand">Welcome, {first}!</Link>
      {u.role === 'admin' && <Link href="/admin" className="navlink">Admin</Link>}
      <form action="/api/auth/logout" method="post"><button className="navlink w-full text-left">Logout</button></form>
    </>
  ) : (
    <>
      <Link href="/login" className="navlink">Login</Link>
      <Link href="/register" className="btn-primary btn-sm !px-4 !py-2">Register</Link>
    </>
  )
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-900/95 backdrop-blur">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map(([h, t]) => <Link key={h} href={h} className="navlink">{t}</Link>)}
          <span className="mx-2 h-5 w-px bg-white/20" />
          <ThemeToggle />
          {account}
        </nav>
        <details className="group relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-lg border border-white/20 p-2 text-white" aria-label="Open menu"><Icon n="menu" /></summary>
          <div className="absolute right-0 top-12 flex w-[min(17rem,calc(100vw-2rem))] flex-col gap-1 rounded-xl border border-white/10 bg-navy-800 p-3 shadow-2xl">
            {links.map(([h, t]) => <Link key={h} href={h} className="navlink">{t}</Link>)}
            <div className="my-1 h-px bg-white/10" />
            <div className="flex items-center justify-between px-3 py-1 text-sm text-slate-200">
              <span>Appearance</span>
              <ThemeToggle />
            </div>
            {account}
          </div>
        </details>
      </div>
    </header>
  )
}
