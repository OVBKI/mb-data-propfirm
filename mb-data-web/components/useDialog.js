'use client'

import { useEffect, useRef } from 'react'

// Stack of currently-open dialogs (most-recently-opened last). Only the dialog on
// top responds to Escape / Tab, so stacking a modal over a drawer closes just the
// top one per Escape (instead of every open dialog at once).
const dialogStack = []

// Body overflow value saved when the FIRST dialog opens, restored when the LAST
// one closes — so nested dialogs (modal over drawer) don't clobber each other.
let savedBodyOverflow = ''

// Accessible dialog behavior: focus management + Escape + focus trap + scroll lock.
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

    // Register on the open-dialog stack; this instance is now the topmost.
    const token = {}
    dialogStack.push(token)
    const isTop = () => dialogStack[dialogStack.length - 1] === token

    // Lock background scroll while at least one dialog is open. Save the previous
    // inline value only when this is the first dialog (stack was empty before push).
    if (typeof document !== 'undefined' && dialogStack.length === 1) {
      savedBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }

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
      // Only the topmost dialog reacts, so Escape/Tab don't leak to dialogs beneath.
      if (!isTop()) return
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
      // Remove this instance from the stack (it may not be on top if dialogs closed
      // out of order, so splice by identity rather than pop).
      const i = dialogStack.indexOf(token)
      if (i !== -1) dialogStack.splice(i, 1)
      // Restore background scroll only when the LAST dialog closes.
      if (typeof document !== 'undefined' && dialogStack.length === 0) {
        document.body.style.overflow = savedBodyOverflow
      }
      // restore focus to the element focused before opening
      const prev = lastFocused.current
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus() } catch (_) {}
      }
    }
  }, [open])

  return ref
}
