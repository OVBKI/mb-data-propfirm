'use client'
import { motion } from 'framer-motion'
import { useT } from '../LanguageProvider'

const C = {
  bg: '#0d0f14',
  surface: '#141720',
  border: 'rgba(255,255,255,0.07)',
  text: '#f0ede8',
  text2: '#9098b0',
  text3: '#565e78',
  blue: '#2d6fff',
  blueLight: '#4d8fff',
  green: '#1db87a',
}

export default function SocialProof({ count = 47 }) {
  const t = useT()

  const testimonials = [
    t('socialProof.testimonials.0'),
    t('socialProof.testimonials.1'),
    t('socialProof.testimonials.2'),
  ]

  return (
    <section style={{ padding: '48px 24px 32px', position: 'relative' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Beta badge + counter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: 36 }}
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
          <div style={{
            fontSize: 14,
            color: C.text2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}>
            <span style={{
              display: 'inline-flex', gap: -4,
            }}>
              {['#4d8fff', '#1db87a', '#fac775', '#e8504a', '#7ba9ff'].map((c, i) => (
                <span key={i} style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${c}, ${c}88)`,
                  border: `2px solid ${C.bg}`,
                  marginLeft: i > 0 ? -8 : 0,
                  display: 'inline-block',
                  fontSize: 10,
                  lineHeight: '20px',
                  textAlign: 'center',
                  color: '#fff',
                  fontWeight: 700,
                }} />
              ))}
            </span>
            <span>{t('socialProof.betaCount').replace('{count}', count)}</span>
          </div>
        </motion.div>

        {/* Testimonial cards */}
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
      </div>
    </section>
  )
}
