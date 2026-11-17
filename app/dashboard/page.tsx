import Link from 'next/link'
import Icon from '@/components/Icon'
import { Empty, Thumb } from '@/components/ui'
import { requireUser } from '@/lib/auth'
import { q } from '@/lib/db'
import { publishedLessons, fmtDate } from '@/lib/queries'
export const metadata = { title: 'My Dashboard' }

export default async function Dashboard() {
  const u = await requireUser('/dashboard')
  const [mine, lessons] = await Promise.all([
    q(`select c.id, c.title, c.thumbnail_file_id, c.instructor_name, (select count(*)::int from course_videos v where v.course_id=c.id) as videos
       from enrollments e join courses c on c.id=e.course_id where e.user_id=$1 and c.status='published' order by e.created_at desc`, [u.id]),
    publishedLessons({ limit: 3 }),
  ])
  return (
    <div className="wrap py-10">
      <div className="circuit rounded-2xl bg-navy-800 p-8 text-white"><p className="eyebrow !text-brand">Student dashboard</p>
        <h1 className="mt-1 text-3xl font-extrabold">Welcome, {u.full_name}!</h1>
        <p className="mt-1 text-sm text-slate-300">{u.email}{u.student_code && ` · Student ID ${u.student_code}`}</p></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">{[['/courses', 'play', 'Browse courses'], ['/documentation/books', 'file', 'Books & documents'], ['/documentation/lessons', 'cal', 'Daily lessons']].map(([h, i, t]) =>
        <Link key={h} href={h} className="card-hover flex items-center gap-3 p-5 font-semibold text-navy-800"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/20 text-brand-dark"><Icon n={i} /></span>{t}</Link>)}</div>
      <h2 className="mb-4 mt-10 text-2xl font-extrabold text-navy-800">My courses</h2>
      {mine.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{mine.map(c => (
        <Link key={c.id} href={`/courses/${c.id}`} className="card-hover overflow-hidden"><Thumb id={c.thumbnail_file_id} alt={c.title} className="h-36 w-full" />
          <div className="p-4"><h3 className="font-bold text-navy-800">{c.title}</h3><p className="mt-1 text-xs text-slate-500">{c.instructor_name || 'Aflax Electrical College'} · {c.videos} video{c.videos === 1 ? '' : 's'}</p></div></Link>))}</div>
        : <Empty icon="play" title="You haven’t enrolled in any course yet" action={<Link href="/courses" className="btn-primary">Explore courses</Link>}>Enrol in a course and it will appear here.</Empty>}
      {lessons.length > 0 && <><h2 className="mb-4 mt-10 text-2xl font-extrabold text-navy-800">Latest lessons</h2>
        <ul className="card divide-y divide-slate-100">{lessons.map(l => <li key={l.id}><Link href={`/documentation/lessons/${l.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"><span className="font-medium text-navy-800">{l.title}</span><span className="text-xs text-slate-500">{fmtDate(l.publish_date)}</span></Link></li>)}</ul></>}
    </div>
  )
}
