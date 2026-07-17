'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface DashboardData {
  todaySalesCount: number
  todayExpectedRevenue: number
  lowStock: { name: string; remaining: number }[]
  outOfStock: { name: string }[]
  recentActivity: { employeeName: string; itemCount: number; total: number; time: string }[]
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="card card-hover fade-in" style={{ padding: 20, flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, color: accent || 'var(--color-text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)

  async function loadDashboard() {
    const res = await fetch('/api/dashboard')
    const json = await res.json()
    if (json.success) setData(json)
  }

  useEffect(() => {
    loadDashboard()
    const interval = setInterval(loadDashboard, 15000)
    return () => clearInterval(interval)
  }, [])

  if (!data) {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar userName="Owner" role="OWNER" />
        <div style={{ padding: 32 }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName="Owner" />
      <div style={{ flex: 1, padding: 32, maxWidth: 1200 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Owner Dashboard
        </h1>

        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <StatCard label="Today's Sales" value={String(data.todaySalesCount)} />
          <StatCard label="Expected Revenue Today" value={`${data.todayExpectedRevenue.toFixed(2)} Birr`} accent="var(--color-primary)" />
          <StatCard label="Low Stock" value={String(data.lowStock.length)} accent={data.lowStock.length > 0 ? 'var(--color-warning)' : undefined} />
          <StatCard label="Out of Stock" value={String(data.outOfStock.length)} accent={data.outOfStock.length > 0 ? 'var(--color-danger)' : undefined} />
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          <div className="card fade-in" style={{ flex: 1, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Stock Alerts</h2>
            {data.lowStock.length === 0 && data.outOfStock.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Nothing to flag right now.</p>
            )}
            {data.outOfStock.map((p) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 14 }}>{p.name}</span>
                <span className="badge badge-danger">Out of stock</span>
              </div>
            ))}
            {data.lowStock.map((p) => (
              <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 14 }}>{p.name}</span>
                <span className="badge badge-warning">{p.remaining} left</span>
              </div>
            ))}
          </div>

          <div className="card fade-in" style={{ flex: 1, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Activity</h2>
            {data.recentActivity.length === 0 && (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>No sales yet today.</p>
            )}
            {data.recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                <span>{a.employeeName} sold {a.itemCount} item(s) — {a.total.toFixed(2)} Birr</span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>
                  {new Date(a.time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}