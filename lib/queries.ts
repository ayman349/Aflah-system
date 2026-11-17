import { q, q1, isUuid } from './db'

export type Course = { id: string; title: string; description: string; instructor_name: string; category_id: number | null; category_name: string | null; thumbnail_file_id: string | null; level: string; duration: string; status: string; created_at: Date; video_count: number }
const courseSel = `select c.*, cat.name as category_name, (select count(*)::int from course_videos v where v.course_id=c.id) as video_count
  from courses c left join categories cat on cat.id=c.category_id`

export const categories = (kind: string) => q<{ id: number; name: string }>('select id, name from categories where kind=$1 order by name', [kind])

export function publishedCourses(opts: { search?: string; category?: string; limit?: number } = {}) {
  const p: unknown[] = [], w = [`c.status='published'`]
  if (opts.search) { p.push(`%${opts.search}%`); w.push(`(c.title ilike $${p.length} or c.description ilike $${p.length} or c.instructor_name ilike $${p.length})`) }
  if (opts.category && /^\d+$/.test(opts.category)) { p.push(Number(opts.category)); w.push(`c.category_id=$${p.length}`) }
  return q<Course>(`${courseSel} where ${w.join(' and ')} order by c.created_at desc ${opts.limit ? `limit ${Number(opts.limit)}` : ''}`, p)
}
export async function courseById(id: string, publishedOnly = true) {
  if (!isUuid(id)) return null
  return q1<Course>(`${courseSel} where c.id=$1 ${publishedOnly ? `and c.status='published'` : ''}`, [id])
}
export const videosOf = (courseId: string) =>
  q<{ id: string; title: string; file_id: string | null; external_url: string | null }>('select id, title, file_id, external_url from course_videos where course_id=$1 order by position, created_at', [courseId])

export type Doc = { id: string; title: string; description: string; category_name: string | null; allow_download: boolean; size_bytes: string; created_at: Date; file_id: string }
export function publishedDocs(opts: { search?: string; category?: string } = {}) {
  const p: unknown[] = [], w = [`d.status='published'`]
  if (opts.search) { p.push(`%${opts.search}%`); w.push(`(d.title ilike $${p.length} or d.description ilike $${p.length})`) }
  if (opts.category && /^\d+$/.test(opts.category)) { p.push(Number(opts.category)); w.push(`d.category_id=$${p.length}`) }
  return q<Doc>(`select d.*, cat.name as category_name, f.size_bytes from documents d join files f on f.id=d.file_id left join categories cat on cat.id=d.category_id where ${w.join(' and ')} order by d.created_at desc`, p)
}
export async function docById(id: string) {
  if (!isUuid(id)) return null
  return q1<Doc>(`select d.*, cat.name as category_name, f.size_bytes from documents d join files f on f.id=d.file_id left join categories cat on cat.id=d.category_id where d.id=$1 and d.status='published'`, [id])
}

export type Lesson = { id: string; title: string; content: string; category_name: string | null; publish_date: string; created_at: Date }
const lessonSel = `select l.id, l.title, l.content, cat.name as category_name, to_char(l.publish_date,'YYYY-MM-DD') as publish_date, l.created_at
  from daily_lessons l left join categories cat on cat.id=l.category_id`
export function publishedLessons(opts: { category?: string; limit?: number } = {}) {
  const p: unknown[] = [], w = [`l.status='published'`, `l.publish_date <= current_date`]
  if (opts.category && /^\d+$/.test(opts.category)) { p.push(Number(opts.category)); w.push(`l.category_id=$${p.length}`) }
  return q<Lesson>(`${lessonSel} where ${w.join(' and ')} order by l.publish_date desc, l.created_at desc ${opts.limit ? `limit ${Number(opts.limit)}` : ''}`, p)
}
export async function lessonById(id: string) {
  if (!isUuid(id)) return null
  return q1<Lesson>(`${lessonSel} where l.id=$1 and l.status='published' and l.publish_date <= current_date`, [id])
}
export const lessonFiles = (id: string) =>
  q<{ id: string; original_name: string; size_bytes: string }>('select f.id, f.original_name, f.size_bytes from lesson_attachments a join files f on f.id=a.file_id where a.lesson_id=$1 order by f.created_at', [id])

export const fmtSize = (b: number | string) => { const n = Number(b); return n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB` }
export const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
