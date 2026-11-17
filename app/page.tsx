import Link from 'next/link'
import Icon from '@/components/Icon'
import { CourseCard, Empty } from '@/components/ui'
import { publishedCourses, publishedLessons, fmtDate } from '@/lib/queries'
import { getUser } from '@/lib/auth'

const services = [
  ['plug', 'Electrical Installation', 'Wiring methods, circuits, distribution boards and safe installation practice.'],
  ['bolt', 'Electrical Power Systems', 'Generation, transmission, distribution and the fundamentals of power networks.'],
  ['sun', 'Solar Energy Systems', 'Photovoltaic principles, system sizing, installation and maintenance.'],
  ['chip', 'Electronics', 'Components, circuits and the electronics behind modern equipment.'],
  ['shield', 'Electrical Safety', 'Hazard awareness, protective measures and safe working procedures.'],
  ['wrench', 'Practical Technical Skills', 'Hands-on techniques, testing, fault finding and maintenance.'],
]
const why = [
  ['cap', 'Theory and practice together', 'Lessons connect the science behind electricity with the practical skills used on real jobs.'],
  ['play', 'Learn at your own pace', 'Watch course videos, read books and follow daily lessons whenever it suits you.'],
  ['book', 'A growing resource library', 'Textbooks, guides and manuals are collected in one place for students to read and download.'],
  ['shield', 'Safety first', 'Safe working practice is built into how electrical subjects are taught.'],
]

export default async function Home() {
  const [courses, lessons, user] = await Promise.all([publishedCourses({ limit: 6 }), publishedLessons({ limit: 3 }), getUser()])
  return (
    <>
      <section className="circuit relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-900/90 to-transparent" />
        <div className="wrap relative grid items-center gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div className="fade-up">
            <span className="badge !bg-brand/20 !text-brand">Hargeisa, Somaliland · Online learning</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">Learn electrical skills that <span className="text-brand">power your career</span></h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">Aflax Electrical College brings electrical installation, power systems, solar energy, electronics and safety to students through video courses, books and daily lessons.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="btn-primary px-7 py-3 text-base">Explore Courses <Icon n="arrow" className="h-4 w-4" /></Link>
              {!user && <Link href="/register" className="btn-ghost-light px-7 py-3 text-base">Register as a student</Link>}
            </div>
          </div>
          <div className="relative hidden md:block" aria-hidden="true">
            <div className="mx-auto flex h-72 w-72 items-center justify-center rounded-full border border-brand/30 bg-navy-800/60 shadow-[0_0_80px_rgba(255,159,28,.25)]">
              <div className="flex h-52 w-52 items-center justify-center rounded-full border border-brand/50 bg-navy-900"><Icon n="bolt" fill className="h-28 w-28 text-brand" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="eyebrow">Featured</p><h2 className="mt-1 text-3xl font-extrabold text-navy-800">Featured courses</h2></div>
          {courses.length > 0 && <Link href="/courses" className="text-sm font-semibold text-navy-600 hover:text-brand-dark">View all courses →</Link>}
        </div>
        <div className="mt-8">
          {courses.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.map(c => <CourseCard key={c.id} c={c} />)}</div>
            : <Empty icon="play" title="Courses are coming soon" action={<Link href="/documentation" className="btn-dark">Browse learning materials</Link>}>No courses have been published yet. Please check back shortly.</Empty>}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="wrap">
          <div className="mx-auto max-w-2xl text-center"><p className="eyebrow">What we teach</p><h2 className="mt-1 text-3xl font-extrabold text-navy-800">Our educational services</h2>
            <p className="mt-3 text-slate-600">Subject areas that give students a solid foundation for work in the electrical and energy sector.</p></div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(([i, t, d]) => (
              <div key={t} className="card-hover p-6"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-brand"><Icon n={i} className="h-6 w-6" /></span>
                <h3 className="mt-4 text-lg font-bold text-navy-800">{t}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{d}</p></div>))}
          </div>
        </div>
      </section>

      <section className="wrap py-16">
        <div className="mx-auto max-w-2xl text-center"><p className="eyebrow">Why Aflax</p><h2 className="mt-1 text-3xl font-extrabold text-navy-800">Why choose Aflax Electrical College</h2></div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {why.map(([i, t, d]) => (
            <div key={t} className="flex gap-4 rounded-xl border-l-4 border-brand bg-white p-5 shadow-sm"><span className="mt-0.5 text-brand-dark"><Icon n={i} className="h-7 w-7" /></span>
              <div><h3 className="font-bold text-navy-800">{t}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{d}</p></div></div>))}
        </div>
      </section>

      {lessons.length > 0 && (
        <section className="bg-white py-14"><div className="wrap">
          <div className="flex items-end justify-between"><div><p className="eyebrow">Keep learning</p><h2 className="mt-1 text-2xl font-extrabold text-navy-800">Latest daily lessons</h2></div>
            <Link href="/documentation/lessons" className="text-sm font-semibold text-navy-600 hover:text-brand-dark">All lessons →</Link></div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">{lessons.map(l => (
            <Link key={l.id} href={`/documentation/lessons/${l.id}`} className="card-hover p-5"><p className="text-xs text-slate-500">{fmtDate(l.publish_date)}{l.category_name && ` · ${l.category_name}`}</p>
              <h3 className="mt-1 font-bold text-navy-800">{l.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-600">{l.content.replace(/[#*`>\[\]]/g, '').slice(0, 140)}</p></Link>))}</div>
        </div></section>)}

      <section className="wrap py-16">
        <div className="circuit relative overflow-hidden rounded-2xl bg-navy-800 px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-extrabold">Ready to start learning?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">Create a free student account to watch course videos, read books and follow daily lessons.</p>
          <div className="mt-7 flex justify-center gap-3">{user ? <Link href="/dashboard" className="btn-primary px-7 py-3">Go to my dashboard</Link> : <><Link href="/register" className="btn-primary px-7 py-3">Register now</Link><Link href="/login" className="btn-ghost-light px-7 py-3">Login</Link></>}</div>
        </div>
      </section>
    </>
  )
}
