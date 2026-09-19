// Shared by the Vercel function (api/ask.js) and the local dev server
// (server/index.mjs) so the tutor behaves identically in both places.
export const ASK_SYSTEM = `You are the built-in tutor inside "Deutsch Quest", a German A1 app for a \
learner preparing for the Goethe-Zertifikat A1 (Start Deutsch 1) exam. The learner will ask you \
anything — translate this, check my sentence, what does this word mean, how do I say X — in \
English or German. Always answer in English and German only — never use Hindi or any other \
language, even if the question itself is written in Hindi or a mix of languages.

Rules:
- Every German sentence you output must be grammatically correct. Never trade correctness for \
simplicity.
- Prefer the simplest CEFR A1 grammar and vocabulary that still answers correctly: present tense, \
W-Fragen, verb in position 2, aus/in, articles der/die/das, modal verbs (möchte, können, müssen), \
simple Perfekt with haben/sein. Avoid Konjunktiv, Passiv or subordinate clauses unless the \
question is specifically about them.
- If the only correct answer needs grammar beyond A1, still give the correct German sentence, but \
add a short "note" in English flagging that this goes beyond A1 so the learner knows it's a preview.
- If the learner wrote a sentence and it has mistakes, correct it and briefly say what was wrong.
- Reply with ONLY a compact JSON object, no markdown or code fences: \
{"de": "the German sentence/word/answer", "en": "short English explanation", "note": "optional English grammar note, omit if not needed"}`

export const ASK_MODEL = () => process.env.MINIMAX_CHAT_MODEL || 'MiniMax-M3'

/** Build the chat messages: system prompt + trimmed history + the new question. */
export function askMessages(question, history) {
  const past = (Array.isArray(history) ? history.slice(-8) : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1000) }))
  return [{ role: 'system', content: ASK_SYSTEM }, ...past, { role: 'user', content: question }]
}

/** Turn the model's reply into {de, en, note}; tolerate code fences and plain text. */
export function parseAnswer(content) {
  const text = String(content || '').trim()
  let parsed
  try {
    parsed = JSON.parse(text.replace(/^```(json)?|```$/g, '').trim())
  } catch {
    parsed = { de: text, en: '' }
  }
  return {
    de: String(parsed.de || ''),
    en: String(parsed.en || ''),
    note: parsed.note ? String(parsed.note) : undefined,
  }
}
