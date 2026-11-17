'use client'
import { useState } from 'react'
import Link from 'next/link'

type Review = { id: string; full_name: string; rating: number; comment: string; created_at: string }
export default function CourseReviews({ courseId, reviews, average, count, user, ownReview }: {
  courseId: string; reviews: Review[]; average: number; count: number
  user: { id: string; role: string } | null; ownReview: { rating: number; comment: string } | null
}) {
  const [rating, setRating] = useState(ownReview?.rating ?? 5)
  const [comment, setComment] = useState(ownReview?.comment ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, comment }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not submit review')
      setMessage('Your review has been published.')
      // Refresh to show the saved review and updated average.
      window.location.reload()
    } catch (e: any) { setError(e.message || 'Something went wrong') }
    finally { setBusy(false) }
  }
  return <section id="reviews" className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-2xl font-extrabold text-navy-800">Student reviews</h2><p className="mt-1 text-sm text-slate-500">Read what students think about this course.</p></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-right">
        <div className="text-2xl font-extrabold text-amber-700">{count ? average.toFixed(1) : '—'} <span className="text-lg">★</span></div>
        <div className="text-xs text-amber-800">{count} {count === 1 ? 'review' : 'reviews'}</div>
      </div>
    </div>
    {user?.role === 'student' ? <form onSubmit={submit} className="card space-y-3 p-5">
      <h3 className="font-bold text-navy-800">{ownReview ? 'Update your review' : 'Write a review'}</h3>
      <div><label className="lbl">Your rating</label><div className="flex gap-1" role="radiogroup" aria-label="Star rating">
        {[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} aria-pressed={rating===n} className={`text-3xl transition ${n <= rating ? 'text-amber-400' : 'text-slate-300'} hover:scale-110`}>★</button>)}
        <span className="ml-2 self-center text-sm text-slate-500">{rating} out of 5</span>
      </div></div>
      <div><label className="lbl" htmlFor="course-review-comment">Your comment</label><textarea id="course-review-comment" className="inp min-h-24" minLength={3} maxLength={1500} required value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share your experience with this course…" /></div>
      {error && <p className="alert-err">{error}</p>}{message && <p className="alert-ok">{message}</p>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Submitting…' : ownReview ? 'Update review' : 'Publish review'}</button>
    </form> : !user ? <div className="card p-5 text-sm text-slate-600"> <Link className="font-semibold text-navy-700 underline" href={`/login?next=/courses/${courseId}#reviews`}>Log in</Link> as a student to leave a rating and comment.</div> : null}
    <div className="space-y-3">
      {reviews.length ? reviews.map(r => <article key={r.id} className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold text-navy-800">{r.full_name}</div><time className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</time></div>
        <div className="my-2 tracking-wider text-amber-400" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}<span className="text-slate-300">{'★'.repeat(5-r.rating)}</span></div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{r.comment}</p>
      </article>) : <div className="card p-8 text-center text-sm text-slate-500">No reviews yet. Be the first student to review this course.</div>}
    </div>
  </section>
}
