export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    minimax: Boolean(process.env.MINIMAX_API_KEY),
    model: process.env.MINIMAX_TTS_MODEL || 'speech-2.6-hd',
  })
}
