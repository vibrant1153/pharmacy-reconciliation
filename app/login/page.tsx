'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin }),
    })
    const data = await res.json()
    setLoading(false)

    if (!data.success) {
      setError(data.message)
      return
    }

    router.push(data.user.role === 'OWNER' ? '/dashboard' : '/sales')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0F172A 0%, #0F766E 140%)',
      }}
    >
      <form
        onSubmit={handleLogin}
        className="card fade-in"
        style={{
          width: 360,
          padding: 36,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.02em' }}>
            Trusty
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Pharmacy Reconciliation
          </div>
        </div>

        <div>
          <label className="label">Username</label>
          <input
            className="input"
            placeholder="e.g. ahmed"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="label">PIN</label>
          <input
            className="input"
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        </div>

        {error && (
          <div className="badge badge-danger" style={{ justifyContent: 'center' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 8 }}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  )
}