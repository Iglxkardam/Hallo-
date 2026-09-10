/** MiniMax image generation for day illustrations. Server caches to disk. */

const memo = new Map<string, string>()
const inflight = new Map<string, Promise<string | null>>()

export async function generateImage(prompt: string, ratio = '16:9'): Promise<string | null> {
  const key = `${prompt}|${ratio}`
  if (memo.has(key)) return memo.get(key)!
  if (inflight.has(key)) return inflight.get(key)!

  const p = (async () => {
    try {
      const r = await fetch('/api/image', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt, ratio }),
      })
      if (!r.ok) return null
      const j = await r.json()
      const src: string | undefined = j.b64 || j.url
      if (src) memo.set(key, src)
      return src ?? null
    } catch {
      return null
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

/** Consistent art direction so every generated scene belongs to the same set. */
export const scenePrompt = (theme: string) =>
  `Warm editorial flat illustration for a German language textbook: ${theme}. ` +
  `Soft paper texture, muted cream and dusty blue palette with one warm accent, ` +
  `clean geometric shapes, gentle grain, no text, no letters, no watermark.`
