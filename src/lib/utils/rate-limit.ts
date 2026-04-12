/**
 * In-memory sliding-window rate limiter.
 *
 * Works per serverless instance — not shared across Vercel function invocations,
 * but effective against burst attacks hitting the same instance.
 * For cross-instance limiting, upgrade to Vercel KV or Redis.
 */

interface Window {
  timestamps: number[]
  blocked: boolean
}

const store = new Map<string, Window>()

// Clean up stale keys every 5 minutes to avoid memory leaks
setInterval(() => {
  const cutoff = Date.now() - 60_000
  for (const [key, win] of store) {
    if (win.timestamps.every(t => t < cutoff)) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Check if the given key is within the allowed rate.
 *
 * @param key      Unique identifier (e.g. IP + endpoint)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 * @returns        { allowed: true } or { allowed: false, retryAfterMs }
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const cutoff = now - windowMs

  let win = store.get(key)
  if (!win) {
    win = { timestamps: [], blocked: false }
    store.set(key, win)
  }

  // Remove timestamps outside the window
  win.timestamps = win.timestamps.filter(t => t > cutoff)

  if (win.timestamps.length >= limit) {
    const oldest = win.timestamps[0]
    const retryAfterMs = oldest + windowMs - now
    return { allowed: false, retryAfterMs }
  }

  win.timestamps.push(now)
  return { allowed: true }
}
