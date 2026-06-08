'use client'
// Variante 3 — "Light" : éditorial clair premium, navy + or, serif Playfair.
import DashStructure, { BASE_CSS } from '../../../components/dashpreview/DashStructure'

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`
const VARS = `
.dp-light{
  --bg:#f5f3ec; --side-bg:rgba(255,255,255,0.72); --banner-bg:rgba(30,58,138,0.06);
  --card:#ffffff; --card-border:1px solid rgba(15,23,42,0.08);
  --card-shadow:0 1px 2px rgba(15,23,42,0.04),0 8px 18px -12px rgba(15,23,42,0.18);
  --card-hover:0 20px 44px -18px rgba(15,23,42,0.28); --inset:#f4f1e9;
  --line:rgba(15,23,42,0.08); --line2:rgba(15,23,42,0.14); --hover:rgba(15,23,42,0.04); --ghost-bg:#ffffff;
  --text:#141b2e; --text2:#586079; --text3:#8b93a5;
  --accent:linear-gradient(135deg,#13245c,#1e3a8a); --accent-solid:#1e3a8a; --on-accent:#ffffff;
  --accent-soft:rgba(30,58,138,0.08); --accent-border:rgba(30,58,138,0.25); --accent-shadow:0 8px 20px rgba(30,58,138,0.22);
  --pos:#0a8f4f; --neg:#c0392b; --warn:#ca8a04;
  --radius:14px; --radius-sm:10px;
  --font:'Inter',system-ui,sans-serif; --mono:'IBM Plex Mono',monospace; --num:'IBM Plex Mono',monospace; --disp:'Playfair Display',Georgia,serif;
  --h1:32px; --stat-lg:26px; --stat-sm:17px; --blur:blur(14px);
  background:
    radial-gradient(820px 480px at 85% -8%, rgba(202,138,4,0.08), transparent 60%),
    radial-gradient(700px 520px at -5% 22%, rgba(30,58,138,0.06), transparent 60%),
    var(--bg);
}
.dp-light .dp-title{font-weight:700;letter-spacing:-.01em}
.dp-light .dp-section-title,.dp-light .dp-firm-name{font-weight:600}
.dp-light .dp-eyebrow{color:#ca8a04}
.dp-light .dp-stat-val{font-weight:700}
`

export default function LightDash() {
  return <DashStructure rootClass="dp-light" css={FONT + BASE_CSS + VARS} label="Variante 3 · Light" />
}
