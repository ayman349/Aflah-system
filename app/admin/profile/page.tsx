import { ProfileForm } from '@/components/admin/Common'
import { requireAdminPage } from '@/lib/auth'
export const metadata = { title: 'My profile' }
export default async function Profile() {
  const u = await requireAdminPage()
  return (<><h1 className="mb-6 text-3xl font-extrabold text-navy-800">My profile</h1><ProfileForm name={u.full_name} email={u.email} /></>)
}
