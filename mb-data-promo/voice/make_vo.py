"""make_vo.py — génère la voix off de la pub (Piper, voix française locale).

  python3 -m pip install piper-tts
  # modèle (63 Mo, non versionné) dans voice/models/ :
  #   https://huggingface.co/rhasspy/piper-voices/tree/main/fr/fr_FR/siwis/medium
  python3 voice/make_vo.py

Sorties : public/vo/<id>.wav (48 kHz mono) et src/vo-meta.json (durée de chaque
réplique en images à 30 i/s). La timeline de la pub (src/ad/timeline.ts) se cale
sur ces durées : changer le texte décale tout le montage automatiquement.
"""
import json, os, subprocess, wave, sys
from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open(os.path.join(ROOT, "voice", "script.json")))
model = os.path.join(ROOT, "voice", "models", S["voice"] + ".onnx")
if not os.path.exists(model):
    sys.exit(f"Modèle absent : {model} (voir l'en-tête de ce fichier)")
voice = PiperVoice.load(model)
cfg = SynthesisConfig(length_scale=S["length_scale"], noise_scale=0.6, noise_w_scale=0.75)
FF = os.environ.get("FFMPEG", "ffmpeg")
meta = {}
for ln in S["lines"]:
    raw = os.path.join(ROOT, "voice", f".{ln['id']}-raw.wav")
    with wave.open(raw, "wb") as w:
        voice.synthesize_wav(ln["tts"], w, syn_config=cfg)
    out = os.path.join(ROOT, "public", "vo", f"{ln['id']}.wav")
    # coupe les silences de bord, légère compression + égalisation « radio »,
    # normalisation à -16 LUFS, 48 kHz
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:detection=peak,areverse,"
          "silenceremove=start_periods=1:start_threshold=-45dB:detection=peak,areverse,"
          "highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,"
          "loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000")
    subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", "-i", raw, "-af", af, "-ac", "1", out], check=True)
    os.remove(raw)
    with wave.open(out) as w:
        sec = w.getnframes() / w.getframerate()
    meta[ln["id"]] = {"sub": ln["sub"], "frames": round(sec * 30), "sec": round(sec, 3)}
    print(f"{ln['id']:10s} {sec:5.2f} s  {ln['sub']}")
json.dump(meta, open(os.path.join(ROOT, "src", "vo-meta.json"), "w"), ensure_ascii=False, indent=2)
print("total parole", round(sum(m["sec"] for m in meta.values()), 2), "s")
