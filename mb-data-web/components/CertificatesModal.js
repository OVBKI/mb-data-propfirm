'use client'
// Modal de gestion des diplômes / certificats d'une PropFirm.
// Permet d'uploader des screenshots/PDFs de :
//   - Certificat de réussite de challenge
//   - Certificat de payout
//   - Autre (passing certificate, etc.)
// Affiche la galerie des certificats existants pour la firme + zoom au clic.
//
// Prérequis Supabase Storage : bucket "certificates" public + table `certificates`
// (voir supabase-schema.sql + lib/uploadFile.js)

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '../lib/supabase'
import { uploadFile, deleteFile } from '../lib/uploadFile'
import Skeleton from './Skeleton'

const TYPES = [
  { k: 'challenge_passed', l: '🏆 Challenge réussi', color: '#fac775' },
  { k: 'payout',           l: '💰 Payout reçu',      color: '#1db87a' },
]
// Pour la rétrocompatibilité : si un cert en DB a un type non listé (ex: 'other', 'certificate'),
// on retombe sur ce fallback à l'affichage.
const FALLBACK_TYPE = { k: 'other', l: '📄 Autre', color: '#9098b0' }

const labelStyle = {
  display:'block', fontSize:'11px', fontWeight:'600',
  color:'var(--text3)', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.4px',
}
const inputStyle = {
  width:'100%', padding:'9px 12px', fontSize:'13px', borderRadius:'8px',
  border:'1px solid var(--border2)', background:'var(--surface2)', color:'var(--text)',
  fontFamily:'inherit',
}

