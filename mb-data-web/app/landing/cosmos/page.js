'use client'
// Landing concept #7 — "Cosmos" — scroll-driven 3D space journey.
// Adapted to Next.js + Quantara from a standalone Three.js page the user shared.
// All TradeSignal branding/content replaced by Quantara (PropFirm trading
// journal: multi-firm dashboard, journal, analytics, payouts & expenses,
// drawdown guardian). Rendered as real JSX (no HTML injection); the Three.js
// space scene + scroll choreography run imperatively in a useEffect using the
// project's installed `three`.

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import QLogoIcon from '../../../components/QLogoIcon'

const BLUE = '#3b82f6'

const RED = { background: '#ef4444' }
const AMB = { background: '#f59e0b' }
const GRN = { background: '#22c55e' }

function Titlebar({ title }) {
  return (
    <div className="mock-titlebar">
      <div className="mock-dot" style={RED} /><div className="mock-dot" style={AMB} /><div className="mock-dot" style={GRN} />
      <span className="mock-title">{title}</span>
    </div>
  )
}

export default function CosmosLanding() {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const $ = (sel) => root.querySelector(sel)
    const canvas = $('#space-canvas')
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x020817)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 2000)
    camera.position.set(0, 0, 0)
    camera.rotation.order = 'YXZ'

    // REAL SKY — ESO Milky Way 360° panorama (public domain, ESO/S. Brunier)
    // as a camera-locked skybox sphere, so we travel through an actual photo of
    // the night sky instead of procedural dots.
    const texLoader = new THREE.TextureLoader()
    const skyTex = texLoader.load('/space/milkyway.webp')
    skyTex.colorSpace = THREE.SRGBColorSpace
    const skybox = new THREE.Mesh(
      new THREE.SphereGeometry(600, 64, 40),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false })
    )
    scene.add(skybox)

    // Soft round star sprite (no ugly square points)
    const starSprite = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64
      const g = cv.getContext('2d')
      const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      grd.addColorStop(0, 'rgba(255,255,255,1)')
      grd.addColorStop(0.25, 'rgba(255,255,255,0.85)')
      grd.addColorStop(0.5, 'rgba(255,255,255,0.22)')
      grd.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64)
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace
      return tex
    })()

    // FOREGROUND PARALLAX STARS — give depth + motion as the camera travels
    const starCount = 1400
    const starGeo = new THREE.BufferGeometry()
    const starPos = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 60 + Math.random() * 700
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      starPos[i * 3 + 2] = r * Math.cos(phi)
      const t = Math.random()
      const col = new THREE.Color()
      if (t < 0.72) col.setHSL(0.6, 0.18, 0.96)      // white
      else if (t < 0.9) col.setHSL(0.09, 0.55, 0.82) // warm
      else col.setHSL(0.58, 0.7, 0.82)               // blue
      starColors[i * 3] = col.r; starColors[i * 3 + 1] = col.g; starColors[i * 3 + 2] = col.b
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starMat = new THREE.PointsMaterial({ map: starSprite, size: 3.0, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, alphaTest: 0.01 })
    const stars = new THREE.Points(starGeo, starMat)
    scene.add(stars)

    // FLOATING DATA PLANES (Quantara metrics)
    const dataPlanes = []
    const planeTextures = []
    const planeData = [
      { x: -80, y: 20, z: -120, label: 'NET +48 320€', color: 0x22c55e },
      { x: 90, y: -15, z: -200, label: 'FUNDED 3', color: 0x3b82f6 },
      { x: -60, y: -30, z: -310, label: 'DD 82%', color: 0xf59e0b },
      { x: 100, y: 25, z: -420, label: 'R/R 1.84', color: 0x60a5fa },
      { x: -90, y: 10, z: -550, label: 'PAYOUT 3 200€', color: 0x22c55e },
    ]
    planeData.forEach((d) => {
      const c2 = document.createElement('canvas')
      c2.width = 256; c2.height = 80
      const cx = c2.getContext('2d')
      cx.fillStyle = 'rgba(10,22,40,0.85)'
      cx.fillRect(0, 0, 256, 80)
      cx.strokeStyle = `rgba(${(d.color >> 16) & 255},${(d.color >> 8) & 255},${d.color & 255},0.6)`
      cx.lineWidth = 1.5
      cx.strokeRect(1, 1, 254, 78)
      cx.fillStyle = `rgb(${(d.color >> 16) & 255},${(d.color >> 8) & 255},${d.color & 255})`
      cx.font = '700 26px IBM Plex Mono,monospace'
      cx.fillText(d.label, 14, 50)
      const tex = new THREE.CanvasTexture(c2)
      planeTextures.push(tex)
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(18, 5.6),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      )
      mesh.position.set(d.x, d.y, d.z)
      mesh.rotation.y = (Math.random() - 0.5) * 0.3
      scene.add(mesh)
      dataPlanes.push(mesh)
    })

    // BLACK HOLE
    const bhGroup = new THREE.Group()
    bhGroup.position.set(0, 0, -900)
    scene.add(bhGroup)
    const disk = new THREE.Mesh(
      new THREE.TorusGeometry(28, 8, 2, 128),
      new THREE.MeshBasicMaterial({ color: 0x1a3a6b, side: THREE.DoubleSide, transparent: true, opacity: 0.0 })
    )
    disk.rotation.x = Math.PI * 0.35
    bhGroup.add(disk)
    const glowRing = new THREE.Mesh(
      new THREE.TorusGeometry(32, 2, 2, 128),
      new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.0 })
    )
    glowRing.rotation.x = Math.PI * 0.35
    bhGroup.add(glowRing)
    const core = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }))
    bhGroup.add(core)
    const ringParticleCount = 1200
    const ringGeo = new THREE.BufferGeometry()
    const ringPos = new Float32Array(ringParticleCount * 3)
    const ringCol = new Float32Array(ringParticleCount * 3)
    for (let i = 0; i < ringParticleCount; i++) {
      const angle = (i / ringParticleCount) * Math.PI * 2
      const r = 28 + (Math.random() - 0.5) * 16
      const spread = (Math.random() - 0.5) * 6
      ringPos[i * 3] = Math.cos(angle) * r
      ringPos[i * 3 + 1] = spread * 0.4
      ringPos[i * 3 + 2] = Math.sin(angle) * r * 0.4
      const t = Math.random()
      ringCol[i * 3] = 0.1 + t * 0.3
      ringCol[i * 3 + 1] = 0.3 + t * 0.4
      ringCol[i * 3 + 2] = 0.8 + t * 0.2
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))
    ringGeo.setAttribute('color', new THREE.BufferAttribute(ringCol, 3))
    const ringPartMat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.0 })
    const ringPart = new THREE.Points(ringGeo, ringPartMat)
    bhGroup.add(ringPart)

    // SECTION MANAGEMENT
    const panels = {
      dashboard: $('#panel-dashboard'),
      journal: $('#panel-journal'),
      analytics: $('#panel-analytics'),
      signals: $('#panel-signals'),
      risk: $('#panel-risk'),
    }
    const heroText = $('#hero-text')
    const scrollHint = $('#scroll-hint')
    const logoReveal = $('#logo-reveal')
    const navbar = $('#navbar')
    const scrollDriver = $('#scroll-driver')

    let animTime = 0
    const clamp01 = (v) => Math.max(0, Math.min(1, v))
    const lerp = (a, b, t) => a + (b - a) * t

    let targetCamZ = 0, currentCamZ = 0
    let targetCamY = 0, currentCamY = 0
    let targetCamX = 0, currentCamX = 0

    function updateFromScroll() {
      const scrollTop = scrollDriver.scrollTop
      const maxScroll = scrollDriver.scrollHeight - scrollDriver.clientHeight
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0
      targetCamZ = -progress * 900
      targetCamX = Math.sin(animTime * 0.3) * 2
      targetCamY = Math.sin(animTime * 0.2) * 1.5

      let sec = 0
      if (progress < 0.08) sec = 0
      else if (progress < 0.22) sec = 1
      else if (progress < 0.38) sec = 2
      else if (progress < 0.54) sec = 3
      else if (progress < 0.70) sec = 4
      else if (progress < 0.82) sec = 5
      else sec = 6

      for (let i = 0; i <= 5; i++) {
        const dot = $(`#dot-${i}`)
        if (dot) dot.classList.toggle('active', i === Math.min(sec, 5))
      }

      heroText.style.opacity = clamp01(1 - progress * 16)
      scrollHint.style.opacity = clamp01(1 - progress * 20)

      Object.keys(panels).forEach((key, idx) => {
        const panel = panels[key]
        if (!panel) return
        panel.classList.toggle('visible', sec === idx + 1)
      })

      const bhProgress = clamp01((progress - 0.78) / 0.15)
      disk.material.opacity = bhProgress * 0.6
      glowRing.material.opacity = bhProgress * 0.8
      ringPartMat.opacity = bhProgress * 0.9

      const logoProgress = clamp01((progress - 0.92) / 0.08)
      logoReveal.style.opacity = logoProgress
      logoReveal.style.pointerEvents = logoProgress > 0.5 ? 'all' : 'none'

      navbar.style.opacity = sec === 6 ? Math.max(0, 1 - (progress - 0.9) * 10) : 1
    }

    // MINI DASHBOARD CHART
    const chartCanvas = $('#dashChart')
    if (chartCanvas) {
      chartCanvas.width = chartCanvas.offsetWidth || 400
      chartCanvas.height = 80
      const c = chartCanvas.getContext('2d')
      const w = chartCanvas.width, h = chartCanvas.height
      const data = []
      let v = 50
      for (let i = 0; i < 60; i++) { v += (Math.random() - 0.45) * 4; data.push(Math.max(10, Math.min(90, v))) }
      const grad = c.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, 'rgba(59,130,246,0.3)')
      grad.addColorStop(1, 'rgba(59,130,246,0.0)')
      c.beginPath()
      data.forEach((d, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - (d / 100) * h
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y)
      })
      c.strokeStyle = '#3b82f6'; c.lineWidth = 1.5; c.stroke()
      c.lineTo(w, h); c.lineTo(0, h); c.closePath()
      c.fillStyle = grad; c.fill()
    }

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)
    scrollDriver.addEventListener('scroll', updateFromScroll, { passive: true })

    const dotHandlers = Array.from(root.querySelectorAll('.prog-dot')).map((dot) => {
      const handler = () => {
        const sec = parseInt(dot.dataset.section)
        const maxScroll = scrollDriver.scrollHeight - scrollDriver.clientHeight
        const targets = [0, 0.12, 0.28, 0.44, 0.60, 0.76]
        scrollDriver.scrollTo({ top: targets[sec] * maxScroll, behavior: 'smooth' })
      }
      dot.addEventListener('click', handler)
      return { dot, handler }
    })

    function animate() {
      animTime += 0.008
      currentCamZ = lerp(currentCamZ, targetCamZ, 0.06)
      currentCamX = lerp(currentCamX, targetCamX, 0.04)
      currentCamY = lerp(currentCamY, targetCamY, 0.04)
      camera.position.set(currentCamX, currentCamY, currentCamZ)
      camera.lookAt(currentCamX * 0.1, currentCamY * 0.1, currentCamZ - 10)
      if (skybox) { skybox.position.copy(camera.position); skybox.rotation.y = animTime * 0.004 }
      stars.rotation.y = animTime * 0.005
      stars.rotation.x = animTime * 0.002
      dataPlanes.forEach((p, i) => {
        p.position.y += Math.sin(animTime * 0.5 + i * 1.2) * 0.02
        p.rotation.y = Math.sin(animTime * 0.2 + i) * 0.08
      })
      disk.rotation.z = animTime * 0.25
      ringPart.rotation.y = animTime * 0.18
      glowRing.rotation.z = -animTime * 0.12
      const bhApproach = clamp01((-currentCamZ - 700) / 200)
      starMat.size = 3.0 + bhApproach * 7
      renderer.render(scene, camera)
    }
    renderer.setAnimationLoop(animate)
    updateFromScroll()

    return () => {
      renderer.setAnimationLoop(null)
      window.removeEventListener('resize', onResize)
      scrollDriver.removeEventListener('scroll', updateFromScroll)
      dotHandlers.forEach(({ dot, handler }) => dot.removeEventListener('click', handler))
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      planeTextures.forEach((t) => t.dispose())
      skyTex.dispose()
      starSprite.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div ref={rootRef} className="cosmos">
      <style>{CSS}</style>

      <header id="navbar">
        <div className="brand-wrap"><QLogoIcon size={24} color={BLUE} /><div className="brand">QUAN<span>TARA</span></div></div>
        <nav>
          <a href="#">Produit</a>
          <a href="#">Fonctionnalités</a>
          <a href="/pricing">Tarifs</a>
          <a href="/compare">Comparateur</a>
          <a href="/docs">Docs</a>
        </nav>
        <div className="nav-actions">
          <a className="btn-nav-ghost" href="/app">Se connecter</a>
          <a className="btn-nav-primary" href="/auth?mode=signup">Essai gratuit →</a>
        </div>
      </header>

      <canvas id="space-canvas" />

      <div id="scroll-driver"><div id="scroll-spacer" /></div>

      <div id="progress-bar">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div className={'prog-dot' + (i === 0 ? ' active' : '')} data-section={i} id={`dot-${i}`} />
            {i < 5 && <div className="prog-line" />}
          </div>
        ))}
      </div>

      <div id="hero-text">
        <div className="label">SaaS · Journal de Trading PropFirm</div>
        <h1>Ton trading prop<br /><em>parmi les étoiles</em></h1>
        <p className="sub">La plateforme tout-en-un pour suivre tous tes comptes PropFirm, journaliser tes trades et encaisser tes payouts. Pensée pour les traders exigeants.</p>
        <div className="actions">
          <a className="btn-primary-blue" href="/auth?mode=signup">Démarrer gratuitement →</a>
          <a className="btn-ghost-blue" href="/demo">Voir la démo</a>
        </div>
      </div>

      <div id="scroll-hint"><div className="scroll-arrow" />Scroller pour explorer</div>

      {/* 01 — DASHBOARD */}
      <div className="feature-panel" id="panel-dashboard">
        <div className="panel-inner">
          <div className="panel-text">
            <span className="tag">01 · Dashboard</span>
            <h2>Vue d&apos;ensemble<br /><strong>multi-PropFirms</strong></h2>
            <p>Tous tes comptes Topstep, Apex, Bulenox, MFFU… réunis. Net consolidé, drawdown, comptes funded et exposition centralisés dans un tableau de bord clair.</p>
            <ul className="feature-list">
              <li>Net consolidé live par firm et cumulé</li>
              <li>Statut Challenge / Funded / Live par compte</li>
              <li>Multi-firms et multi-comptes</li>
              <li>Export PDF/CSV des rapports</li>
            </ul>
          </div>
          <div className="panel-preview">
            <Titlebar title="Dashboard · Vue globale" />
            <div className="mock-body">
              <div className="dash-grid">
                <div className="dash-stat"><div className="ds-label">NET DU MOIS</div><div className="ds-val">+12 480 €</div><div className="ds-chg ds-up">▲ +3.2%</div></div>
                <div className="dash-stat"><div className="ds-label">WIN RATE</div><div className="ds-val">68.4%</div><div className="ds-chg ds-up">▲ vs 62% moy.</div></div>
                <div className="dash-stat"><div className="ds-label">DRAWDOWN</div><div className="ds-val">82%</div><div className="ds-chg ds-up">marge OK</div></div>
              </div>
              <div className="mock-chart"><canvas id="dashChart" /></div>
              <div className="row-2">
                <div className="dash-stat"><div className="ds-label">COMPTES FUNDED</div><div className="ds-val" style={{ fontSize: 14 }}>3</div></div>
                <div className="dash-stat"><div className="ds-label">PAYOUT EN COURS</div><div className="ds-val" style={{ fontSize: 14 }}>3 200 €</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 02 — JOURNAL */}
      <div className="feature-panel" id="panel-journal">
        <div className="panel-inner reverse">
          <div className="panel-text">
            <span className="tag">02 · Journal</span>
            <h2>Journalise chaque<br /><strong>trade avec précision</strong></h2>
            <p>Capture l&apos;intégralité de ton processus : setup, émotions, contexte de marché, captures d&apos;écran. Retrouve tes patterns gagnants et tes fuites.</p>
            <ul className="feature-list">
              <li>Import CSV firm-first (firme détectée auto)</li>
              <li>Tags et filtres avancés par setup</li>
              <li>Notes et screenshots intégrés</li>
              <li>Score de discipline &amp; consistance</li>
            </ul>
          </div>
          <div className="panel-preview">
            <Titlebar title="Journal · Historique des trades" />
            <div className="mock-body">
              <div className="jr-head"><span>24 trades · ce mois</span><span style={{ color: '#22c55e' }}>+8 432 € net</span></div>
              <div className="journal-row"><span className="jr-sym">ES</span><span className="jr-type jr-long">LONG</span><span className="jr-mid">5 280 → 5 312</span><span className="jr-pnl ds-up">+1 600 €</span></div>
              <div className="journal-row"><span className="jr-sym">NQ</span><span className="jr-type jr-short">SHORT</span><span className="jr-mid">18 740 → 18 690</span><span className="jr-pnl ds-up">+1 000 €</span></div>
              <div className="journal-row"><span className="jr-sym">GC</span><span className="jr-type jr-long">LONG</span><span className="jr-mid">2 318 → 2 311</span><span className="jr-pnl ds-dn">-700 €</span></div>
              <div className="journal-row"><span className="jr-sym">CL</span><span className="jr-type jr-long">LONG</span><span className="jr-mid">78.40 → 79.05</span><span className="jr-pnl ds-up">+650 €</span></div>
              <div className="journal-row"><span className="jr-sym">ES</span><span className="jr-type jr-short">SHORT</span><span className="jr-mid">5 332 → 5 320</span><span className="jr-pnl ds-up">+600 €</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 03 — ANALYTICS */}
      <div className="feature-panel" id="panel-analytics">
        <div className="panel-inner">
          <div className="panel-text">
            <span className="tag">03 · Analytics</span>
            <h2>Analyse tes<br /><strong>performances</strong></h2>
            <p>Des statistiques avancées pour comprendre précisément où tu gagnes et où tu perds. Identifie tes meilleures heures, marchés et setups.</p>
            <ul className="feature-list">
              <li>Ratio risque/récompense moyen</li>
              <li>Courbe d&apos;équité et périodes de drawdown</li>
              <li>Analyse par heure, jour et session</li>
              <li>Comparaison multi-périodes</li>
            </ul>
          </div>
          <div className="panel-preview">
            <Titlebar title="Analytics · Statistiques avancées" />
            <div className="mock-body">
              <div className="analytics-grid">
                <div className="an-card"><div className="an-label">WIN RATE</div><div className="an-val">68.4%</div><div className="an-bar-bg" style={{ marginTop: 8 }}><div className="an-bar" style={{ width: '68%' }} /></div></div>
                <div className="an-card"><div className="an-label">PROFIT FACTOR</div><div className="an-val">2.31</div><div className="an-bar-bg" style={{ marginTop: 8 }}><div className="an-bar" style={{ width: '77%' }} /></div></div>
                <div className="an-card"><div className="an-label">AVG R/R</div><div className="an-val">1.84</div><div className="an-bar-bg" style={{ marginTop: 8 }}><div className="an-bar" style={{ width: '61%' }} /></div></div>
                <div className="an-card"><div className="an-label">CONSISTANCE</div><div className="an-val">28%</div><div className="an-bar-bg" style={{ marginTop: 8 }}><div className="an-bar" style={{ width: '85%' }} /></div></div>
              </div>
              <div className="an-session">
                <div className="lbl">MEILLEURE SESSION</div>
                <div className="ses" style={{ color: '#22c55e' }}>RTH (US)  ████████░░  82%</div>
                <div className="ses" style={{ color: 'var(--blue-200)', marginTop: 4 }}>Globex  ██████░░░░  64%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 04 — PAYOUTS & DÉPENSES */}
      <div className="feature-panel" id="panel-signals">
        <div className="panel-inner reverse">
          <div className="panel-text">
            <span className="tag">04 · Payouts &amp; Dépenses</span>
            <h2>Suis tes<br /><strong>payouts &amp; dépenses</strong></h2>
            <p>Frais de challenge, resets et abonnements vs payouts encaissés. Quantara calcule ton vrai net, par firm, sans illusion.</p>
            <ul className="feature-list">
              <li>Pipeline Éligible → Demandé → Reçu</li>
              <li>Frais &amp; resets déduits automatiquement</li>
              <li>Net réel par firm et global</li>
              <li>Historique complet des paiements</li>
            </ul>
          </div>
          <div className="panel-preview">
            <Titlebar title="Payouts · Pipeline" />
            <div className="mock-body">
              <div className="sig-row"><div className="sig-icon bull">€</div><div className="sig-info"><div className="sig-name">Topstep · Payout</div><div className="sig-detail">Reçu le 03/06 · virement</div></div><div className="sig-conf high">+3 200 €</div></div>
              <div className="sig-row"><div className="sig-icon bull">€</div><div className="sig-info"><div className="sig-name">Apex · Payout</div><div className="sig-detail">Demandé · en traitement</div></div><div className="sig-conf med">1 800 €</div></div>
              <div className="sig-row"><div className="sig-icon bear">↺</div><div className="sig-info"><div className="sig-name">Bulenox · Reset</div><div className="sig-detail">Frais de reset compte 50K</div></div><div className="sig-conf" style={{ color: '#ef4444' }}>-150 €</div></div>
              <div className="sig-row"><div className="sig-icon bull">€</div><div className="sig-info"><div className="sig-name">MFFU · Éligible</div><div className="sig-detail">Seuil atteint · demande possible</div></div><div className="sig-conf med">2 400 €</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* 05 — DRAWDOWN GUARDIAN */}
      <div className="feature-panel" id="panel-risk">
        <div className="panel-inner">
          <div className="panel-text">
            <span className="tag">05 · Drawdown Guardian</span>
            <h2>Maîtrise ton<br /><strong>drawdown</strong></h2>
            <p>Un moteur de surveillance qui applique la règle exacte de chaque firm — trailing, EOD, intraday. Alerte avant que tu casses un compte.</p>
            <ul className="feature-list">
              <li>Calcul trailing / EOD / intraday par firm</li>
              <li>Règles Topstep, Apex, MFFU intégrées</li>
              <li>Alerte push avant dépassement</li>
              <li>Consistance &amp; seuil de payout</li>
            </ul>
          </div>
          <div className="panel-preview">
            <Titlebar title="Drawdown Guardian · Limites" />
            <div className="mock-body">
              <div className="rk-row"><div className="hd"><span style={{ color: 'var(--gray)' }}>PERTE JOURNALIÈRE</span><span style={{ color: '#f59e0b' }}>1 240 € / 2 000 €</span></div><div className="an-bar-bg"><div className="an-bar" style={{ width: '62%', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }} /></div></div>
              <div className="rk-row"><div className="hd"><span style={{ color: 'var(--gray)' }}>DRAWDOWN TRAILING</span><span style={{ color: '#22c55e' }}>4 100 € / 10 000 €</span></div><div className="an-bar-bg"><div className="an-bar" style={{ width: '41%', background: 'linear-gradient(90deg,#22c55e,#4ade80)' }} /></div></div>
              <div className="rk-row"><div className="hd"><span style={{ color: 'var(--gray)' }}>CONSISTANCE</span><span style={{ color: 'var(--blue-200)' }}>28% / 40% max</span></div><div className="an-bar-bg"><div className="an-bar" style={{ width: '70%' }} /></div></div>
              <div className="rk-tiles">
                <div className="rk-tile" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}><div className="t">GUARDIAN</div><div className="v" style={{ color: '#22c55e' }}>ACTIF</div></div>
                <div className="rk-tile" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}><div className="t">RÈGLE PROP</div><div className="v" style={{ color: 'var(--blue-200)' }}>TOPSTEP</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOGO REVEAL */}
      <div id="logo-reveal">
        <div className="logo-ring"><QLogoIcon size={58} color={BLUE} /></div>
        <h2>Bienvenue dans<br /><strong>Quantara</strong></h2>
        <p>Le journal de référence pour les prop traders et la gestion multi-firms.</p>
        <div className="reveal-cta">
          <a className="btn-primary-blue" href="/auth?mode=signup">Commencer maintenant →</a>
          <a className="btn-ghost-blue" href="/landing">Voir la galerie</a>
        </div>
      </div>
    </div>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
