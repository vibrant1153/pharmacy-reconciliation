'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface Alert {
  id: string
  type: 'LOW_STOCK' | 'DISCREPANCY' | 'STALE_ITEM'
  message: string
  createdAt: string
}

const typeBadge: Record<string, string> = {
  LOW_STOCK: 'badge-warning',
  DISCREPANCY: 'badge-danger',
  STALE_ITEM: 'badge-danger',
}

const typeLabel: Record<string, string> = {
  LOW_STOCK: 'Low Stock',
  DISCREPANCY: 'Discrepancy',
  STALE_ITEM: 'Suspicious — Stale Item',
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  async function loadAlerts() {
    const res = await fetch('/api/alerts')
    const data = await res.json()
    if (data.success) setAlerts(data.alerts)
    setLoading(false)
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  async function dismiss(id: string) {
    await fetch(`/api/alerts/${id}`, { method: 'PATCH' })
    loadAlerts()
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName="Owner" role="OWNER" />
      <div style={{ flex: 1, padding: 32, maxWidth: 900 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Alerts
        </h1>

        {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Checking for alerts...</p>}

        {!loading && alerts.length === 0 && (
          <div className="card fade-in" style={{ padding: 24, color: 'var(--color-text-secondary)' }}>
            Nothing to flag right now.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((alert) => (
            <div key={alert.id} className="card fade-in" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className={`badge ${typeBadge[alert.type]}`} style={{ marginBottom: 8, display: 'inline-block' }}>
                  {typeLabel[alert.type]}
                </span>
                <div style={{ fontSize: 14 }}>{alert.message}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {new Date(alert.createdAt).toLocaleString()}
                </div>
              </div>
              <button onClick={() => dismiss(alert.id)} className="btn btn-secondary">Dismiss</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}