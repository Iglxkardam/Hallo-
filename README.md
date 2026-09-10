# Deutsch Quest — German A1 in 30 days

A gamified, notebook-styled trainer for German A1, built around the **Netzwerk neu A1**
course book and the **Goethe-Zertifikat A1 (Start Deutsch 1)** exam.

Days 1–7 are written in full. Days 8–30 are planned and visible in the app as a
locked roadmap.

## Running it

```bash
npm install
npm run dev          # API proxy on :8787 + app on :5173
```

Open http://localhost:5173

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the MiniMax proxy and the web app together |
| `npm run audio` | Pre-renders every German phrase to `public/audio` (one-time, resumable) |
| `npm run audio -- --force` | Regenerates all clips, e.g. after changing the voice |
| `npm run build` | Typechecks and builds to `dist/` |

## Audio

Every German phrase in the course is pre-rendered by `npm run audio` into
`public/audio/*.mp3` plus a `manifest.json`. The app looks in the manifest first,
so tapping a word plays a **local file instantly** — no network round-trip, and it
works with the API server switched off. Anything not in the manifest falls back to
the live API, and then to the browser's built-in German voice.

Clips are always rendered at speed 1.0; the speed slider in Settings uses the audio
element's `playbackRate`, so a single file serves every speed.

Model and voice live in `.env.local`:

```
MINIMAX_TTS_MODEL=speech-2.6-hd     # newest, highest quality
MINIMAX_TTS_VOICE=German_SweetLady  # also: German_FriendlyMan, German_PlayfulMan
```

> **Rotate your API key.** The key currently in `.env.local` was shared in a chat, so
> treat it as compromised — generate a fresh one at platform.minimax.io and replace it.
> `.env.local` is gitignored, and the key is never exposed to the browser.

## Hover translation

Hovering any German word shows its English meaning and a grammar note
(`der · pl. die Tische`). Clicking it plays the pronunciation.

The dictionary in `src/lib/glossary.ts` is built from the course vocabulary plus a
hand-checked list of function words and verb forms. **Words we cannot translate with
confidence get no tooltip at all** — a missing tooltip is always better than a wrong
one. Inside mixed English/German text, words that are also ordinary English words
(`in`, `man`, `also`, `hat`) are deliberately skipped.

## Adding a day

1. Create `src/data/days/d08.ts` following the shape of `d07.ts`.
2. Add it to the `DAYS` array in `src/data/curriculum.ts`.
3. Run `npm run audio` to render the new phrases.

Weeks, vocabulary lists, games, stats and routing all derive from `DAYS`, so nothing
else needs touching.

## Layout

```
scripts/build-audio.mjs   one-time offline TTS renderer
server/index.mjs          zero-dependency MiniMax proxy (key stays server-side)
src/
  data/curriculum.ts      the 30-day plan; days/d01..d07 hold the content
  lib/                    store (XP, streak, SRS), audio, glossary, gamification
  components/             notes renderer, vocabulary cards, games, UI primitives
  routes/                 Today · Course · Day · Words · Games · Exam · Settings
  styles/                 tokens, notebook, sketch surface, shell
```

## Notes on scope

- The book PDFs are image scans with no text layer. They were read by rendering pages
  with PyMuPDF and reading the images: the Kursbuch contents (pp. 4–7) and the
  **alphabetische Wortliste** (pp. 162–174), where every entry carries its chapter
  reference, e.g. `Buch, das, "er  2/3a` = Kapitel 2.
- The 30-day plan therefore follows the Kursbuch chapter order exactly, and the
  vocabulary for days 1–7 is taken from the words the list tags `1/…` and `2/…`.
- The word list marks entries in **bold** as required for the Start Deutsch 1 exam;
  those were prioritised.

To re-read a page of the book yourself:

```bash
python -c "import pymupdf; pymupdf.open('<pdf>')[163].get_pixmap(dpi=140).save('p.png')"
```
