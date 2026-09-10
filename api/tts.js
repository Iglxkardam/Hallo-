import { minimax, readJson } from './_minimax.js'

// Most phrases are already rendered into public/audio by "npm run audio",
// so this only runs for text the build did not cover.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = readJson(req)
  const text = String(body.text || '').slice(0, 900).trim()
  if (!text) return res.status(400).json({ error: 'text required' })

  const speed = Math.min(1.4, Math.max(0.6, Number(body.speed) || 1))
  const voice = String(body.voice || process.env.MINIMAX_TTS_VOICE || 'German_FriendlyMan')

  try {
    const data = await minimax('/v1/t2a_v2', {
      model: process.env.MINIMAX_TTS_MODEL || 'speech-2.6-hd',
      text,
      stream: false,
      language_boost: 'German',
      voice_setting: { voice_id: voice, speed, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3', channel: 1 },
    })
    const hex = data?.data?.audio
    if (!hex) throw new Error('no audio in MiniMax response')

    res.setHeader('content-type', 'audio/mpeg')
    res.setHeader('cache-control', 'public, max-age=31536000, immutable')
    res.status(200).send(Buffer.from(hex, 'hex'))
  } catch (e) {
    // 503 makes the client fall back to its local clips instead of failing
    res.status(503).json({ error: String(e.message || e) })
  }
}
