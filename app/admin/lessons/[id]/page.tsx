import { notFound } from 'next/navigation'
import { LessonForm } from '@/components/admin/Forms'
import { categories } from '@/lib/queries'
import { q, q1, isUuid } from '@/lib/db'
export const metadata = { title: 'Edit lesson' }

export default async function EditLesson({ params }: { params: { id: string } }) {
  if (!isUuid(params.id)) notFound()
  const l = await q1(`select id, title, content, category_id, to_char(publish_date,'YYYY-MM-DD') pd, status from daily_lessons where id=$1`, [params.id]); if (!l) notFound()
  const files = await q(`select f.id, f.original_name, f.size_bytes from lesson_attachments a join files f on f.id=a.file_id where a.lesson_id=$1 order by f.created_at`, [l.id])
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">Edit lesson</h1>
    <LessonForm categories={await categories('lesson')} init={{ id: l.id, title: l.title, content: l.content, categoryId: l.category_id, publishDate: l.pd, status: l.status, attachments: files.map(f => ({ id: f.id, name: f.original_name, size: Number(f.size_bytes) })) }} /></>)
}
