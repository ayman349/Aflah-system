import Link from 'next/link'
import { notFound } from 'next/navigation'
import Icon from '@/components/Icon'
import { Thumb } from '@/components/ui'
import { EnrollButton, VideoPlaylist } from '@/components/ClientButtons'
import { courseById, videosOf, fmtDate } from '@/lib/queries'
import { getUser } from '@/lib/auth'
import { q, q1 } from '@/lib/db'
import CourseReviews from '@/components/CourseReviews'

function embedOf(url: string): { embed: string | null; src: string | null } {
  try {
    const u = new URL(url), h = u.hostname.replace(/^www\./, '')
    if (h === 'youtu.be') return { embed: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`, src: null }
    if (h === 'youtube.com' && u.searchParams.get('v')) return { embed: `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}`, src: null }
    if (h === 'vimeo.com' && /^\/\d+/.test(u.pathname)) return { embed: `https://player.vimeo.com/video/${u.pathname.slice(1).split('/')[0]}`, src: null }
    if (/\.(mp4|webm|ogv)$/i.test(u.pathname)) return { embed: null, src: url }
  } catch {}
  return { embed: null, src: null }
}

export async function generateMetadata({ params }: { params: { id: string } }) { const c = await courseById(params.id); return { title: c?.title ?? 'Course' } }

export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await courseById(params.id); if (!course) notFound()
  const [videos, user] = await Promise.all([videosOf(course.id), getUser()])
  const enrolled = user ? !!(await q1('select 1 from enrollments where user_id=$1 and course_id=$2', [user.id, course.id])) : false
  const [reviews, ratingSummary, ownReview] = await Promise.all([
    q<{ id: string; full_name: string; rating: number; comment: string; created_at: Date }>(
      `select r.id, u.full_name, r.rating, r.comment, r.created_at
       from course_reviews r join users u on u.id=r.user_id
       where r.course_id=$1 order by r.created_at desc`, [course.id]),
    q1<{ average: string; count: number }>(
      'select coalesce(avg(rating),0)::numeric(3,2)::text as average, count(*)::int as count from course_reviews where course_id=$1', [course.id]),
    user?.role === 'student' ? q1<{ rating: number; comment: string }>(
      'select rating, comment from course_reviews where course_id=$1 and user_id=$2', [course.id, user.id]) : Promise.resolve(null)
  ])
  const list = videos.map(v => v.file_id ? { id: v.id, title: v.title, src: `/media/${v.file_id}`, embed: null, link: null } : { id: v.id, title: v.title, link: v.external_url, ...embedOf(v.external_url!) })
  return (
    <>
      <section className="circuit bg-navy-900 py-12 text-white"><div className="wrap grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
        <div className="fade-up">
          <Link href="/courses" className="text-sm text-brand hover:underline">← All courses</Link>
          <div className="mt-3 flex flex-wrap gap-2">{course.category_name && <span className="badge">{course.category_name}</span>}<span className="badge-gray">{course.level}</span></div>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{course.title}</h1>
          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-300">
            <div><dt className="inline text-slate-400">Instructor: </dt><dd className="inline font-semibold">{course.instructor_name || 'Aflax Electrical College'}</dd></div>
            {course.duration && <div><dt className="inline text-slate-400">Duration: </dt><dd className="inline font-semibold">{course.duration}</dd></div>}
            <div><dt className="inline text-slate-400">Added: </dt><dd className="inline font-semibold">{fmtDate(course.created_at)}</dd></div>
          </dl>
        </div>
        <Thumb id={course.thumbnail_file_id} alt={course.title} className="aspect-video w-full rounded-xl shadow-2xl" />
      </div></section>
      <div className="wrap grid gap-10 py-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-2xl font-extrabold text-navy-800">Course videos</h2>
            {!list.length ? <div className="card p-8 text-center text-slate-500">Videos for this course have not been added yet.</div>
              : user ? <VideoPlaylist videos={list} />
              : <div className="card flex flex-col items-center gap-3 p-10 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-brand"><Icon n="lock" className="h-7 w-7" /></span>
                  <h3 className="text-lg font-bold text-navy-800">Log in to watch this course</h3><p className="text-sm text-slate-500">{list.length} video{list.length > 1 ? 's' : ''} available to registered students.</p>
                  <div className="flex gap-3"><Link href={`/login?next=/courses/${course.id}`} className="btn-primary">Login</Link><Link href={`/register?next=/courses/${course.id}`} className="btn-outline">Register</Link></div></div>}
          </section>
          <section><h2 className="mb-3 text-2xl font-extrabold text-navy-800">About this course</h2>
            {course.description ? <div className="space-y-4 leading-7 text-slate-600">{course.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div> : <p className="text-slate-500">No description has been added yet.</p>}</section>
          <CourseReviews courseId={course.id} reviews={reviews.map(r => ({...r, created_at: new Date(r.created_at).toISOString()}))} average={Number(ratingSummary?.average ?? 0)} count={ratingSummary?.count ?? 0} user={user ? {id:user.id,role:user.role} : null} ownReview={ownReview} />
        </div>
        <aside className="space-y-4"><div className="card space-y-3 p-5">
          <h3 className="font-bold text-navy-800">Your learning</h3>
          {user ? <EnrollButton courseId={course.id} enrolled={enrolled} /> : <Link href={`/register?next=/courses/${course.id}`} className="btn-primary w-full">Register to enrol</Link>}
          <p className="text-xs text-slate-500">Enrolled courses appear on your student dashboard.</p></div>
          <div className="card p-5"><h3 className="font-bold text-navy-800">Related resources</h3><ul className="mt-2 space-y-2 text-sm text-navy-600">
            <li><Link className="hover:text-brand-dark" href="/documentation/books">→ Books & documents</Link></li><li><Link className="hover:text-brand-dark" href="/documentation/lessons">→ Daily lessons</Link></li></ul></div>
        </aside>
      </div>
    </>
  )
}
