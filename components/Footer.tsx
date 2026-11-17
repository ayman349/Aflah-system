import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL, phone = process.env.NEXT_PUBLIC_CONTACT_PHONE, addr = process.env.NEXT_PUBLIC_CONTACT_ADDRESS
  return (
    <footer className="mt-20 bg-navy-950 text-slate-300">
      <div className="wrap grid gap-10 py-12 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Practical and theoretical electrical education, delivered online from Hargeisa, Somaliland.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Explore</h3>
          <ul className="space-y-2 text-sm">
            {[['/about', 'About the college'], ['/courses', 'Courses'], ['/documentation/books', 'Books & Documents'], ['/documentation/lessons', 'Daily Lessons'], ['/register', 'Student registration'], ['/login', 'Login']].map(([h, t]) =>
              <li key={h}><Link href={h} className="transition hover:text-brand">{t}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Contact</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>Hargeisa, Somaliland</li>
            {addr && <li>{addr}</li>}
            {phone && <li><a className="hover:text-brand" href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a></li>}
            {email && <li><a className="hover:text-brand" href={`mailto:${email}`}>{email}</a></li>}
            {!email && !phone && <li className="text-slate-500">Contact details will be published here soon.</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">© {new Date().getFullYear()} Aflax Electrical College. All rights reserved.</div>
    </footer>
  )
}
