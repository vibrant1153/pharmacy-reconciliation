'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface ProfitData {
  period: string
  totalProfit: number
  totalRevenue: number
  byMedicine: { name: string; profit: number }[]
  byCategory: { name: string; profit: number }[]
  byEmployee: { name: string; profit: number }[]
}

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
]

export default function ProfitPage() {
  const [data, setData] = useState<ProfitData | null>(null)
  const [period, setPeriod] = useState('today')

  useEffect(() => {
    fetch(`/api/profit?period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json)
      })
  }, [period])

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName="Owner" role="OWNER" />
      <div style={{ flex: 1, padding: 32, maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>Profit</h1>
          <div style={{ display: 'flex', gap: 6 }}>
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={period === p.key ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '8px 14px', fontSize: 13 }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {!data ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <div className="card fade-in" style={{ padding: 20, flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Revenue</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{data.totalRevenue.toFixed(2)} Birr</div>
              </div>
              <div className="card fade-in" style={{ padding: 20, flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Profit</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4, color: 'var(--color-success)' }}>{data.totalProfit.toFixed(2)} Birr</div>
              </div>
              <div className="card fade-in" style={{ padding: 20, flex: 1 }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Margin</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                  {data.totalRevenue > 0 ? `${((data.totalProfit / data.totalRevenue) * 100).toFixed(1)}%` : '—'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20 }}>
              <div className="card fade-in" style={{ flex: 1, padding: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>By Medicine</h2>
                {data.byMedicine.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No sales in this period.</p>}
                {data.byMedicine.map((row) => (
                  <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                    <span>{row.name}</span>
                    <span style={{ fontWeight: 600 }}>{row.profit.toFixed(2)} Birr</span>
                  </div>
                ))}
              </div>

              <div className="card fade-in" style={{ flex: 1, padding: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>By Category</h2>
                {data.byCategory.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No sales in this period.</p>}
                {data.byCategory.map((row) => (
                  <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                    <span>{row.name}</span>
                    <span style={{ fontWeight: 600 }}>{row.profit.toFixed(2)} Birr</span>
                  </div>
                ))}
              </div>

              <div className="card fade-in" style={{ flex: 1, padding: 20 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>By Employee</h2>
                {data.byEmployee.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No sales in this period.</p>}
                {data.byEmployee.map((row) => (
                  <div key={row.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                    <span>{row.name}</span>
                    <span style={{ fontWeight: 600 }}>{row.profit.toFixed(2)} Birr</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}