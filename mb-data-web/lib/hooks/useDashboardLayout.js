'use client'
// lib/hooks/useDashboardLayout.js — charge, applique et persiste les dispositions.
//
// Le dashboard a QUATRE sous-sections (Vue d'ensemble, Performance, Payouts,
// Risque). Chacune a sa propre disposition, personnalisable indépendamment ;
// l'ensemble est stocké dans un seul objet.
//
// Le serveur (profiles.dashboard_layout) fait autorité au chargement ; le cache
// local ne sert qu'à afficher la bonne disposition sans attendre le réseau.
// L'écriture serveur est différée : réordonner un widget en glissé-déposé
// produit une rafale d'états, on ne veut pas une requête par image.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../supabase'
import {
  DEFAULT_SECTION, SECTIONS, STORAGE_KEY,
  normalizeAll, normalizeLayoutFor, defaultLayoutFor,
  moveWidget, setWidgetWidth, setWidgetVisible,
} from '../dashboardLayout'

const SAVE_DELAY_MS = 900

function readLocalAll() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? normalizeAll(JSON.parse(raw)) : null
  } catch { return null }
}

function writeLocalAll(all) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)) } catch {}
}

export function useDashboardLayout(userId) {
  // On part du cache local s'il existe : pas de saut visuel au montage.
  const [all, setAll] = useState(() => readLocalAll() || normalizeAll(null))
  const [section, setSection] = useState(DEFAULT_SECTION)
  const [editing, setEditing] = useState(false)
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
          // normalizeAll reprend aussi l'ancien format (un simple tableau) comme
          // disposition de « Vue d'ensemble » : personne ne perd son écran.
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
        await supabase.from('profiles').update({ dashboard_layout: next }).eq('user_id', userId)
      } catch {
        // Échec silencieux : la disposition reste correcte localement.
      }
    }, SAVE_DELAY_MS)
  }, [userId])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  // Toutes les opérations portent sur la section AFFICHÉE : personnaliser
  // « Payouts » ne doit rien changer à « Vue d'ensemble ».
  const apply = useCallback((fn) => {
    setAll(prev => {
      const next = { ...prev, [section]: fn(prev[section] || []) }
      persist(next)
      return next
    })
  }, [persist, section])

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

  return {
    layout,
    section,
    setSection: selectSection,
    editing,
    setEditing,
    move:    useCallback((id, targetId) => apply(l => moveWidget(l, id, targetId)), [apply]),
    resize:  useCallback((id, w) => apply(l => setWidgetWidth(l, id, w)), [apply]),
    toggle:  useCallback((id, visible) => apply(l => setWidgetVisible(l, id, visible)), [apply]),
    reset:   useCallback(() => apply(() => normalizeLayoutFor(section, defaultLayoutFor(section))), [apply, section]),
  }
}
