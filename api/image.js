import { minimax, readJson } from './_minimax.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = readJson(req)
  const prompt = String(body.prompt || '').slice(0, 1200).trim()
  if (!prompt) return res.status(400).json({ error: 'prompt required' })

  try {
    const data = await minimax('/v1/image_generation', {
      model: process.env.MINIMAX_IMAGE_MODEL || 'image-01',
      prompt,
      aspect_ratio: String(body.ratio || '16:9'),
      response_format: 'base64',
      n: 1,
      prompt_optimizer: true,
    })
    const b64 = data?.data?.image_base64?.[0]
    const url = data?.data?.image_urls?.[0]
    if (!b64 && !url) throw new Error('no image in MiniMax response')
    res.status(200).json(b64 ? { b64: `data:image/jpeg;base64,${b64}` } : { url })
  } catch (e) {
    res.status(503).json({ error: String(e.message || e) })
  }
}
