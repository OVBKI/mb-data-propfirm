'use client'
// Beta-honest "social proof" section. The first version of this page
// shipped with three fabricated trader quotes (Maxime R., Sarah K.,
// Thomas B.) and a hard-coded "47 traders" counter — both of which
// would torpedo trust the moment anyone tried to verify them.
//
// Until we have real beta quotes (with @handles or first names + last
// initials we can actually point to), this section advertises that
// Quantara is in private beta and asks visitors to be the first.
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useT } from '../LanguageProvider'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#7b839b',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
}

export default function SocialProof() {
  const t = useT()

  // Future: when real testimonials land in lib/i18n.js socialProof.testimonials
  // they'll render as a grid below the beta badge instead of the
  // "no public reviews yet" card.
  const testimonials = []
  for (let i = 0; i < 3; i++) {
    const item = t(`socialProof.testimonials.${i}`)
    if (item && typeof item === 'object' && item.text) testimonials.push(item)
  }
  const hasRealTestimonials = testimonials.length > 0

  return (
    <section style={{ padding: '48px 24px 32px', position: 'relative' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <span style={{
            display: 'inline-block',
            padding: '5px 14px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: C.green,
            border: `1px solid rgba(29,184,122,0.3)`,
            background: 'rgba(29,184,122,0.08)',
            marginBottom: 12,
          }}>
            {t('socialProof.betaTag')}
          </span>
          <div style={{ fontSize: 14, color: C.text2 }}>
            {t('socialProof.betaCount')}
          </div>
        </motion.div>

        {hasRealTestimonials ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}>
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                style={{
                  padding: '20px 22px',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                }}
              >
                <p style={{
                  fontSize: 13,
                  color: C.text2,
                  lineHeight: 1.65,
                  margin: 0,
                  marginBottom: 14,
                  fontStyle: 'italic',
                }}>
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${C.blue}, ${C.blueLight})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                  }}>
                    {testimonial.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{testimonial.name}</div>
                    <div style={{ fontSize: 11, color: C.text3 }}>{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              maxWidth: 560,
              margin: '0 auto',
              padding: '28px 26px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>
              {t('socialProof.earlyAccessTitle')}
            </div>
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: '0 0 18px' }}>
              {t('socialProof.earlyAccessBody')}
            </p>
            <Link
              href="/auth?mode=signup"
              style={{
                display: 'inline-block',
                padding: '10px 22px',
                borderRadius: 999,
                background: C.blue,
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {t('socialProof.earlyAccessCta')}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  )
}
