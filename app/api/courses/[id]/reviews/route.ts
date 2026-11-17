import { handler, HttpError, json } from '@/lib/http'
import { apiUser } from '@/lib/auth'
import { q, q1, isUuid } from '@/lib/db'

export const POST = handler(async (req, { params }) => {
  const user = await apiUser()
  if (user.role !== 'student') throw new HttpError(403, 'Only students can submit course reviews')
  if (!isUuid(params.id)) throw new HttpError(404, 'Course not found')
  const course = await q1('select id from courses where id=$1 and status=\'published\'', [params.id])
  if (!course) throw new HttpError(404, 'Course not found')
  const body = await json<{ rating?: number; comment?: string }>(req)
  const rating = Number(body.rating)
  const comment = typeof body.comment === 'string' ? body.comment.trim() : ''
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5 stars')
  if (comment.length < 3 || comment.length > 1500) throw new HttpError(400, 'Comment must be between 3 and 1,500 characters')
  await q(
    `insert into course_reviews(course_id,user_id,rating,comment)
     values($1,$2,$3,$4)
     on conflict(course_id,user_id) do update set rating=excluded.rating, comment=excluded.comment, updated_at=now()`,
    [params.id, user.id, rating, comment]
  )
  return { ok: true }
})
