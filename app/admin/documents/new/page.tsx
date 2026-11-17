import { DocumentForm } from '@/components/admin/Forms'
import { categories } from '@/lib/queries'
export const metadata = { title: 'Upload document' }
export default async function NewDoc() {
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">Upload book / document</h1>
    <DocumentForm categories={await categories('document')} init={{ title: '', description: '', categoryId: null, file: null, allowDownload: true, status: 'draft' }} /></>)
}