.cosmos *, .cosmos *::before, .cosmos *::after { box-sizing:border-box; margin:0; padding:0; }
.cosmos {
  --blue-900:#020817;--blue-400:#2563eb;--blue-300:#3b82f6;--blue-200:#60a5fa;--blue-100:#bfdbfe;
  --white:#f0f6ff;--gray:rgba(148,163,184,0.7);--mono:'IBM Plex Mono',monospace;--sans:'Inter',sans-serif;
  color:var(--white); font-family:var(--sans);
}
body { background:#020817; overflow:hidden; height:100vh; }
.cosmos a { text-decoration:none; color:inherit; }

#navbar { position:fixed; top:0; left:0; right:0; z-index:1000; display:flex; align-items:center; justify-content:space-between; padding:0 40px; height:56px; background:rgba(2,8,23,0.7); backdrop-filter:blur(12px); border-bottom:1px solid rgba(59,130,246,0.15); transition:opacity 0.4s; }
.brand-wrap { display:flex; align-items:center; gap:9px; }
#navbar .brand { font-family:var(--mono); font-size:15px; font-weight:500; letter-spacing:0.12em; color:var(--blue-200); }
#navbar .brand span { color:var(--blue-400); }
#navbar nav { display:flex; gap:28px; font-size:12.5px; color:var(--gray); }
#navbar nav a { transition:color .2s; }
#navbar nav a:hover { color:var(--blue-200); }
.nav-actions { display:flex; gap:10px; align-items:center; }
.btn-nav-ghost { font-family:var(--mono); font-size:11px; letter-spacing:.07em; padding:7px 16px; background:none; border:1px solid rgba(59,130,246,0.35); color:var(--blue-200); cursor:pointer; transition:all .2s; border-radius:4px; }
.btn-nav-ghost:hover { background:rgba(59,130,246,0.1); border-color:var(--blue-300); }
.btn-nav-primary { font-family:var(--mono); font-size:11px; letter-spacing:.07em; padding:7px 18px; background:var(--blue-400); border:none; color:#fff; cursor:pointer; transition:background .2s; border-radius:4px; }
.btn-nav-primary:hover { background:var(--blue-300); }

#space-canvas { position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:0; }
#scroll-driver { position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:1; overflow-y:scroll; scroll-behavior:auto; }
#scroll-spacer { height:700vh; }

#hero-text { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; z-index:20; pointer-events:none; transition:opacity 0.3s; }
#hero-text .label { font-family:var(--mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--blue-300); margin-bottom:18px; opacity:0.8; }
#hero-text h1 { font-size:clamp(36px,5vw,68px); font-weight:300; line-height:1.1; letter-spacing:-0.02em; color:#fff; }
#hero-text h1 em { font-style:normal; background:linear-gradient(135deg,var(--blue-300),var(--blue-200)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
#hero-text .sub { margin-top:20px; font-size:15px; color:rgba(148,163,184,0.8); max-width:480px; margin-left:auto; margin-right:auto; line-height:1.7; }
#hero-text .actions { margin-top:32px; display:flex; gap:12px; justify-content:center; pointer-events:all; }
.btn-primary-blue { font-family:var(--mono); font-size:12px; letter-spacing:.08em; padding:12px 28px; background:var(--blue-400); color:#fff; border:none; cursor:pointer; border-radius:6px; transition:all .2s; display:inline-block; }
.btn-primary-blue:hover { background:var(--blue-300); transform:translateY(-1px); }
.btn-ghost-blue { font-family:var(--mono); font-size:12px; letter-spacing:.08em; padding:12px 28px; background:none; color:var(--blue-200); border:1px solid rgba(59,130,246,0.4); cursor:pointer; border-radius:6px; transition:all .2s; display:inline-block; }
.btn-ghost-blue:hover { background:rgba(59,130,246,0.1); border-color:var(--blue-300); }

#scroll-hint { position:fixed; bottom:32px; left:50%; transform:translateX(-50%); z-index:20; display:flex; flex-direction:column; align-items:center; gap:8px; font-family:var(--mono); font-size:10px; letter-spacing:.15em; color:rgba(148,163,184,0.5); text-transform:uppercase; pointer-events:none; transition:opacity 0.5s; }
.scroll-arrow { width:20px; height:20px; border-right:1.5px solid rgba(59,130,246,0.5); border-bottom:1.5px solid rgba(59,130,246,0.5); transform:rotate(45deg); animation:arrow-bounce 1.8s ease-in-out infinite; }
@keyframes arrow-bounce { 0%,100%{transform:rotate(45deg) translateY(0);opacity:.5;} 50%{transform:rotate(45deg) translateY(5px);opacity:1;} }

.feature-panel { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:20; width:min(1100px,92vw); opacity:0; pointer-events:none; transition:opacity 0.5s; }
.feature-panel.visible { opacity:1; pointer-events:all; }
.panel-inner { display:grid; grid-template-columns:1fr 1.1fr; gap:48px; align-items:center; }
.panel-inner.reverse { grid-template-columns:1.1fr 1fr; }
.panel-inner.reverse .panel-preview { order:-1; }
.panel-text .tag { font-family:var(--mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--blue-300); margin-bottom:14px; display:block; }
.panel-text h2 { font-size:clamp(24px,3vw,38px); font-weight:300; line-height:1.2; letter-spacing:-.02em; color:#fff; margin-bottom:16px; }
.panel-text h2 strong { font-weight:600; color:var(--blue-200); }
.panel-text p { font-size:14px; color:var(--gray); line-height:1.75; margin-bottom:24px; }
.feature-list { list-style:none; display:flex; flex-direction:column; gap:10px; }
.feature-list li { font-size:13px; color:rgba(148,163,184,0.9); display:flex; align-items:center; gap:10px; }
.feature-list li::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--blue-400); flex-shrink:0; }

.panel-preview { background:rgba(10,22,40,0.85); border:1px solid rgba(59,130,246,0.2); border-radius:12px; overflow:hidden; box-shadow:0 0 60px rgba(37,99,235,0.15),0 0 120px rgba(37,99,235,0.05); }
.mock-titlebar { display:flex; align-items:center; gap:6px; padding:10px 14px; background:rgba(2,8,23,0.8); border-bottom:1px solid rgba(59,130,246,0.12); }
.mock-dot { width:8px; height:8px; border-radius:50%; }
.mock-title { font-family:var(--mono); font-size:10px; color:rgba(148,163,184,0.5); margin-left:6px; }
.mock-body { padding:16px; }
.dash-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
.dash-stat { background:rgba(37,99,235,0.08); border:1px solid rgba(59,130,246,0.15); border-radius:6px; padding:10px 12px; }
.dash-stat .ds-label { font-size:9px; font-family:var(--mono); color:var(--gray); margin-bottom:4px; letter-spacing:.08em; }
.dash-stat .ds-val { font-size:18px; font-family:var(--mono); font-weight:600; color:var(--blue-200); }
.dash-stat .ds-chg { font-size:9px; font-family:var(--mono); margin-top:2px; }
.ds-up { color:#22c55e; } .ds-dn { color:#ef4444; }
.row-2 { margin-top:10px; display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.mock-chart { height:80px; position:relative; overflow:hidden; }
.mock-chart canvas { width:100% !important; height:80px !important; }
.jr-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; font-family:var(--mono); font-size:10px; color:var(--gray); }
.journal-row { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:6px; margin-bottom:5px; background:rgba(37,99,235,0.05); border:1px solid rgba(59,130,246,0.1); font-size:11px; font-family:var(--mono); }
.jr-sym { color:var(--blue-200); font-weight:500; min-width:56px; }
.jr-type { font-size:9px; padding:2px 6px; border-radius:3px; }
.jr-long { background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3); }
.jr-short { background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); }
.jr-mid { font-size:10px; color:var(--gray); flex:1; text-align:center; }
.jr-pnl { margin-left:auto; font-weight:500; }
.analytics-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.an-card { background:rgba(37,99,235,0.06); border:1px solid rgba(59,130,246,0.12); border-radius:8px; padding:12px; }
.an-label { font-size:9px; font-family:var(--mono); color:var(--gray); letter-spacing:.1em; margin-bottom:8px; }
.an-bar-bg { height:6px; background:rgba(59,130,246,0.1); border-radius:3px; overflow:hidden; margin-bottom:6px; }
.an-bar { height:100%; border-radius:3px; background:linear-gradient(90deg,var(--blue-400),var(--blue-300)); }
.an-val { font-size:20px; font-family:var(--mono); font-weight:600; color:var(--blue-200); }
.an-session { margin-top:10px; background:rgba(37,99,235,0.06); border:1px solid rgba(59,130,246,0.12); border-radius:8px; padding:10px 12px; }
.an-session .lbl { font-size:9px; font-family:var(--mono); color:var(--gray); letter-spacing:.1em; margin-bottom:6px; }
.an-session .ses { font-family:var(--mono); font-size:12px; white-space:pre; }
.sig-row { display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:6px; margin-bottom:6px; border:1px solid rgba(59,130,246,0.12); background:rgba(37,99,235,0.04); }
.sig-icon { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:var(--mono); font-size:13px; font-weight:600; flex-shrink:0; }
.sig-icon.bull { background:rgba(34,197,94,0.15); color:#22c55e; }
.sig-icon.bear { background:rgba(239,68,68,0.15); color:#ef4444; }
.sig-info { flex:1; }
.sig-name { font-size:12px; font-family:var(--mono); color:var(--blue-100); }
.sig-detail { font-size:10px; color:var(--gray); margin-top:1px; }
.sig-conf { font-family:var(--mono); font-size:11px; font-weight:600; }
.sig-conf.high { color:#22c55e; } .sig-conf.med { color:#f59e0b; }
.rk-row { margin-bottom:10px; }
.rk-row .hd { display:flex; justify-content:space-between; margin-bottom:5px; }
.rk-row .hd span { font-size:10px; font-family:var(--mono); }
.rk-tiles { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-top:12px; }
.rk-tile { border-radius:6px; padding:8px 10px; text-align:center; }
.rk-tile .t { font-size:9px; font-family:var(--mono); color:var(--gray); margin-bottom:3px; }
.rk-tile .v { font-size:11px; font-family:var(--mono); }

#logo-reveal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:50; text-align:center; opacity:0; pointer-events:none; transition:opacity 0.8s; }
#logo-reveal .logo-ring { width:120px; height:120px; border-radius:50%; border:2px solid rgba(59,130,246,0.6); display:flex; align-items:center; justify-content:center; margin:0 auto 24px; box-shadow:0 0 40px rgba(59,130,246,0.4),0 0 80px rgba(59,130,246,0.2); animation:ring-pulse 2s ease-in-out infinite; }
@keyframes ring-pulse { 0%,100%{box-shadow:0 0 40px rgba(59,130,246,0.4),0 0 80px rgba(59,130,246,0.2);} 50%{box-shadow:0 0 60px rgba(59,130,246,0.7),0 0 120px rgba(59,130,246,0.35);} }
#logo-reveal h2 { font-size:28px; font-weight:300; color:#fff; letter-spacing:-.01em; margin-bottom:10px; }
#logo-reveal h2 strong { color:var(--blue-200); font-weight:600; }
#logo-reveal p { font-size:14px; color:var(--gray); max-width:380px; margin:0 auto 28px; line-height:1.65; }
#logo-reveal .reveal-cta { display:flex; gap:12px; justify-content:center; }

#progress-bar { position:fixed; right:32px; top:50%; transform:translateY(-50%); z-index:100; display:flex; flex-direction:column; align-items:center; gap:12px; }
.prog-dot { width:7px; height:7px; border-radius:50%; background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.4); cursor:pointer; transition:all .3s; }
.prog-dot.active { background:var(--blue-400); box-shadow:0 0 10px rgba(59,130,246,0.6); }
.prog-line { width:1px; height:28px; background:rgba(59,130,246,0.15); }

@media(max-width:760px){
  #navbar nav { display:none; }
  #navbar { padding:0 18px; }
  .panel-inner, .panel-inner.reverse { grid-template-columns:1fr; gap:18px; }
  .panel-inner.reverse .panel-preview { order:0; }
  .panel-text { display:none; }
  #progress-bar { right:14px; }
}
@media(prefers-reduced-motion:reduce){ .scroll-arrow,#logo-reveal .logo-ring{ animation:none; } }
`
