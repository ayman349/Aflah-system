import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'
import AuthForm from '@/components/AuthForm'
export const metadata = { title: 'Register' }
export default async function Register({ searchParams }: { searchParams: { next?: string } }) {
  const u = await getUser(); if (u) redirect(u.role === 'admin' ? '/admin' : '/dashboard')
  return <div className="circuit bg-navy-900 px-4 py-16"><AuthForm mode="register" next={searchParams.next} /></div>
}
