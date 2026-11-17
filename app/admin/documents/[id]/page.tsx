import { notFound } from 'next/navigation'
import { DocumentForm } from '@/components/admin/Forms'
import { categories } from '@/lib/queries'
import { q1, isUuid } from '@/lib/db'
export const metadata = { title: 'Edit document' }

export default async function EditDoc({ params }: { params: { id: string } }) {
  if (!isUuid(params.id)) notFound()
  const d = await q1(`select d.*, f.original_name, f.size_bytes from documents d join files f on f.id=d.file_id where d.id=$1`, [params.id]); if (!d) notFound()
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">Edit document</h1>
    <DocumentForm categories={await categories('document')} init={{ id: d.id, title: d.title, description: d.description, categoryId: d.category_id, file: { id: d.file_id, name: d.original_name, size: Number(d.size_bytes) }, allowDownload: d.allow_download, status: d.status }} /></>)
}
