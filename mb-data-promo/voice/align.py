"""align.py — horodate chaque mot de la voix off (faster-whisper), puis rattache
les temps aux mots du SOUS-TITRE (le texte voulu, pas la transcription). Les deux
listes n'ont pas toujours le même nombre de mots (« 550 » contre « cinq cent
cinquante ») : le rattachement se fait à proportion de la position dans la phrase.
Écrit src/vo-words.json : { id: [[mot, début_f, fin_f], …] } à 30 i/s.
  python3 -m pip install faster-whisper ; python3 voice/align.py
"""
import json, os
from faster_whisper import WhisperModel
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
meta = json.load(open(os.path.join(ROOT, "src", "vo-meta.json")))
m = WhisperModel("small", device="cpu", compute_type="int8")
out = {}
for k, v in meta.items():
    segs, _ = m.transcribe(os.path.join(ROOT, "public", "vo", f"{k}.wav"), language="fr", word_timestamps=True, beam_size=5)
    ww = [w for s in segs for w in s.words]
    sub = v["sub"].split()
    n, nw = len(sub), len(ww)
    res = []
    for i, word in enumerate(sub):
        a = ww[min(nw - 1, int(i * nw / n))]
        b = ww[min(nw - 1, max(int((i + 1) * nw / n) - 1, int(i * nw / n)))]
        res.append([word, round(a.start * 30), round(b.end * 30)])
    out[k] = res
    print(k, " ".join(f"{w}@{s}" for w, s, _ in res))
json.dump(out, open(os.path.join(ROOT, "src", "vo-words.json"), "w"), ensure_ascii=False)
