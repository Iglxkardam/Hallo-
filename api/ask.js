import { minimax, readJson } from './_minimax.js'
import { ASK_MODEL, askMessages, parseAnswer } from './_ask.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  const body = readJson(req)
  const question = String(body.question || '').slice(0, 1000).trim()
  if (!question) return res.status(400).json({ error: 'question required' })

  try {
    const data = await minimax('/v1/text/chatcompletion_v2', {
      model: ASK_MODEL(),
      messages: askMessages(question, body.history),
      temperature: 0.3,
    })
    res.setHeader('cache-control', 'no-store')
    res.status(200).json(parseAnswer(data?.choices?.[0]?.message?.content))
  } catch (e) {
    res.status(503).json({ error: String(e.message || e) })
  }
}
