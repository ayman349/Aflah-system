import Link from 'next/link'
import Icon from '@/components/Icon'
import { PageHeader } from '@/components/ui'
export const metadata = { title: 'About' }

const areas = [
  ['plug', 'Electrical Installation', 'Safe, standards-aware wiring and installation of residential and commercial systems.'],
  ['bolt', 'Electrical Power Systems', 'How electrical energy is generated, transmitted, distributed and protected.'],
  ['sun', 'Solar Energy Systems', 'Photovoltaic technology, system design, installation and upkeep.'],
  ['chip', 'Electronics', 'Components and circuits that underpin control, measurement and communication equipment.'],
  ['shield', 'Electrical Safety', 'Recognising hazards and applying protective measures every day on the job.'],
  ['wrench', 'Practical Technical Skills', 'Tools, testing, fault finding and maintenance techniques learned by doing.'],
]
export default function About() {
  return (
    <>
      <PageHeader eyebrow="About us" title="About Aflax Electrical College">An electrical education platform in Hargeisa, Somaliland, dedicated to building practical, safe and career-ready technical skills.</PageHeader>
      <div className="wrap grid gap-12 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <section><h2 className="text-2xl font-extrabold text-navy-800">Who we are</h2>
            <p className="mt-3 leading-7 text-slate-600">Aflax Electrical College provides electrical and technical education through an online learning platform. Students can follow video courses, read books and technical documents, and keep up with daily lessons written by the college.</p></section>
          <section><h2 className="text-2xl font-extrabold text-navy-800">Our mission</h2>
            <p className="mt-3 leading-7 text-slate-600">To make high-quality electrical education accessible, combining sound theory with hands-on technical skills so that graduates can work confidently and safely in the electrical and energy sector.</p></section>
          <section><h2 className="text-2xl font-extrabold text-navy-800">Our vision and objectives</h2>
            <ul className="mt-3 space-y-3 text-slate-600">
              {['Become a trusted source of electrical and technical learning in the region.', 'Teach electrical principles clearly, from the basics to advanced topics.', 'Place safety at the centre of every subject.', 'Prepare students for professional careers and self-employment in technical trades.', 'Keep learning resources organised, current and easy to reach.'].map(t =>
                <li key={t} className="flex gap-3"><Icon n="check" className="mt-1 h-5 w-5 shrink-0 text-brand-dark" />{t}</li>)}
            </ul></section>
          <section><h2 className="text-2xl font-extrabold text-navy-800">Why electrical education matters</h2>
            <p className="mt-3 leading-7 text-slate-600">Reliable electricity underpins homes, businesses, health care and industry, and demand is growing for skilled people who can install, maintain and repair electrical systems, including renewable solutions such as solar power. Strong technical skills open doors to stable work and entrepreneurship, while safe practice protects lives and property.</p></section>
          <section><h2 className="text-2xl font-extrabold text-navy-800">Practical and theoretical learning</h2>
            <p className="mt-3 leading-7 text-slate-600">Understanding why something works is as important as knowing how to do it. Our materials pair theory (books, documents and lessons) with practical demonstration (course videos), helping students build confidence they can apply in the workshop and on site.</p></section>
        </div>
        <aside className="space-y-6">
          <div className="card circuit bg-navy-800 p-6 text-white"><h3 className="text-lg font-bold text-brand">What we offer students</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">{['Video courses with a built-in player', 'PDF books and technical documents', 'Daily lessons to read online', 'A personal student dashboard'].map(t => <li key={t} className="flex gap-2"><Icon n="check" className="h-5 w-5 shrink-0 text-brand" />{t}</li>)}</ul>
            <Link href="/register" className="btn-primary mt-6 w-full">Join as a student</Link></div>
        </aside>
      </div>
      <section className="bg-white py-14"><div className="wrap">
        <h2 className="text-center text-3xl font-extrabold text-navy-800">What you can study</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{areas.map(([i, t, d]) =>
          <div key={t} className="card-hover p-6"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-brand"><Icon n={i} className="h-6 w-6" /></span><h3 className="mt-4 font-bold text-navy-800">{t}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{d}</p></div>)}</div>
      </div></section>
    </>
  )
}
