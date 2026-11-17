import { notFound } from 'next/navigation'
import { CourseForm } from '@/components/admin/Forms'
import { categories, courseById } from '@/lib/queries'
import { q, q1 } from '@/lib/db'
export const metadata = { title: 'Edit course' }

export default async function EditCourse({ params }: { params: { id: string } }) {
  const c = await courseById(params.id, false); if (!c) notFound()
  const [cats, vids, th] = await Promise.all([
    categories('course'),
    q(`select v.title, v.external_url, f.id as fid, f.original_name, f.size_bytes from course_videos v left join files f on f.id=v.file_id where v.course_id=$1 order by v.position, v.created_at`, [c.id]),
    c.thumbnail_file_id ? q1('select id, original_name from files where id=$1', [c.thumbnail_file_id]) : Promise.resolve(null),
  ])
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">Edit course</h1>
    <CourseForm categories={cats} init={{ id: c.id, title: c.title, description: c.description, instructorName: c.instructor_name, categoryId: c.category_id, level: c.level, duration: c.duration, status: c.status,
      thumbnail: th ? { id: th.id, name: th.original_name } : null,
      videos: vids.map(v => ({ title: v.title, file: v.fid ? { id: v.fid, name: v.original_name, size: Number(v.size_bytes) } : null, url: v.external_url ?? '' })) }} /></>)
}
