'use client'

import { useState, useEffect } from 'react'

interface ReconciliationData {
  date: string
  products: { name: string; expectedRevenue: number }[]
  totalExpectedRevenue: number
  actualCash: number | null
  diff: number | null
  status: 'green' | 'yellow' | 'red' | 'pending'
}

const statusColors: Record<string, string> = {
  green: '#22C55E',
  yellow: '#F59E0B',
  red: '#EF4444',
  pending: '#888',
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

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>

  return (
    <div style={{ padding: 24, maxWidth: 700 }}>
      <h1>Reconciliation</h1>

      <div style={{ marginBottom: 24 }}>
        <label>
          Date:{' '}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </label>
      </div>

      <div
        style={{
          padding: 16,
          border: `2px solid ${statusColors[data.status]}`,
          marginBottom: 24,
        }}
      >
        <div>Expected Revenue: <strong>{data.totalExpectedRevenue.toFixed(2)} Birr</strong></div>
        <div>Actual Cash: <strong>{data.actualCash !== null ? `${data.actualCash.toFixed(2)} Birr` : 'Not entered yet'}</strong></div>
        <div>Difference: <strong>{data.diff !== null ? `${data.diff.toFixed(2)} Birr` : '—'}</strong></div>
        <div style={{ color: statusColors[data.status], fontWeight: 'bold', textTransform: 'uppercase' }}>
          Status: {data.status}
        </div>
      </div>

      <form onSubmit={submitCash} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          type="number"
          step="0.01"
          placeholder="Actual cash counted"
          value={cashInput}
          onChange={(e) => setCashInput(e.target.value)}
          style={{ padding: 8 }}
        />
        <button type="submit" style={{ padding: 8 }}>Submit</button>
      </form>
      {message && <p>{message}</p>}

      <h2>By Medicine</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Medicine</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Expected Revenue</th>
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
    </div>
  )
}