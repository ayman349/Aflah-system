import './globals.css'
import type { Metadata, Viewport } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic' // pages read live data from the database
export const metadata: Metadata = {
  title: { default: 'Aflax Electrical College', template: '%s · Aflax Electrical College' },
  description: 'Electrical education and training online — installation, power systems, solar energy, electronics and safety.',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#08152b' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col font-sans">
        <script dangerouslySetInnerHTML={{ __html: "try { if (localStorage.getItem('aflax-theme') === 'dark') document.documentElement.classList.add('dark') } catch (e) {}" }} />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
