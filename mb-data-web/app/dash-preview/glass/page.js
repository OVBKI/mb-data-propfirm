'use client'
// Variante 1 — "Glass" : glassmorphism premium dark, bleu Quantara + teal.
import DashStructure, { BASE_CSS } from '../../../components/dashpreview/DashStructure'

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`
const VARS = `
.dp-glass{
  --bg:#080a0f; --side-bg:rgba(8,10,15,0.6); --banner-bg:rgba(45,111,255,0.08);
  --card:linear-gradient(165deg,rgba(30,35,50,0.6),rgba(22,26,37,0.55));
  --card-border:1px solid rgba(255,255,255,0.07); --card-shadow:0 1px 0 rgba(255,255,255,0.03) inset;
  --card-hover:0 18px 44px -18px rgba(0,0,0,0.6),0 0 0 1px rgba(45,111,255,0.12); --inset:rgba(255,255,255,0.03);
  --line:rgba(255,255,255,0.07); --line2:rgba(255,255,255,0.12); --hover:rgba(255,255,255,0.05); --ghost-bg:rgba(255,255,255,0.03);
  --text:#f0ede8; --text2:#9aa3bd; --text3:#646e87;
  --accent:linear-gradient(135deg,#2d6fff,#4d8fff); --accent-solid:#4d8fff; --on-accent:#ffffff;
  --accent-soft:rgba(45,111,255,0.12); --accent-border:rgba(45,111,255,0.3); --accent-shadow:0 6px 18px rgba(45,111,255,0.35);
  --pos:#19c37d; --neg:#e8504a; --warn:#f5b651;
  --radius:16px; --radius-sm:10px;
  --font:'Plus Jakarta Sans',system-ui,sans-serif; --mono:'IBM Plex Mono',monospace; --num:'IBM Plex Mono',monospace; --disp:'Plus Jakarta Sans',sans-serif;
  --h1:28px; --stat-lg:24px; --stat-sm:16px; --blur:blur(18px);
  background:
    radial-gradient(900px 500px at 82% -5%, rgba(45,111,255,0.10), transparent 60%),
    radial-gradient(700px 520px at 0% 28%, rgba(25,195,125,0.06), transparent 60%),
    var(--bg);
}
.dp-glass .dp-card{backdrop-filter:blur(18px)}
.dp-glass .dp-stat-val,.dp-glass .dp-firm-net>div:first-child{text-shadow:0 0 24px color-mix(in srgb,currentColor 25%,transparent)}
`

export default function GlassDash() {
  return <DashStructure rootClass="dp-glass" css={FONT + BASE_CSS + VARS} label="Variante 1 · Glass" />
}
