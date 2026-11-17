import { CategoryManager } from '@/components/admin/Common'
import { q } from '@/lib/db'
export const metadata = { title: 'Categories' }
export default async function Cats() {
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">Categories</h1><CategoryManager items={await q('select id, kind, name from categories order by name')} /></>)
}
