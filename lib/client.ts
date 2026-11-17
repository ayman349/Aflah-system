'use client'
export type ApiResult<T = any> = { ok: boolean; status: number; data: T; error?: string; fields?: Record<string, string> }
export async function api<T = any>(method: string, url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' })
    const data = await r.json().catch(() => ({}))
    return { ok: r.ok, status: r.status, data, error: data?.error, fields: data?.fields }
  } catch { return { ok: false, status: 0, data: {} as T, error: 'Network error. Check your connection and try again.' } }
}
