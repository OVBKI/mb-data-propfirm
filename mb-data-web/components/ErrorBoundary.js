'use client'
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
        color: 'var(--text)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>:(</div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Quelque chose s'est mal passé
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, maxWidth: 400, marginBottom: 24 }}>
          Une erreur inattendue est survenue. Recharge la page pour continuer.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'var(--blue)', color: 'var(--text-inverse)', border: 'none',
            borderRadius: 'var(--radius)', padding: '10px 24px',
            fontSize: 14, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Recharger la page
        </button>
      </div>
    )
  }
}
