'use client'
// lib/hooks/useDashboardLayout.js — l'état de la personnalisation.
//
// Porte les dispositions des quatre sous-sections, la section affichée, le mode
// édition et l'historique annuler/rétablir.
//
// Le serveur (profiles.dashboard_layout) fait autorité au chargement ; le cache
// local ne sert qu'à afficher la bonne disposition sans attendre le réseau.
// L'écriture serveur est différée : réordonner un widget en glissé-déposé
// produit une rafale d'états, on ne veut pas une requête par image.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import {
  DEFAULT_SECTION, SECTIONS, STORAGE_KEY,
  normalizeAll, normalizeLayoutFor, defaultLayoutFor, serializeAll,
  applyPreset, exportLayout, importLayout,
  moveWidget, setWidgetWidth, setWidgetHeight, setWidgetVisible,
  setWidgetTitle, setWidgetOption, duplicateWidget, removeWidget,
} from '../dashboardLayout'

const SAVE_DELAY_MS = 900
// Assez pour revenir sur une séance de réglages, assez court pour ne pas garder
// des dizaines de copies de la disposition en mémoire.
const HISTORY_LIMIT = 40

function readLocalAll() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeAll(JSON.parse(raw)) : null
  } catch { return null }
}

function writeLocalAll(all) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeAll(all))) } catch {}
}

export function useDashboardLayout(userId) {
  const [all, setAll] = useState(() => readLocalAll() || normalizeAll(null))
  const [section, setSection] = useState(DEFAULT_SECTION)
  const [editing, setEditing] = useState(false)

  // L'historique porte sur l'objet COMPLET, pas sur la section courante : un
  // annuler doit pouvoir défaire un import qui a touché les quatre sections.
  const past = useRef([])
  const future = useRef([])
  const [histTick, setHistTick] = useState(0)   // force le rendu des boutons

  const timer = useRef(null)
  // `dirty` empêche l'arrivée tardive du serveur d'écraser un geste que
  // l'utilisateur vient de faire pendant que la requête était en vol.
  const dirty = useRef(false)

  useEffect(() => {
    if (!userId) return
    let alive = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('dashboard_layout')
          .eq('user_id', userId)
          .maybeSingle()
        if (!alive || error || dirty.current) return
        if (data?.dashboard_layout) {
          const next = normalizeAll(data.dashboard_layout)
          setAll(next)
          writeLocalAll(next)
        }
      } catch {
        // Colonne absente ou hors ligne : le cache local suffit à fonctionner.
      }
    })()
    return () => { alive = false }
  }, [userId])

  const persist = useCallback((next) => {
    dirty.current = true
    writeLocalAll(next)
    if (!userId) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        await supabase.from('profiles')
          .update({ dashboard_layout: serializeAll(next) })
          .eq('user_id', userId)
      } catch {
        // Échec silencieux : la disposition reste correcte localement.
      }
    }, SAVE_DELAY_MS)
  }, [userId])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  // Toute modification passe par ici : elle empile l'état précédent et vide la
  // pile « rétablir », comme n'importe quel éditeur.
  const commit = useCallback((build) => {
    setAll(prev => {
      const next = build(prev)
      if (next === prev) return prev
      past.current = [...past.current, prev].slice(-HISTORY_LIMIT)
      future.current = []
      setHistTick(t => t + 1)
      persist(next)
      return next
    })
  }, [persist])

  // Opération portant sur la section AFFICHÉE : personnaliser « Payouts » ne
  // doit rien changer à « Vue d'ensemble ».
  const onSection = useCallback((fn) => {
    commit(prev => {
      const cur = prev[section] || []
      const nextLayout = fn(cur)
      if (nextLayout === cur) return prev
      return { ...prev, [section]: nextLayout }
    })
  }, [commit, section])

  const undo = useCallback(() => {
    setAll(prev => {
      const prevState = past.current[past.current.length - 1]
      if (!prevState) return prev
      past.current = past.current.slice(0, -1)
      future.current = [prev, ...future.current].slice(0, HISTORY_LIMIT)
      setHistTick(t => t + 1)
      persist(prevState)
      return prevState
    })
  }, [persist])

  const redo = useCallback(() => {
    setAll(prev => {
      const nextState = future.current[0]
      if (!nextState) return prev
      future.current = future.current.slice(1)
      past.current = [...past.current, prev].slice(-HISTORY_LIMIT)
      setHistTick(t => t + 1)
      persist(nextState)
      return nextState
    })
  }, [persist])

  const layout = useMemo(
    () => all[section] || normalizeLayoutFor(section, null),
    [all, section]
  )

  // Changer d'onglet en mode édition serait déroutant : on repasse en lecture.
  const selectSection = useCallback((next) => {
    if (!SECTIONS.includes(next)) return
    setSection(next)
    setEditing(false)
  }, [])

  const doImport = useCallback((text) => {
    const res = importLayout(text)
    if (res.ok) commit(() => res.value)
    return res
  }, [commit])

  return {
    // état
    all, layout, section, editing,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    histTick,

    // navigation
    setSection: selectSection,
    setEditing,

    // opérations sur la section courante
    move:     useCallback((k, target) => onSection(l => moveWidget(l, k, target)), [onSection]),
    resize:   useCallback((k, w) => onSection(l => setWidgetWidth(l, k, w)), [onSection]),
    setHeight: useCallback((k, h) => onSection(l => setWidgetHeight(l, k, h)), [onSection]),
    toggle:   useCallback((k, v) => onSection(l => setWidgetVisible(l, k, v)), [onSection]),
    rename:   useCallback((k, title) => onSection(l => setWidgetTitle(l, k, title)), [onSection]),
    setOption: useCallback((k, opt, v) => onSection(l => setWidgetOption(l, k, opt, v)), [onSection]),
    duplicate: useCallback((k) => onSection(l => duplicateWidget(l, k)), [onSection]),
    remove:   useCallback((k) => onSection(l => removeWidget(l, k)), [onSection]),
    reset:    useCallback(() => onSection(() => normalizeLayoutFor(section, defaultLayoutFor(section))), [onSection, section]),
    preset:   useCallback((key) => onSection(() => applyPreset(section, key)), [onSection, section]),

    // historique
    undo, redo,

    // partage
    exportText: useCallback(() => exportLayout(all), [all]),
    importText: doImport,
  }
}
