import { LessonForm } from '@/components/admin/Forms'
import { categories } from '@/lib/queries'
export const metadata = { title: 'New lesson' }
export default async function NewLesson() {
  const today = new Date().toISOString().slice(0, 10)
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">New daily lesson</h1>
    <LessonForm categories={await categories('lesson')} init={{ title: '', content: '', categoryId: null, publishDate: today, status: 'draft', attachments: [] }} /></>)
}
