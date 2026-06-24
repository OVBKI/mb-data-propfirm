'use client'

import { useEffect, useRef } from 'react'

// Accessible dialog behavior: focus management + Escape + focus trap.
// Usage: const dialogRef = useDialog({ open: !!someState, onClose: () => setSomeState(null) })
//        <div ref={dialogRef} role="dialog" aria-modal="true" tabIndex={-1} ...>
export function useDialog({ open, onClose }) {
  const ref = useRef(null)
  const lastFocused = useRef(null)
  // Keep the latest onClose in a ref so the main effect depends only on `open`.
  // Otherwise an inline `onClose` arrow (new identity each render) would re-run the
  // effect on every parent render — re-focusing the first field and stealing focus
  // from whatever the user is typing. Depending on [open] alone runs the effect only
  // on open/close transitions.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    lastFocused.current = (typeof document !== 'undefined') ? document.activeElement : null
    const node = ref.current

    // collect focusable elements inside the dialog
    const focusables = () => node
      ? node.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')
      : []

    // If an element inside the dialog already holds focus (e.g. an input with
    // autoFocus that React focused during commit, before this effect ran), respect
    // it. Otherwise focus the first focusable, else the container itself.
    const active = (typeof document !== 'undefined') ? document.activeElement : null
    if (!(node && active && node.contains(active))) {
      const first = focusables()[0]
      if (first) first.focus()
      else if (node) node.focus()
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (onCloseRef.current) onCloseRef.current()
        return
      }
      if (e.key === 'Tab') {
        const f = focusables()
        if (!f.length) return
        const list = Array.prototype.slice.call(f)
        const firstEl = list[0]
        const lastEl = list[list.length - 1]
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault()
          lastEl.focus()
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault()
          firstEl.focus()
        }
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // restore focus to the element focused before opening
      const prev = lastFocused.current
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus() } catch (_) {}
      }
    }
  }, [open])

  return ref
}
