import { z } from 'zod'

const text = (min: number, max: number, label: string) =>
  z.string({ required_error: `${label} is required` }).trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} is too long`)

export const passwordRule = z.string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters').max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password needs a lower-case letter').regex(/[A-Z]/, 'Password needs an upper-case letter').regex(/\d/, 'Password needs a number')

export const registerSchema = z.object({
  fullName: text(2, 100, 'Full name'),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address').max(254),
  password: passwordRule,
  confirmPassword: z.string({ required_error: 'Please confirm your password' }),
}).refine(d => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128),
})

const uuidOrNull = z.string().uuid().nullable().optional().transform(v => v ?? null)
const statusEnum = z.enum(['draft', 'published'], { errorMap: () => ({ message: 'Invalid status' }) })
const categoryId = z.number().int().positive().nullable().optional().transform(v => v ?? null)

export const courseSchema = z.object({
  title: text(3, 150, 'Title'),
  description: z.string().trim().max(10000).default(''),
  instructorName: z.string().trim().max(100).default(''),
  categoryId,
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
  duration: z.string().trim().max(60).default(''),
  status: statusEnum.default('draft'),
  thumbnailFileId: uuidOrNull,
  videos: z.array(z.object({
    title: z.string().trim().max(150).default('Video'),
    fileId: uuidOrNull,
    url: z.string().trim().max(500).nullable().optional().transform(v => v || null),
  }).refine(v => v.fileId || v.url, { message: 'Each video needs an uploaded file or a link' })
    .refine(v => !v.url || /^https?:\/\//i.test(v.url), { message: 'Video links must start with http:// or https://' })).max(30).default([]),
})

export const documentSchema = z.object({
  title: text(3, 150, 'Title'),
  description: z.string().trim().max(5000).default(''),
  categoryId,
  fileId: z.string({ required_error: 'Please upload a PDF or document' }).uuid('Please upload a PDF or document'),
  allowDownload: z.boolean().default(true),
  status: statusEnum.default('draft'),
})

export const lessonSchema = z.object({
  title: text(3, 150, 'Title'),
  content: text(10, 50000, 'Lesson content'),
  categoryId,
  publishDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid date'),
  status: statusEnum.default('draft'),
  attachmentIds: z.array(z.string().uuid()).max(10).default([]),
})

export const statusPatch = z.object({ status: statusEnum })
export const categorySchema = z.object({ kind: z.enum(['course', 'document', 'lesson']), name: text(2, 80, 'Name') })
export const profileSchema = z.object({
  fullName: text(2, 100, 'Full name'),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
})
