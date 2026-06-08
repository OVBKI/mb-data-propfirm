'use client'
// Variante 2 — "Terminal" : OLED dark dense "quant", monospace, vert/ambre, hairlines.
import DashStructure, { BASE_CSS } from '../../../components/dashpreview/DashStructure'

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Fira+Sans:wght@400;500;600;700&display=swap');`
const VARS = `
.dp-terminal{
  --bg:#04060a; --side-bg:rgba(4,6,10,0.72); --banner-bg:rgba(37,244,157,0.06);
  --card:#0a0e15; --card-border:1px solid rgba(120,255,200,0.10); --card-shadow:none;
  --card-hover:0 0 0 1px rgba(37,244,157,0.28),0 18px 40px -22px #000; --inset:rgba(255,255,255,0.02);
  --line:rgba(140,170,160,0.13); --line2:rgba(140,170,160,0.22); --hover:rgba(37,244,157,0.06); --ghost-bg:rgba(255,255,255,0.02);
  --text:#d6e2dc; --text2:#8fa39b; --text3:#5f706a;
  --accent:#22f49d; --accent-solid:#22f49d; --on-accent:#04130c;
  --accent-soft:rgba(37,244,157,0.10); --accent-border:rgba(37,244,157,0.3); --accent-shadow:0 0 16px rgba(37,244,157,0.3);
  --pos:#22f49d; --neg:#ff6b6b; --warn:#ffb547;
  --radius:6px; --radius-sm:5px;
  --font:'Fira Sans',system-ui,sans-serif; --mono:'Fira Code',monospace; --num:'Fira Code',monospace; --disp:'Fira Code',monospace;
  --h1:24px; --stat-lg:23px; --stat-sm:15px; --blur:blur(8px);
}
.dp-terminal .dp-title,.dp-terminal .dp-section-title{text-transform:uppercase;letter-spacing:.03em;font-weight:600}
.dp-terminal .dp-eyebrow{text-shadow:0 0 10px rgba(37,244,157,0.3)}
.dp-terminal .dp-stat-val,.dp-terminal .dp-firm-net>div:first-child,.dp-terminal .dp-cal-stat-v{text-shadow:0 0 10px color-mix(in srgb,currentColor 35%,transparent)}
.dp-terminal .dp-firm-name{letter-spacing:.01em}
/* subtle technical grid behind the page */
.dp-terminal .dp-main{background-image:linear-gradient(rgba(140,170,160,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(140,170,160,0.035) 1px,transparent 1px);background-size:46px 46px}
`

export default function TerminalDash() {
  return <DashStructure rootClass="dp-terminal" css={FONT + BASE_CSS + VARS} label="Variante 2 · Terminal" />
}
