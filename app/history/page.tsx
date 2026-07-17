'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'

interface SaleRecord {
  id: string
  employeeName: string
  total: number
  voided: boolean
  createdAt: string
  items: { productName: string; quantity: number; pricePerStrip: number }[]
}

export default function HistoryPage() {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [user, setUser] = useState<{ name: string; role: 'OWNER' | 'EMPLOYEE' } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((data) => {
      if (data.success) setUser({ name: data.name, role: data.role })
    })
    fetch('/api/sales-history')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSales(data.sales)
      })
  }, [])

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar userName={user?.name ?? '...'} role={user?.role ?? 'EMPLOYEE'} />
      <div style={{ flex: 1, padding: 32, maxWidth: 1100 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.02em' }}>
          Sales History
        </h1>

        <div className="card fade-in" style={{ padding: 24 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Employee</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} style={{ opacity: sale.voided ? 0.5 : 1 }}>
                  <td>{new Date(sale.createdAt).toLocaleString()}</td>
                  <td>{sale.employeeName}</td>
                  <td>
                    {sale.items.map((i, idx) => (
                      <div key={idx}>{i.quantity} x {i.productName}</div>
                    ))}
                  </td>
                  <td style={{ fontWeight: 600 }}>{sale.total.toFixed(2)} Birr</td>
                  <td>
                    <span className={`badge ${sale.voided ? 'badge-neutral' : 'badge-success'}`}>
                      {sale.voided ? 'Voided' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, padding: '20px 0' }}>
              No sales recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}