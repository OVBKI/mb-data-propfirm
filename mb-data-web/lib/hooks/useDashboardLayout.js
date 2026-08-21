'use client'
// lib/hooks/useDashboardLayout.js — charge, applique et persiste la disposition.
//
// Le serveur (profiles.dashboard_layout) fait autorité au chargement ; le cache
// local ne sert qu'à afficher la bonne disposition sans attendre le réseau.
// L'écriture serveur est différée : réordonner un widget en glissé-déposé
// produit une rafale d'états, on ne veut pas une requête par image.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase'
import {
  DEFAULT_LAYOUT, normalizeLayout, readLocalLayout, writeLocalLayout,
  moveWidget, setWidgetWidth, setWidgetVisible,
} from '../dashboardLayout'

const SAVE_DELAY_MS = 900

export function useDashboardLayout(userId) {
  // On part du cache local s'il existe : pas de saut visuel au montage.
  const [layout, setLayout] = useState(() => readLocalLayout() || normalizeLayout(DEFAULT_LAYOUT))
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
          const next = normalizeLayout(data.dashboard_layout)
          setLayout(next)
          writeLocalLayout(next)
        }
      } catch {
        // Colonne absente ou hors ligne : le cache local suffit à fonctionner.
      }
    })()
    return () => { alive = false }
  }, [userId])

  const persist = useCallback((next) => {
    dirty.current = true
    writeLocalLayout(next)
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

  // Vider le minuteur au démontage éviterait d'écrire après une navigation,
  // mais on veut justement que la dernière modification parte quand même.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const apply = useCallback((fn) => {
    setLayout(prev => {
      const next = fn(prev)
      persist(next)
      return next
    })
  }, [persist])

  return {
    layout,
    editing,
    setEditing,
    move:    useCallback((id, targetId) => apply(l => moveWidget(l, id, targetId)), [apply]),
    resize:  useCallback((id, w) => apply(l => setWidgetWidth(l, id, w)), [apply]),
    toggle:  useCallback((id, visible) => apply(l => setWidgetVisible(l, id, visible)), [apply]),
    reset:   useCallback(() => apply(() => normalizeLayout(DEFAULT_LAYOUT)), [apply]),
  }
}
