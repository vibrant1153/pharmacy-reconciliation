'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface ReconciliationData {
  date: string
  products: { name: string; expectedRevenue: number }[]
  totalExpectedRevenue: number
  actualCash: number | null
  diff: number | null
  status: 'green' | 'yellow' | 'red' | 'pending'
}

const statusMap: Record<string, { color: string; badge: string; label: string }> = {
  green: { color: 'var(--color-success)', badge: 'badge-success', label: 'Balanced' },
  yellow: { color: 'var(--color-warning)', badge: 'badge-warning', label: 'Minor Discrepancy' },
  red: { color: 'var(--color-danger)', badge: 'badge-danger', label: 'Needs Investigation' },
  pending: { color: 'var(--color-text-secondary)', badge: 'badge-neutral', label: 'Not Submitted' },
}

export default function ReconciliationPage() {
  const [data, setData] = useState<ReconciliationData | null>(null)
  const [cashInput, setCashInput] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [message, setMessage] = useState('')

  async function loadData(date: string) {
    const res = await fetch(`/api/reconciliation?date=${date}`)
    const json = await res.json()
    if (json.success) {
      setData(json)
      setCashInput(json.actualCash !== null ? String(json.actualCash) : '')
    }
  }

  useEffect(() => {
    loadData(selectedDate)
  }, [selectedDate])

  async function submitCash(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    const res = await fetch('/api/reconciliation/actual-cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate, actualCash: parseFloat(cashInput) }),
    })
    const json = await res.json()

    if (!json.success) {
      setMessage(json.message)
      return
    }

    setMessage('Saved.')
    loadData(selectedDate)
  }

  if (!data) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar userName="Owner" role="OWNER" />
        <div style={{ padding: 32 }}>Loading...</div>
      </div>
    )
  }

  const status = statusMap[data.status]

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName="Owner" role="OWNER" />
      <div style={{ flex: 1, padding: 32, maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Reconciliation</h1>
          <input
            type="date"
            className="input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: 170 }}
          />
        </div>

        <div
          className="card fade-in"
          style={{
            padding: 28,
            marginBottom: 24,
            borderLeft: `4px solid ${status.color}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Status</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: status.color, marginTop: 2 }}>
                {status.label}
              </div>
            </div>
            <span className={`badge ${status.badge}`} style={{ fontSize: 13, padding: '6px 14px' }}>
              {data.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Expected Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{data.totalExpectedRevenue.toFixed(2)} Birr</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Actual Cash</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
                {data.actualCash !== null ? `${data.actualCash.toFixed(2)} Birr` : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Difference</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2, color: status.color }}>
                {data.diff !== null ? `${data.diff.toFixed(2)} Birr` : '—'}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submitCash} className="card fade-in" style={{ padding: 24, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Actual cash counted</label>
            <input
              type="number"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">Submit</button>
          {message && <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginLeft: 8 }}>{message}</span>}
        </form>

        <div className="card fade-in" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>By Medicine</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Expected Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.expectedRevenue.toFixed(2)} Birr</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.products.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, padding: '12px 0' }}>
              No sales for this date.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}