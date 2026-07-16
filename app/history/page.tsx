'use client'

import { useState, useEffect } from 'react'

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

  useEffect(() => {
    fetch('/api/sales-history')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSales(data.sales)
      })
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <h1>Sales History</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Time</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Employee</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Items</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Total</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>Status</th>
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
              <td>{sale.total.toFixed(2)} Birr</td>
              <td>{sale.voided ? 'Voided' : 'Completed'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}