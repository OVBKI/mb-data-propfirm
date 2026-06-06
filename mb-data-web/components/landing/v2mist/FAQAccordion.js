'use client'
// FAQAccordion — list of expandable Q&A inside a single frosted card.
// Uses framer-motion AnimatePresence + height auto for smooth open/close,
// and rotates a chevron via CSS transform.

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { mist, fonts } from './tokens'

export default function FAQAccordion({ items }) {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div
      style={{
        background: mist.glassBg,
        backdropFilter: mist.glassBlur,
        WebkitBackdropFilter: mist.glassBlur,
        border: mist.glassBorder,
        borderRadius: 24,
        boxShadow: mist.softShadow,
        padding: '8px 8px',
      }}
    >
      {items.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <div
            key={i}
            style={{
              borderBottom:
                i < items.length - 1
                  ? '1px solid rgba(45, 42, 62, 0.07)'
                  : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '24px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: fonts.body,
                color: mist.text,
                fontSize: 17,
                fontWeight: 500,
                letterSpacing: '-0.005em',
                transition: `color 0.3s ${mist.ease}`,
              }}
            >
              <span>{item.q}</span>
              <span
                aria-hidden
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: 999,
                  background: isOpen ? mist.peach : 'rgba(45, 42, 62, 0.06)',
                  color: isOpen ? '#fff' : mist.text2,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: `transform 0.5s ${mist.ease}, background 0.4s ${mist.ease}, color 0.4s ${mist.ease}`,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 4.5L6 8L9.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    style={{
                      padding: '0 28px 26px 28px',
                      fontFamily: fonts.body,
                      fontSize: 15,
                      lineHeight: 1.65,
                      letterSpacing: '-0.005em',
                      color: mist.text2,
                      maxWidth: 720,
                    }}
                  >
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
