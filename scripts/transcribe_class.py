"""
Transcribe a Zoom class recording with MiniMax ASR (asr-1.0).

    python scripts/transcribe_class.py "classes/2026-09-08 German Haus A1"

Audio is decoded with PyAV (no system ffmpeg needed), downmixed to 16 kHz mono
and cut into chunks, because the ASR endpoint takes a single uploaded file and
a 2h20m class is far too big for one request.

MiniMax asr-1.0 returns plain text only -- no speaker labels and no word
timestamps -- so each chunk is written with its own [mm:ss] marker. That gives
enough position information to line the transcript up against the slides.

Resumable: chunks already transcribed are skipped, so it is safe to re-run.
"""
import io
import os
import re
import sys
import glob
import json
import time
import wave
import urllib.request

import av

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHUNK_SECONDS = 240          # 4 min -> ~7.7 MB of 16 kHz mono PCM
RATE = 16000

for name in ('.env', '.env.local'):
    p = os.path.join(ROOT, name)
    if not os.path.exists(p):
        continue
    for line in io.open(p, encoding='utf-8'):
        m = re.match(r'\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$', line)
        if m:
            os.environ[m.group(1)] = m.group(2).strip().strip('"\'')

KEY = os.environ.get('MINIMAX_API_KEY')
if not KEY:
    sys.exit('MINIMAX_API_KEY missing from .env.local')


def decode_chunks(path):
    """Yield (index, start_seconds, wav_bytes) of mono 16 kHz audio."""
    container = av.open(path)
    stream = next(s for s in container.streams if s.type == 'audio')
    resampler = av.AudioResampler(format='s16', layout='mono', rate=RATE)

    buf = bytearray()
    index = 0
    bytes_per_chunk = RATE * 2 * CHUNK_SECONDS

    def wrap(pcm):
        out = io.BytesIO()
        with wave.open(out, 'wb') as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(pcm)
        return out.getvalue()

    for frame in container.decode(stream):
        for res in resampler.resample(frame):
            buf.extend(bytes(res.planes[0])[: res.samples * 2])
        while len(buf) >= bytes_per_chunk:
            yield index, index * CHUNK_SECONDS, wrap(bytes(buf[:bytes_per_chunk]))
            del buf[:bytes_per_chunk]
            index += 1
    if len(buf) > RATE * 2:                      # keep a final chunk over 1 s
        yield index, index * CHUNK_SECONDS, wrap(bytes(buf))
    container.close()


def transcribe(wav_bytes, filename):
    """POST one chunk as multipart/form-data and return the text."""
    boundary = '----minimax' + str(int(time.time() * 1000))
    parts = []

    def field(name, value):
        parts.append(
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
        )

    field('model', 'asr-1.0')
    parts.append(
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f'Content-Type: audio/wav\r\n\r\n'.encode()
    )
    parts.append(wav_bytes)
    parts.append(f'\r\n--{boundary}--\r\n'.encode())
    body = b''.join(parts)

    req = urllib.request.Request(
        'https://api.minimax.io/v1/speech_to_text',
        data=body,
        headers={
            'Authorization': f'Bearer {KEY}',
            'Content-Type': f'multipart/form-data; boundary={boundary}',
        },
    )
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.loads(r.read().decode())
    if 'text' not in data:
        raise RuntimeError(data.get('base_resp', {}).get('status_msg', str(data)[:200]))
    return data['text'].strip()


def main(folder):
    videos = sorted(glob.glob(os.path.join(folder, '*.mp4')))
    if not videos:
        sys.exit(f'no mp4 in {folder}')
    # the screenshare file is smaller and carries the same audio track
    src = next((v for v in videos if 'screenshare' in v.lower()), videos[0])

    out_path = os.path.join(folder, 'transcript.json')
    done = json.load(io.open(out_path, encoding='utf-8')) if os.path.exists(out_path) else {}

    print(f'  source : {os.path.basename(src)}')
    print(f'  chunks : {CHUNK_SECONDS}s each, resuming from {len(done)} done\n')

    for index, start, wav in decode_chunks(src):
        key = str(index)
        if key in done:
            continue
        mins, secs = divmod(start, 60)
        for attempt in range(4):
            try:
                text = transcribe(wav, f'chunk{index:03d}.wav')
                done[key] = {'at': f'{mins:02d}:{secs:02d}', 'text': text}
                print(f'  [{mins:02d}:{secs:02d}] {text[:90]}')
                break
            except Exception as e:
                if attempt == 3:
                    print(f'  [{mins:02d}:{secs:02d}] FAILED {e}')
                    done[key] = {'at': f'{mins:02d}:{secs:02d}', 'text': '', 'error': str(e)}
                else:
                    time.sleep(3 * (attempt + 1))
        io.open(out_path, 'w', encoding='utf-8').write(json.dumps(done, ensure_ascii=False, indent=1))

    # a flat, readable transcript next to the json
    txt = os.path.join(folder, 'transcript.txt')
    with io.open(txt, 'w', encoding='utf-8') as f:
        for k in sorted(done, key=int):
            f.write(f"[{done[k]['at']}] {done[k]['text']}\n")
    print(f'\n  wrote {txt}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else sys.exit('usage: transcribe_class.py <folder>'))
