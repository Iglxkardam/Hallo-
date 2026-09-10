import { useCallback, useEffect, useState } from 'react'
import { useStore } from './store'

type Engine = 'minimax' | 'browser' | 'none'

/** Blob URLs for clips fetched from the API this session. */
const cache = new Map<string, string>()
let current: HTMLAudioElement | null = null
let minimaxOk: boolean | null = null

interface Manifest {
  voice: string
  model: string
  /** phrase -> { n: normal-speed file, s: slow file } */
  files: Record<string, { n?: string; s?: string } | string>
}

/**
 * Clips pre-rendered by `npm run audio` and served from public/audio. When a
 * phrase is in here playback is instant and needs no network at all.
 */
let manifest: Manifest | null | undefined
async function getManifest(): Promise<Manifest | null> {
  if (manifest !== undefined) return manifest
  try {
    const r = await fetch('/audio/manifest.json')
    manifest = r.ok ? ((await r.json()) as Manifest) : null
  } catch {
    manifest = null
  }
  return manifest
}

/** Probe the proxy once. */
async function probe(): Promise<boolean> {
  if (minimaxOk !== null) return minimaxOk
  try {
    const r = await fetch('/api/health')
    minimaxOk = Boolean((await r.json())?.minimax)
  } catch {
    minimaxOk = false
  }
  return minimaxOk
}

/**
 * A real German voice installed in the browser, or null.
 *
 * This matters: if we hand German text to speechSynthesis without a German
 * voice, the browser happily reads it with its ENGLISH voice. For a learner
 * that is worse than silence, so we refuse to speak rather than teach a wrong
 * pronunciation.
 */
export function germanBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null
  return speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('de')) ?? null
}

function browserSpeak(text: string): boolean {
  const voice = germanBrowserVoice()
  if (!voice) return false // never read German with an English voice
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.voice = voice
  u.lang = voice.lang
  u.rate = 0.95
  speechSynthesis.speak(u)
  return true
}

export function stopAudio() {
  current?.pause()
  current = null
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
}

/**
 * Speak German.
 *
 * Order: locally pre-rendered file → live MiniMax → a genuine German browser
 * voice → nothing. Slow playback uses a clip MiniMax rendered slowly; we never
 * time-stretch in the browser, because that smears consonants and is exactly
 * what makes German hard to follow.
 */
export async function speak(text: string, speed?: number, voice?: string): Promise<Engine> {
  const cfg = useStore.getState().settings
  speed = speed ?? cfg.speed
  voice = voice ?? cfg.voice

  const clean = text.trim()
  if (!clean) return 'none'
  stopAudio()

  const wantSlow = speed < 0.95
  const play = (url: string) =>
    new Promise<Engine>((resolve) => {
      const a = new Audio(url)
      a.playbackRate = 1 // the file is already at the right speed
      current = a
      a.onended = () => resolve('minimax')
      a.onerror = () => resolve(browserSpeak(clean) ? 'browser' : 'none')
      a.play().catch(() => resolve(browserSpeak(clean) ? 'browser' : 'none'))
    })

  // 1 — pre-rendered locally
  const man = await getManifest()
  const entry = man?.files?.[clean]
  if (entry && (!voice || voice === man?.voice)) {
    // older manifests stored a single filename per phrase
    const file = typeof entry === 'string' ? entry : (wantSlow ? entry.s : entry.n) ?? entry.n ?? entry.s
    if (file) return play(`/audio/${file}`)
  }

  // 2 — fetched from the API earlier this session
  const key = `${clean}|${voice ?? 'default'}|${wantSlow ? 's' : 'n'}`
  if (cache.has(key)) return play(cache.get(key)!)

  // 3 — generate now
  if (await probe()) {
    try {
      const r = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: clean, speed: wantSlow ? 0.75 : 1, voice }),
      })
      if (r.ok) {
        const url = URL.createObjectURL(await r.blob())
        cache.set(key, url)
        return play(url)
      }
      minimaxOk = false
    } catch {
      minimaxOk = false
    }
  }

  // 4 — a real German browser voice, or stay silent
  return browserSpeak(clean) ? 'browser' : 'none'
}

/**
 * Ask the server to render a whole lesson up front, so the first click on a
 * word is instant instead of a two-second wait.
 */
export async function prewarm(texts: string[]) {
  if (!(await probe())) return
  const { speed, voice } = useStore.getState().settings
  try {
    await fetch('/api/prewarm', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        texts: [...new Set(texts.filter(Boolean))].slice(0, 120),
        speed: speed < 0.95 ? 0.75 : 1,
        voice,
      }),
    })
  } catch {
    /* warming is best-effort */
  }
}

/** Component-friendly wrapper that tracks which clip is playing. */
export function useSpeak() {
  const speed = useStore((s) => s.settings.speed)
  const voice = useStore((s) => s.settings.voice)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => () => stopAudio(), [])

  const say = useCallback(
    async (text: string) => {
      setBusy(text)
      try {
        await speak(text, speed, voice)
      } finally {
        setBusy(null)
      }
    },
    [speed, voice],
  )

  return { say, busy, speaking: (t: string) => busy === t }
}
