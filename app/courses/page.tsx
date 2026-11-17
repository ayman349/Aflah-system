import { CourseCard, Empty, PageHeader, Chips, SearchBox } from '@/components/ui'
import { publishedCourses, categories } from '@/lib/queries'
export const metadata = { title: 'Courses' }

export default async function Courses({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = searchParams.q?.trim().slice(0, 80)
  const [courses, cats] = await Promise.all([publishedCourses({ search: q, category: searchParams.category }), categories('course')])
  return (
    <>
      <PageHeader eyebrow="Learn" title="Courses">Browse our published courses and watch lessons in the built-in video player.</PageHeader>
      <div className="wrap py-10">
        <div className="mb-6 space-y-4">
          <SearchBox action="/courses" defaultValue={q} placeholder="Search courses…" hidden={{ category: searchParams.category }} />
          <Chips base="/courses" items={cats} active={searchParams.category} extra={{ q }} />
        </div>
        {courses.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.map(c => <CourseCard key={c.id} c={c} />)}</div>
          : <Empty icon="play" title={q || searchParams.category ? 'No courses match your search' : 'No courses published yet'}>{q || searchParams.category ? 'Try a different search term or category.' : 'New courses will appear here as soon as they are published.'}</Empty>}
      </div>
    </>
  )
}