export default function CertificatesModal({ firm, user, onClose, showToast, getFirmLogo }){
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Form upload
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState('challenge_passed')
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().slice(0,10))
  const [uploadNote, setUploadNote] = useState('')
  const [uploading, setUploading] = useState(false)
  // Lightbox
  const [zoomCert, setZoomCert] = useState(null)

  async function load(){
    setLoading(true); setError('')
    const { data, error: err } = await supabase
      .from('certificates')
      .select('*')
      .eq('firm_id', firm.id)
      .order('created_at', { ascending: false })
    if(err){
      const isMissing = /relation.*does not exist|42P01/i.test(err.message || '')
      setError(isMissing
        ? '⚠ La table `certificates` n\'existe pas dans Supabase. Lance le SQL de supabase-schema.sql.'
        : err.message)
      setCerts([])
    } else {
      setCerts(data || [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [firm.id])

  async function handleUpload(file){
    if(!file) return
    setUploading(true)
    const { url, error: upErr } = await uploadFile({
      bucket: 'certificates', file, userId: user.id,
    })
    if(upErr){
      alert(upErr)
      showToast?.('❌ Upload échoué')
      setUploading(false)
      return
    }
    // Insert dans la table certificates
    const { error: insErr } = await supabase.from('certificates').insert({
      user_id:   user.id,
      firm_id:   firm.id,
      type:      uploadType,
      file_url:  url,
      date:      uploadDate || null,
      note:      uploadNote.trim(),
    })
    setUploading(false)
    if(insErr){
      const isMissing = /relation.*does not exist|42P01/i.test(insErr.message || '')
      if(isMissing){
        alert(
          '⚠ La table `certificates` n\'existe pas dans Supabase.\n\n' +
          'Va sur Supabase → SQL Editor et exécute le contenu de supabase-schema.sql ' +
          '(le fichier contient déjà la commande create table certificates avec les bonnes RLS).'
        )
      } else {
        showToast?.('Erreur enregistrement : ' + insErr.message)
      }
      return
    }
    showToast?.('Diplôme ajouté ✓')
    setUploadOpen(false)
    setUploadNote('')
    setUploadDate(new Date().toISOString().slice(0,10))
    await load()
  }

  async function handleDelete(cert){
    if(!confirm('Supprimer ce diplôme ?')) return
    // Supprime aussi le fichier du storage si possible (path = après le ?token, on peut extraire)
    // Pour simplifier on supprime juste la ligne — le fichier reste orphelin mais pas grave (storage gratuit)
    const { error: delErr } = await supabase.from('certificates').delete().eq('id', cert.id)
    if(delErr){
      showToast?.('Erreur suppression : ' + delErr.message)
      return
    }
    showToast?.('Diplôme supprimé')
    await load()
  }

  const isPdf = (url) => /\.pdf(\?|$)/i.test(url || '')

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)',
      zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--surface)', borderRadius:'var(--radius-lg)',
        border:'1px solid var(--border2)',
        width:'100%', maxWidth:'900px', maxHeight:'90vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 30px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{
          padding:'18px 22px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'14px',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            {getFirmLogo ? getFirmLogo(firm.name, firm.color, 36) : null}
            <div>
              <div style={{fontSize:'16px', fontWeight:'700'}}>🎓 Diplômes — {firm.name}</div>
              <div style={{fontSize:'11px', color:'var(--text3)', marginTop:'2px'}}>
                {certs.length} diplôme{certs.length>1?'s':''} enregistré{certs.length>1?'s':''}
              </div>
            </div>
          </div>
          <div style={{display:'flex', gap:'8px'}}>
            <button onClick={()=>setUploadOpen(o=>!o)} style={{
              padding:'9px 18px', fontSize:'12.5px', fontWeight:'500', cursor:'pointer',
              borderRadius:'8px', border:'1px solid transparent', background:'var(--text)', color:'#0a0c10',
              boxShadow:'0 1px 0 rgba(255,255,255,0.4) inset, 0 4px 12px rgba(0,0,0,0.25)',
              fontFamily:'inherit', letterSpacing:'0.005em',
            }}>{uploadOpen ? '✕ Annuler' : '+ Ajouter un diplôme'}</button>
            <button onClick={onClose} style={{
              width:'32px', height:'32px', borderRadius:'8px', border:'1px solid var(--border2)',
              background:'transparent', color:'var(--text2)', cursor:'pointer', fontSize:'14px',
            }}>✕</button>
          </div>
        </div>

        {/* Body scrollable */}
        <div style={{flex:1, overflow:'auto', padding:'20px 22px'}}>
          {/* Form upload */}
          {uploadOpen && (
            <div style={{
              background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:'10px', padding:'16px', marginBottom:'20px',
            }}>
              <div style={{fontSize:'13px', fontWeight:'600', marginBottom:'14px'}}>📤 Nouveau diplôme</div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={uploadType} onChange={e=>setUploadType(e.target.value)} style={inputStyle}>
                    {TYPES.map(t => <option key={t.k} value={t.k}>{t.l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date (optionnel)</label>
                  <input type="date" value={uploadDate} onChange={e=>setUploadDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={labelStyle}>Note (optionnel)</label>
                  <input
                    type="text" value={uploadNote}
                    onChange={e=>setUploadNote(e.target.value)}
                    placeholder="ex : Compte 50K · Profit target $3000 atteint"
                    style={inputStyle}
                  />
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                    padding:'18px', border:'1px dashed var(--border2)', borderRadius:'8px',
                    cursor: uploading ? 'wait' : 'pointer', background:'var(--surface3)',
                    color:'var(--text2)', fontSize:'12px', fontWeight:'600',
                  }}>
                    {uploading
                      ? '⏳ Upload en cours...'
                      : '📎 Cliquer pour choisir le fichier (PNG, JPG, PDF · max 10 Mo)'}
                    <input
                      type="file" accept="image/*,.pdf"
                      disabled={uploading}
                      onChange={e=>handleUpload(e.target.files?.[0])}
                      style={{display:'none'}}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Liste / galerie */}
          {loading ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12 }}>
                    <Skeleton width="100%" height={120} style={{ borderRadius: 8, marginBottom: 8 }} />
                    <Skeleton width="60%" height={12} />
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div style={{
              padding:'16px', background:'var(--red-bg)', border:'1px solid var(--red)',
              borderRadius:'10px', color:'var(--red-text)', fontSize:'13px',
            }}>{error}</div>
          ) : certs.length === 0 ? (
            <div style={{
              textAlign:'center', padding:'60px 20px', color:'var(--text3)', fontSize:'13px',
              background:'var(--surface2)', borderRadius:'10px',
            }}>
              <div style={{fontSize:'32px', marginBottom:'12px'}}>🎓</div>
              Aucun diplôme pour {firm.name} pour l'instant.<br />
              Clique sur <strong style={{color:'var(--text2)'}}>+ Ajouter un diplôme</strong> pour commencer.
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'14px'}}>
              {certs.map(cert => {
                const typeMeta = TYPES.find(t => t.k === cert.type) || FALLBACK_TYPE
                return (
                  <div key={cert.id} style={{
                    background:'var(--surface2)', border:'1px solid var(--border)',
                    borderRadius:'10px', overflow:'hidden', display:'flex', flexDirection:'column',
                  }}>
                    {/* Aperçu */}
                    <div
                      onClick={()=>setZoomCert(cert)}
                      style={{
                        height:'150px', background:'var(--bg)', cursor:'zoom-in',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        borderBottom:'1px solid var(--border)', overflow:'hidden',
                      }}
                    >
                      {isPdf(cert.file_url) ? (
                        <div style={{textAlign:'center', color:'var(--text2)', padding:'20px'}}>
                          <div style={{fontSize:'40px', marginBottom:'6px'}}>📄</div>
                          <div style={{fontSize:'11px'}}>PDF — clic pour ouvrir</div>
                        </div>
                      ) : (
                        <div style={{position:'relative', width:'100%', height:'100%'}}>
                          <Image
                            src={cert.file_url} alt={cert.note || cert.type}
                            fill
                            sizes="220px"
                            style={{objectFit:'cover'}}
                          />
                        </div>
                      )}
                    </div>
                    {/* Méta */}
                    <div style={{padding:'10px 12px', flex:1, display:'flex', flexDirection:'column', gap:'5px'}}>
                      <div style={{
                        display:'inline-block', alignSelf:'flex-start',
                        fontSize:'10px', fontWeight:'600', padding:'2px 8px', borderRadius:'99px',
                        background:`${typeMeta.color}22`, color:typeMeta.color,
                      }}>{typeMeta.l}</div>
                      {cert.date && <div style={{fontSize:'11px', color:'var(--text3)'}}>{cert.date}</div>}
                      {cert.note && <div style={{fontSize:'11px', color:'var(--text2)'}}>{cert.note}</div>}
                      <div style={{display:'flex', gap:'6px', marginTop:'auto', paddingTop:'6px'}}>
                        <a
                          href={cert.file_url} target="_blank" rel="noopener noreferrer"
                          style={{
                            flex:1, fontSize:'10px', padding:'5px 8px', borderRadius:'6px',
                            background:'var(--surface3)', color:'var(--text2)',
                            textAlign:'center', textDecoration:'none', fontWeight:'600',
                          }}
                        >↗ Ouvrir</a>
                        <button
                          onClick={()=>handleDelete(cert)}
                          style={{
                            fontSize:'10px', padding:'5px 8px', borderRadius:'6px',
                            background:'transparent', border:'1px solid var(--border2)',
                            color:'var(--red-text)', cursor:'pointer', fontWeight:'600',
                          }}
                        >✕</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox zoom */}
      {zoomCert && !isPdf(zoomCert.file_url) && (
        <div onClick={()=>setZoomCert(null)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:600,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', cursor:'zoom-out',
        }}>
          <div style={{position:'relative', width:'95%', height:'95%'}}>
            <Image
              src={zoomCert.file_url} alt="Diplôme"
              fill
              sizes="95vw"
              style={{objectFit:'contain', borderRadius:'8px'}}
            />
          </div>
          <button onClick={()=>setZoomCert(null)} style={{
            position:'absolute', top:'20px', right:'20px',
            background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)',
            borderRadius:'8px', padding:'8px 16px', fontSize:'13px', cursor:'pointer', fontWeight:'600',
          }}>✕ Fermer</button>
        </div>
      )}
    </div>
  )
}
