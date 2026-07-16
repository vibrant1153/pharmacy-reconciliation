'use client'

import { useState, useEffect } from 'react'

interface DashboardData {
  todaySalesCount: number
  todayExpectedRevenue: number
  lowStock: { name: string; remaining: number }[]
  outOfStock: { name: string }[]
  recentActivity: { employeeName: string; itemCount: number; total: number; time: string }[]
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
    const interval = setInterval(loadDashboard, 15000) // refresh every 15s
    return () => clearInterval(interval)
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  if (!data) return <div style={{ padding: 24 }}>Loading...</div>

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Owner Dashboard</h1>
        <div>
          <a href="/products" style={{ marginRight: 16 }}>Medicine Management</a>
          <a href="/history" style={{ marginRight: 16 }}>Sales History</a>
          <a href="/audit" style={{ marginRight: 16 }}>Audit History</a>
          <button onClick={logout} style={{ padding: 8 }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        <div style={{ border: '1px solid #ccc', padding: 16, minWidth: 160 }}>
          <div>Today's Sales</div>
          <strong style={{ fontSize: 24 }}>{data.todaySalesCount}</strong>
        </div>
        <div style={{ border: '1px solid #ccc', padding: 16, minWidth: 160 }}>
          <div>Expected Revenue Today</div>
          <strong style={{ fontSize: 24 }}>{data.todayExpectedRevenue.toFixed(2)} Birr</strong>
        </div>
        <div style={{ border: '1px solid #ccc', padding: 16, minWidth: 160 }}>
          <div>Low Stock</div>
          <strong style={{ fontSize: 24 }}>{data.lowStock.length}</strong>
        </div>
        <div style={{ border: '1px solid #ccc', padding: 16, minWidth: 160 }}>
          <div>Out of Stock</div>
          <strong style={{ fontSize: 24 }}>{data.outOfStock.length}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <h2>Low Stock</h2>
          {data.lowStock.length === 0 && <p>Nothing low right now.</p>}
          <ul>
            {data.lowStock.map((p) => (
              <li key={p.name}>{p.name} — {p.remaining} strips left</li>
            ))}
          </ul>

          {data.outOfStock.length > 0 && (
            <>
              <h2>Out of Stock</h2>
              <ul>
                {data.outOfStock.map((p) => (
                  <li key={p.name}>{p.name}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <h2>Recent Activity</h2>
          {data.recentActivity.length === 0 && <p>No sales yet today.</p>}
          <ul>
            {data.recentActivity.map((a, i) => (
              <li key={i}>
                {a.employeeName} sold {a.itemCount} item(s) — {a.total.toFixed(2)} Birr
                <span style={{ color: '#888', marginLeft: 8 }}>
                  {new Date(a.time).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}