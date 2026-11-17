import { CourseForm } from '@/components/admin/Forms'
import { categories } from '@/lib/queries'
export const metadata = { title: 'New course' }
export default async function NewCourse() {
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">New course</h1>
    <CourseForm categories={await categories('course')} init={{ title: '', description: '', instructorName: '', categoryId: null, level: 'Beginner', duration: '', status: 'draft', thumbnail: null, videos: [] }} /></>)
}
